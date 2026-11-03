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

from . import config, journal
from .index import Index
from .moteur import Moteur, MoteurIndisponible
from .nextcloud import AccesRefuse, Client, Indisponible
from .reponse import Session, repondre

INTERFACE = (Path(__file__).parent / "interface.html").read_bytes()
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


def preparer():
    """En tâche de fond : attend le moteur, charge les modèles, complète l'index si besoin."""
    while not moteur.pret():
        etat["message"] = f"Moteur d'IA injoignable ou modèle {moteur.modele} absent (./box.sh modeles-ia)"
        time.sleep(5)
    try:
        etat["message"] = "Chargement des modèles en mémoire"
        moteur.prechauffer()
        index.revectoriser()
        etat.update(pret=True, message="Prêt")
    except MoteurIndisponible as erreur:
        etat["message"] = f"Moteur indisponible : {erreur}"


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
            session = Session(profil["login"], profil["nom"], client)
            with verrou_sessions:
                sessions_basic[cle] = (session, maintenant + 600)
            return session
        return None

    # ------------------------------------------------------------ GET

    def do_GET(self):
        chemin = urllib.parse.urlsplit(self.path).path
        if chemin in ("/", "/index.html"):
            return self._repondre(INTERFACE, type_contenu="text/html; charset=utf-8",
                                  entetes={"Content-Security-Policy": POLITIQUE, "Referrer-Policy": "no-referrer"})
        if chemin == "/api/etat":
            return self._repondre({**etat, "modele": moteur.modele, "modele_embeddings": moteur.modele_embeddings,
                                   "documents_indexes": len(index.fichiers), "extraits": len(index.morceaux),
                                   "recherche_semantique": index.vecteurs is not None})
        session = self._session()
        if chemin == "/api/session":
            return self._repondre({"connecte": session is not None,
                                   **({"login": session.login, "nom": session.nom} if session else {})})
        if session is None:
            return self._repondre({"erreur": "Connexion nécessaire."}, 401)
        if chemin == "/api/journal":
            return self._repondre(journal.lire(session.login))
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
            return self._question(session, str(corps.get("question", "")))
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
        session = Session(profil["login"], profil["nom"], Client(profil["login"], secret, self._ip()))
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

    def _question(self, session, question):
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
            for evenement in repondre(session, question, index, moteur):
                envoyer(evenement)
        except (BrokenPipeError, ConnectionResetError):
            pass  # page fermée : la génération s'arrête avec la connexion au moteur
        except (Indisponible, AccesRefuse):
            envoyer({"type": "erreur", "texte": "Nextcloud ne répond pas, ou la session a expiré."})
        except MoteurIndisponible as erreur:
            envoyer({"type": "erreur", "texte": f"Le moteur d'IA local ne répond pas ({erreur})."})


def lancer():
    threading.Thread(target=preparer, daemon=True).start()
    serveur = ThreadingHTTPServer(("0.0.0.0", config.PORT), Gestionnaire)
    serveur.daemon_threads = True
    print(f"Assistant prêt à recevoir des connexions sur le port {config.PORT} "
          f"(modèle {moteur.modele}, recherche {moteur.modele_embeddings})", flush=True)
    serveur.serve_forever()
