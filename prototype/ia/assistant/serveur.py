"""Serveur web de l'assistant : page de conversation, connexion avec le compte Nextcloud de la personne,
réponses envoyées au fil de l'eau (text/event-stream), ouverture des documents cités.

Bibliothèque standard uniquement. Derrière le reverse proxy TLS de la box : https://ia.<domaine>.
"""
import base64
import hashlib
import json
import secrets
import sys
import threading
import time
import urllib.parse
from http import cookies
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from . import actions, config, journal, modeles
from .index import Index
from .moteur import Moteur, MoteurIndisponible
from .nextcloud import AccesRefuse, Client, Indisponible
from .reponse import Session, repondre

INTERFACE = (Path(__file__).parent / "interface.html").read_bytes()
PAGE_MODELES = (Path(__file__).parent / "modeles.html").read_bytes()
PAGE_JOURNAL = (Path(__file__).parent / "journal.html").read_bytes()
PAGE_CONNEXION = (Path(__file__).parent / "connexion.html").read_bytes()
# Connexion unique : un seul cookie pour toute la box (accueil, assistant, fichiers). Le reverse proxy demande
# à /api/verifier si la personne est connectée avant de servir l'accueil et Nextcloud.
COOKIE = "box_session"
# Chemins de Nextcloud utilisés par les applications de synchronisation (bureau, téléphone) : jamais redirigés
# vers la page de connexion de la box, ils gardent leur propre authentification.
CHEMINS_CLIENTS_NC = ("/remote.php", "/public.php", "/ocs/", "/status.php", "/.well-known", "/index.php/login/v2",
                      "/login/v2", "/index.php/s/", "/s/", "/apps/theming/", "/core/", "/dist/", "/apps/files_sharing/publicpreview")
DUREE_SESSION = 8 * 3600
TAILLE_MAX = 64 * 1024
POLITIQUE = ("default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; "
             "img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'self'")

moteur = Moteur()
index = Index(moteur)
etat = {"pret": False, "message": "Démarrage"}
sessions: dict[str, tuple[Session, float]] = {}
sessions_basic: dict[str, tuple[Session, float]] = {}
verrou_sessions = threading.Lock()


_generation = 0


def preparer():
    """En tâche de fond : attend le moteur, charge les modèles, complète l'index si besoin. Relancée à chaque
    changement de modèle ; une préparation plus ancienne s'arrête d'elle-même."""
    global _generation
    _generation += 1
    moi = _generation
    etat.update(pret=False, message="Démarrage")
    while not moteur.pret():
        if moi != _generation:
            return
        etat["message"] = (f"Modèle {moteur.modele} indisponible : à installer ou à démarrer (page Modèles d'IA)"
                           if moteur.modele else "Aucun modèle choisi : ouvrir la page Modèles d'IA")
        time.sleep(5)
    try:
        etat["message"] = f"Chargement de {moteur.modele} en mémoire"
        moteur.prechauffer()
        index.revectoriser()
        if moi == _generation:
            etat.update(pret=True, message="Prêt")
    except MoteurIndisponible as erreur:
        etat["message"] = f"Moteur indisponible : {erreur}"


def relancer_preparation():
    threading.Thread(target=preparer, daemon=True).start()


