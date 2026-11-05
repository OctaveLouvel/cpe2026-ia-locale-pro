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
from datetime import datetime, timedelta
from http import cookies
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from . import config, consignes, journal, modeles
from .fiches import Fiches
from .index import Index
from .moteur import Moteur, MoteurIndisponible
from .nextcloud import PARIS, AccesRefuse, Client, Indisponible
from .recherche import evenements_utiles
from .reponse import Session, dossiers_visibles, repondre

INTERFACE = (Path(__file__).parent / "interface.html").read_bytes()
PAGE_MODELES = (Path(__file__).parent / "modeles.html").read_bytes()
PAGE_JOURNAL = (Path(__file__).parent / "journal.html").read_bytes()
DUREE_SESSION = 8 * 3600
TAILLE_MAX = 64 * 1024
POLITIQUE = ("default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; "
             "img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'self'")

moteur = Moteur()
index = Index(moteur)
fiches = Fiches(index, moteur)
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
        biscuit = cookies.SimpleCookie(self.headers.get("Cookie", "")).get("session")
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
        if chemin in ("/", "/index.html", "/modeles", "/journal"):
            page = {"/modeles": PAGE_MODELES, "/journal": PAGE_JOURNAL}.get(chemin, INTERFACE)
            return self._repondre(page,
                                  type_contenu="text/html; charset=utf-8",
                                  entetes={"Content-Security-Policy": POLITIQUE, "Referrer-Policy": "no-referrer"})
        if chemin == "/api/etat":
            return self._repondre({**etat, "modele": moteur.modele, "modele_embeddings": moteur.modele_embeddings,
                                   "documents_indexes": len(index.fichiers), "extraits": len(index.morceaux),
                                   "recherche_semantique": index.vecteurs is not None,
                                   "fiches": fiches.progression()})
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
        if chemin == "/api/dossiers":
            return self._dossiers(session)
        if chemin == "/api/dossier":
            nom = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query).get("nom", [""])[0]
            return self._dossier(session, nom)
        if chemin.startswith("/api/document/"):
            return self._document(session, urllib.parse.unquote(chemin.rsplit("/", 1)[1]))
        self._repondre({"erreur": "Introuvable."}, 404)

    def _dossiers(self, session):
        """Dossiers clients que la personne voit, pour la liste de choix de l'interface."""
        try:
            fichiers = session.client.fichiers()
            # À l'ouverture de l'assistant : une pièce ajoutée est indexée (sa fiche suivra), une supprimée retirée.
            index.synchroniser(session.client, fichiers)
        except (AccesRefuse, Indisponible):
            return self._repondre({"erreur": "Nextcloud ne répond pas."}, 502)
        par_dossier = dossiers_visibles(fichiers, index)
        return self._repondre([{"nom": nom, "pieces": len(pieces),
                                "fiche": fiches.dossier(nom, {f.fileid for f in pieces}) is not None}
                               for nom, pieces in par_dossier.items()])

    def _dossier(self, session, nom):
        """Fiche d'un dossier : texte préparé à l'avance (s'il est à jour et que la personne voit exactement les
        mêmes pièces), échéances lues dans l'agenda de la personne, liste des pièces. Aucun appel au modèle."""
        try:
            fichiers = session.client.fichiers()
            index.synchroniser(session.client, fichiers)
            pieces = dossiers_visibles(fichiers, index).get(nom)
            if pieces is None:
                return self._repondre({"erreur": "Dossier introuvable ou non accessible."}, 404)
            maintenant = datetime.now(PARIS)
            evenements = session.client.evenements(maintenant - timedelta(days=1),
                                                   maintenant + timedelta(days=config.JOURS_AGENDA))
        except (AccesRefuse, Indisponible):
            return self._repondre({"erreur": "Nextcloud ne répond pas."}, 502)
        par_id = {f.fileid: f for f in pieces}
        fiches.demander({nom})
        fiche = fiches.dossier(nom, set(par_id))
        echeances = [{"titre": e.titre, "quand": _quand_court(e), "lieu": e.lieu, "agenda": e.agenda,
                      "lien_nextcloud": f"https://cloud.{config.BOX_DOMAIN}/apps/calendar/dayGridMonth/"
                                        f"{e.debut.date().isoformat()}"}
                     for e in evenements_utiles(evenements, {nom}, maintenant, limite=10)]
        corps = {"nom": nom, "echeances": echeances, "fiches_pretes": fiches.avancement(par_id),
                 "pieces": [{"titre": f.nom, "lien": f"/api/document/{f.fileid}",
                             "fiche": fiches.piece(f.fileid)} for f in pieces]}
        if fiche:
            corps["fiche"] = {"texte": fiche["texte"], "date": fiche["date"], "modele": fiche["modele"],
                              "sources": [{"numero": n, "titre": par_id[f].nom, "lien": f"/api/document/{f}"}
                                          for n, f in enumerate(fiche["ordre"], 1) if f in par_id]}
        journal.ecrire("fiche_dossier", session.login, {"dossier": nom, "fiche": bool(fiche)})
        return self._repondre(corps)

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
            return self._question(session, str(corps.get("question", "")), str(corps.get("dossier", "")))
        if chemin.startswith("/api/modeles/"):
            if not session.admin:
                return self._repondre({"erreur": "Réservé aux administrateurs du cabinet."}, 403)
            return self._modeles(session, chemin.rsplit("/", 1)[1], str(corps.get("id", "")))
        if chemin == "/api/indexer":
            nombre = index.synchroniser(session.client, session.client.fichiers())
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
        session = Session(profil["login"], profil["nom"], client_session, _admin(client_session))
        with verrou_sessions:
            sessions[jeton] = (session, time.time() + DUREE_SESSION)
        journal.ecrire("connexion", session.login, {"ip": self._ip()})
        securise = "; Secure" if self.headers.get("X-Forwarded-Proto") == "https" else ""
        self._repondre({"login": session.login, "nom": session.nom},
                       entetes={"Set-Cookie": f"session={jeton}; HttpOnly; SameSite=Strict; Path=/{securise}"})

    def _deconnexion(self, session):
        try:
            session.client.revoquer_mot_de_passe_application()
        except (AccesRefuse, Indisponible):
            pass
        with verrou_sessions:
            for jeton in [j for j, (s, _) in sessions.items() if s is session]:
                del sessions[jeton]
        journal.ecrire("deconnexion", session.login, {})
        self._repondre({"ok": True}, entetes={"Set-Cookie": "session=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict"})

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

    def _question(self, session, question, dossier=""):
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
            for evenement in repondre(session, question, index, moteur, fiches, dossier):
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


def _quand_court(evenement):
    jour = consignes.date_longue(evenement.debut.date())
    return jour if evenement.journee else f"{jour}, {consignes.heure(evenement.debut)}"


def lancer():
    relancer_preparation()
    threading.Thread(target=fiches.travailler, args=(lambda: etat["pret"],), daemon=True).start()
    serveur = ThreadingHTTPServer(("0.0.0.0", config.PORT), Gestionnaire)
    serveur.daemon_threads = True
    print(f"Assistant prêt à recevoir des connexions sur le port {config.PORT} "
          f"(modèle {moteur.modele}, recherche {moteur.modele_embeddings})", flush=True)
    serveur.serve_forever()