class Gestionnaire(BaseHTTPRequestHandler):
    server_version = "assistant-box"
    protocol_version = "HTTP/1.1"

    def log_message(self, format, *args):
        sys.stderr.write(f"{self.address_string()} {format % args}\n")

    # ------------------------------------------------------------ outils

    def _ip(self):
        return (self.headers.get("X-Forwarded-For") or self.client_address[0]).split(",")[0].strip()

    def _repondre(self, corps, statut=200, type_contenu="application/json; charset=utf-8", entetes=None):
        donnees = json.dumps(corps, ensure_ascii=False).encode() if isinstance(corps, (dict, list)) else corps
        self.send_response(statut)
        self.send_header("Content-Type", type_contenu)
        self.send_header("Content-Length", str(len(donnees)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        for cle, valeur in (entetes or {}).items():
            self.send_header(cle, valeur)
        self.end_headers()
        self.wfile.write(donnees)

    def _json(self):
        longueur = int(self.headers.get("Content-Length", 0))
        if longueur > TAILLE_MAX or "application/json" not in self.headers.get("Content-Type", ""):
            return None
        try:
            return json.loads(self.rfile.read(longueur) or b"{}")
        except ValueError:
            return None

    def _session(self) -> Session | None:
        maintenant = time.time()
        biscuit = cookies.SimpleCookie(self.headers.get("Cookie", "")).get(COOKIE)
        with verrou_sessions:
            if biscuit and biscuit.value in sessions:
                session, expire = sessions[biscuit.value]
                if expire > maintenant:
                    return session
                del sessions[biscuit.value]
        # Accès par script (évaluation, tableau de bord) : identifiants Nextcloud en Basic, vérifiés par Nextcloud.
        entete = self.headers.get("Authorization", "")
        if entete.startswith("Basic "):
            cle = hashlib.sha256(entete.encode()).hexdigest()
            with verrou_sessions:
                if cle in sessions_basic and sessions_basic[cle][1] > maintenant:
                    return sessions_basic[cle][0]
            login, _, secret = base64.b64decode(entete[6:]).decode().partition(":")
            client = Client(login, secret, self._ip())
            try:
                profil = client.profil()
            except (AccesRefuse, Indisponible):
                return None
            session = Session(profil["login"], profil["nom"], client, _admin(client))
            with verrou_sessions:
                sessions_basic[cle] = (session, maintenant + 600)
            return session
        return None

    # ------------------------------------------------------------ GET

    def do_GET(self):
        chemin = urllib.parse.urlsplit(self.path).path
        if chemin == "/connexion":
            return self._repondre(PAGE_CONNEXION, type_contenu="text/html; charset=utf-8",
                                  entetes={"Content-Security-Policy": POLITIQUE, "Referrer-Policy": "no-referrer"})
        if chemin == "/api/verifier":
            return self._verifier()
        if chemin == "/deconnexion":
            session = self._session()
            if session is not None:
                self._fermer(session)
            return self._repondre(b"", 303, "text/plain", {"Location": f"https://{config.BOX_DOMAIN}/connexion",
                                                           "Set-Cookie": self._cookie("", 0)})
        if chemin in ("/", "/index.html", "/modeles", "/journal"):
            page = {"/modeles": PAGE_MODELES, "/journal": PAGE_JOURNAL}.get(chemin, INTERFACE)
            return self._repondre(page,
                                  type_contenu="text/html; charset=utf-8",
                                  entetes={"Content-Security-Policy": POLITIQUE, "Referrer-Policy": "no-referrer"})
        if chemin == "/api/etat":
            return self._repondre({**etat, "modele": moteur.modele, "modele_embeddings": moteur.modele_embeddings,
                                   "documents_indexes": len(index.fichiers), "extraits": len(index.morceaux),
                                   "recherche_semantique": index.vecteurs is not None})
        session = self._session()
        if chemin == "/api/session":
            return self._repondre({"connecte": session is not None,
                                   **({"login": session.login, "nom": session.nom, "admin": session.admin}
                                      if session else {})})
        if session is None:
            return self._repondre({"erreur": "Connexion nécessaire."}, 401)
        if chemin == "/api/journal":
            return self._repondre(journal.lire(session.login))
        if chemin == "/api/journal/tout":
            if not session.admin:
                return self._repondre({"erreur": "Réservé aux administrateurs du cabinet."}, 403)
            return self._repondre(journal.lire_tout())
        if chemin == "/api/modeles":
            if not session.admin:
                return self._repondre({"erreur": "Réservé aux administrateurs du cabinet."}, 403)
            return self._repondre({**modeles.etat(moteur), "pret": etat["pret"], "message": etat["message"]})
        if chemin.startswith("/api/document/"):
            return self._document(session, urllib.parse.unquote(chemin.rsplit("/", 1)[1]))
        self._repondre({"erreur": "Introuvable."}, 404)

    def _document(self, session, fileid):
        """Document cité, relu avec les droits de la personne : Nextcloud refuse s'il ne lui est plus visible."""
        try:
            fichier = next((f for f in session.client.fichiers() if f.fileid == fileid), None)
            if fichier is None:
                return self._repondre({"erreur": "Document introuvable ou non accessible."}, 404)
            contenu = session.client.telecharger(fichier)
        except (AccesRefuse, Indisponible):
            return self._repondre({"erreur": "Nextcloud ne répond pas."}, 502)
        nom = urllib.parse.quote(fichier.nom)
        self._repondre(contenu, type_contenu=fichier.type_mime or "application/octet-stream",
                       entetes={"Content-Disposition": f"inline; filename*=UTF-8''{nom}"})

    # ------------------------------------------------------------ POST

    def do_POST(self):
        chemin = urllib.parse.urlsplit(self.path).path
        corps = self._json()
        if corps is None:
            return self._repondre({"erreur": "Requête invalide."}, 400)
        if chemin == "/api/connexion":
            return self._connexion(corps)
        session = self._session()
        if session is None:
            return self._repondre({"erreur": "Connexion nécessaire."}, 401)
        if chemin == "/api/deconnexion":
            return self._deconnexion(session)
        if chemin == "/api/question":
            historique = [(str(q)[:1500], str(r)[:1500]) for q, r in (corps.get("historique") or [])[-3:]
                          if isinstance(q, str) and isinstance(r, str)]
            return self._question(session, str(corps.get("question", "")), historique)
        if chemin == "/api/action":
            return self._action(session, str(corps.get("jeton", "")), bool(corps.get("confirmer")))
        if chemin.startswith("/api/modeles/"):
            if not session.admin:
                return self._repondre({"erreur": "Réservé aux administrateurs du cabinet."}, 403)
            return self._modeles(session, chemin.rsplit("/", 1)[1], str(corps.get("id", "")))
        if chemin == "/api/indexer":
            nombre = index.mettre_a_jour(session.client, session.client.fichiers())
            journal.ecrire("indexation", session.login, {"documents_indexes": nombre})
            return self._repondre({"indexes": nombre, "documents": len(index.fichiers), "extraits": len(index.morceaux)})
        self._repondre({"erreur": "Introuvable."}, 404)

    def _connexion(self, corps):
        login, mot_de_passe = str(corps.get("login", "")).strip(), str(corps.get("mot_de_passe", ""))
        try:
            client = Client(login, mot_de_passe, self._ip())
            profil = client.profil()
            # La session garde un mot de passe d'application révocable, jamais le mot de passe de la personne.
            secret = client.creer_mot_de_passe_application()
        except AccesRefuse:
            journal.ecrire("connexion", login or None, {"ip": self._ip()}, "refus")
            return self._repondre({"erreur": "Identifiant ou mot de passe incorrect."}, 401)
        except (Indisponible, KeyError, ValueError):
            return self._repondre({"erreur": "Nextcloud ne répond pas."}, 502)
        jeton = secrets.token_urlsafe(32)
        client_session = Client(profil["login"], secret, self._ip())
        session = Session(profil["login"], profil["nom"], client_session, _admin(client_session), secret)
        with verrou_sessions:
            sessions[jeton] = (session, time.time() + DUREE_SESSION)
        journal.ecrire("connexion", session.login, {"ip": self._ip()})
        self._repondre({"login": session.login, "nom": session.nom}, entetes={"Set-Cookie": self._cookie(jeton)})

    def _cookie(self, valeur, duree=DUREE_SESSION):
        """Cookie valable pour le domaine de la box et tous ses sous-domaines (cloud., ia., coffre.)."""
        securise = "; Secure" if self.headers.get("X-Forwarded-Proto") == "https" else ""
        return f"{COOKIE}={valeur}; Max-Age={duree}; Domain={config.BOX_DOMAIN}; Path=/; HttpOnly; SameSite=Lax{securise}"

    def _verifier(self):
        """Appelé par le reverse proxy (forward_auth) avant l'accueil (service=accueil) et Nextcloud (service=cloud).
        Connecté : 200, et pour Nextcloud l'en-tête Authorization avec le mot de passe d'application de la
        personne (Nextcloud ouvre alors sa session sans redemander le mot de passe). Sinon : redirection vers
        la page de connexion, sauf pour les applications de synchronisation, qui gardent leur authentification."""
        service = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query).get("service", ["accueil"])[0]
        hote = self.headers.get("X-Forwarded-Host", config.BOX_DOMAIN)
        uri = self.headers.get("X-Forwarded-Uri", "/")
        session = self._session() if not self.headers.get("Authorization") else None
        if service == "cloud":
            if self.headers.get("Authorization"):
                # Identifiants propres du client (synchronisation) : renvoyés tels quels, car le reverse proxy
                # remplace l'en-tête de la requête par celui de cette réponse.
                return self._repondre(b"", 200, "text/plain", {"Authorization": self.headers["Authorization"]})
            if session is not None:
                jeton = base64.b64encode(f"{session.login}:{session.secret}".encode()).decode()
                return self._repondre(b"", 200, "text/plain", {"Authorization": f"Basic {jeton}"})
            page = self.headers.get("X-Forwarded-Method", "GET") == "GET" and "text/html" in self.headers.get("Accept", "")
            if not page or urllib.parse.urlsplit(uri).path.startswith(CHEMINS_CLIENTS_NC):
                return self._repondre(b"", 200, "text/plain")
        elif session is not None:
            return self._repondre(b"", 200, "text/plain")
        retour = urllib.parse.quote(f"https://{hote}{uri}", safe="")
        self._repondre(b"", 302, "text/plain", {"Location": f"https://{config.BOX_DOMAIN}/connexion?retour={retour}"})

    def _fermer(self, session):
        """Révoque le mot de passe d'application : la session Nextcloud ouverte avec lui se ferme aussi."""
        try:
            session.client.revoquer_mot_de_passe_application()
        except (AccesRefuse, Indisponible):
            pass
        with verrou_sessions:
            for jeton in [j for j, (s, _) in sessions.items() if s is session]:
                del sessions[jeton]
        journal.ecrire("deconnexion", session.login, {})

    def _deconnexion(self, session):
        self._fermer(session)
        self._repondre({"ok": True}, entetes={"Set-Cookie": self._cookie("", 0)})

    def _modeles(self, session, action, identifiant):
        try:
            if action == "installer":
                return self._flux(modeles.installer(identifiant, session.login))
            if action == "activer":
                modeles.activer(identifiant, moteur, index, session.login)
            elif action == "recherche-par-mots":
                modeles.desactiver_recherche(moteur, index, session.login)
            elif action == "supprimer":
                modeles.supprimer(identifiant, moteur, session.login)
            else:
                return self._repondre({"erreur": "Action inconnue."}, 404)
        except KeyError:
            return self._repondre({"erreur": "Modèle inconnu."}, 404)
        except (ValueError, MoteurIndisponible) as erreur:
            return self._repondre({"erreur": str(erreur)}, 400)
        if action != "supprimer":
            relancer_preparation()
        self._repondre({"ok": True})

    def _flux(self, evenements):
        """Envoie des événements au fil de l'eau (text/event-stream), terminés par « fin » ou « erreur »."""
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Connection", "close")
        self.end_headers()
        self.close_connection = True
        try:
            for evenement in evenements:
                self.wfile.write(f"data: {json.dumps(evenement, ensure_ascii=False)}\n\n".encode())
                self.wfile.flush()
            fin = {"type": "fin"}
        except (BrokenPipeError, ConnectionResetError):
            return
        except (ValueError, MoteurIndisponible) as erreur:
            fin = {"type": "erreur", "texte": str(erreur)}
        self.wfile.write(f"data: {json.dumps(fin, ensure_ascii=False)}\n\n".encode())

    def _action(self, session, jeton, confirmer):
        """Exécute (ou annule) une action proposée par l'assistant, avec les droits Nextcloud de la personne."""
        proposition = actions.reprendre(jeton, session.login)
        if proposition is None:
            return self._repondre({"erreur": "Cette proposition a expiré : reformulez la demande."}, 410)
        type_journal = f"action_{proposition.type}"
        if not confirmer:
            journal.ecrire(type_journal, session.login, {**actions._public(proposition.details)}, "annulee")
            return self._repondre({"texte": "Action annulée : rien n'a été modifié."})
        try:
            texte = actions.executer(session, proposition)
        except AccesRefuse:
            journal.ecrire(type_journal, session.login, actions._public(proposition.details), "refus")
            return self._repondre({"erreur": "Nextcloud refuse : vous n'avez pas le droit de modifier cet emplacement."}, 403)
        except Indisponible as erreur:
            journal.ecrire(type_journal, session.login, {**actions._public(proposition.details), "erreur": str(erreur)[:120]}, "echec")
            existe = "405" in str(erreur) or "412" in str(erreur)
            return self._repondre({"erreur": "Ce dossier existe déjà." if existe else "Nextcloud n'a pas pu enregistrer l'action."}, 409 if existe else 502)
        journal.ecrire(type_journal, session.login, actions._public(proposition.details))
        self._repondre({"texte": texte, "lien": actions.lien(proposition, config.BOX_DOMAIN)})

    def _question(self, session, question, historique=()):
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Accel-Buffering", "no")
        self.send_header("Connection", "close")
        self.end_headers()
        self.close_connection = True

        def envoyer(evenement):
            self.wfile.write(f"data: {json.dumps(evenement, ensure_ascii=False)}\n\n".encode())
            self.wfile.flush()

        if not question.strip():
            return envoyer({"type": "erreur", "texte": "Question vide."})
        if not etat["pret"]:
            return envoyer({"type": "erreur", "texte": f"L'assistant n'est pas prêt : {etat['message']}."})
        try:
            for evenement in repondre(session, question, index, moteur, historique):
                envoyer(evenement)
        except (BrokenPipeError, ConnectionResetError):
            pass  # page fermée : la génération s'arrête avec la connexion au moteur
        except (Indisponible, AccesRefuse):
            envoyer({"type": "erreur", "texte": "Nextcloud ne répond pas, ou la session a expiré."})
        except MoteurIndisponible as erreur:
            envoyer({"type": "erreur", "texte": f"Le moteur d'IA local ne répond pas ({erreur})."})


def _admin(client):
    try:
        return bool(set(client.groupes()) & config.GROUPES_ADMIN)
    except (AccesRefuse, Indisponible, KeyError, ValueError):
        return False


def lancer():
    relancer_preparation()
    serveur = ThreadingHTTPServer(("0.0.0.0", config.PORT), Gestionnaire)
    serveur.daemon_threads = True
    print(f"Assistant prêt à recevoir des connexions sur le port {config.PORT} "
          f"(modèle {moteur.modele}, recherche {moteur.modele_embeddings})", flush=True)
    serveur.serve_forever()
