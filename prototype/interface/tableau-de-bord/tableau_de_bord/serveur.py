"""Serveur du tableau de bord : page d'accueil de la box (https://<domaine>), état en direct, journal d'audit.

Bibliothèque standard uniquement. L'état des services, des sauvegardes et des connexions sortantes est
visible de tous les postes du cabinet ; le journal d'audit (qui a demandé quoi à l'assistant) est réservé
aux associés et administrateurs, vérifiés par Nextcloud. Le tableau de bord ne garde aucun mot de passe.
"""
import base64
import json
import secrets
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from http import cookies
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from . import collecte, config

PAGE = (Path(__file__).parent / "page.html").read_bytes()
DUREE_SESSION = 8 * 3600
TAILLE_MAX = 16 * 1024
POLITIQUE = ("default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; "
             "img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")

sessions: dict[str, tuple[str, str, float]] = {}
verrou_sessions = threading.Lock()
verrou_journal = threading.Lock()


def journaliser(type_evenement, utilisateur, detail, resultat="ok"):
    ligne = {"date": datetime.now().astimezone().isoformat(timespec="seconds"), "source": "tableau-de-bord",
             "type": type_evenement, "utilisateur": utilisateur, "detail": detail, "resultat": resultat}
    with verrou_journal:
        with config.JOURNAL.open("a", encoding="utf-8") as fichier:
            fichier.write(json.dumps(ligne, ensure_ascii=False) + "\n")


class Refus(Exception):
    pass


def verifier_compte(login, mot_de_passe, ip):
    """Vérifie l'identifiant auprès de Nextcloud et renvoie (login, nom, admin). Le mot de passe n'est pas gardé."""
    entetes = {"Authorization": "Basic " + base64.b64encode(f"{login}:{mot_de_passe}".encode()).decode(),
               "OCS-APIRequest": "true", "Host": "nextcloud", "X-Forwarded-For": ip}

    def ocs(chemin):
        requete = urllib.request.Request(config.NC_URL + chemin, headers=entetes)
        try:
            with urllib.request.urlopen(requete, timeout=15) as reponse:
                return json.loads(reponse.read())["ocs"]["data"]
        except urllib.error.HTTPError as erreur:
            if erreur.code in (401, 403):
                raise Refus() from None
            raise

    profil = ocs("/ocs/v1.php/cloud/user?format=json")
    identifiant = profil["id"]
    groupes = ocs(f"/ocs/v1.php/cloud/users/{urllib.parse.quote(identifiant)}?format=json").get("groups") or []
    nom = profil.get("display-name") or profil.get("displayname") or identifiant
    return identifiant, nom, bool(set(groupes) & config.GROUPES_ADMIN)


class Gestionnaire(BaseHTTPRequestHandler):
    server_version = "tableau-de-bord-box"
    protocol_version = "HTTP/1.1"

    def log_message(self, format, *args):
        sys.stderr.write(f"{self.address_string()} {format % args}\n")

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

    def _session(self):
        biscuit = cookies.SimpleCookie(self.headers.get("Cookie", "")).get("tdb")
        if not biscuit:
            return None
        with verrou_sessions:
            session = sessions.get(biscuit.value)
            if session and session[2] > time.time():
                return session
            sessions.pop(biscuit.value, None)
        return None

    def do_GET(self):
        adresse = urllib.parse.urlsplit(self.path)
        if adresse.path in ("/", "/index.html"):
            return self._repondre(PAGE, type_contenu="text/html; charset=utf-8",
                                  entetes={"Content-Security-Policy": POLITIQUE, "Referrer-Policy": "no-referrer"})
        if adresse.path == "/api/sante":
            return self._repondre({"ok": True})
        if adresse.path == "/api/resume":
            return self._repondre(collecte.resume())
        session = self._session()
        if adresse.path == "/api/session":
            return self._repondre({"connecte": bool(session), **({"login": session[0], "nom": session[1]} if session else {})})
        if adresse.path == "/api/journal":
            if session is None:
                return self._repondre({"erreur": "Connexion nécessaire."}, 401)
            parametres = urllib.parse.parse_qs(adresse.query)
            categorie = parametres.get("categorie", [""])[0]
            if categorie not in ("", "acces", "refus", "sortie", "sauvegarde", "systeme"):
                return self._repondre({"erreur": "Catégorie inconnue."}, 400)
            return self._repondre(collecte.journal(categorie))
        self._repondre({"erreur": "Introuvable."}, 404)

    def do_POST(self):
        chemin = urllib.parse.urlsplit(self.path).path
        longueur = int(self.headers.get("Content-Length", 0) or 0)
        # Type JSON exigé : un formulaire d'un autre site ne peut pas envoyer cette requête sans le navigateur.
        if longueur > TAILLE_MAX or "application/json" not in self.headers.get("Content-Type", ""):
            return self._repondre({"erreur": "Requête invalide."}, 400)
        try:
            corps = json.loads(self.rfile.read(longueur) or b"{}")
        except ValueError:
            return self._repondre({"erreur": "Requête invalide."}, 400)
        if chemin == "/api/connexion":
            return self._connexion(corps)
        if chemin == "/api/deconnexion":
            session = self._session()
            biscuit = cookies.SimpleCookie(self.headers.get("Cookie", "")).get("tdb")
            if biscuit:
                with verrou_sessions:
                    sessions.pop(biscuit.value, None)
            if session:
                journaliser("deconnexion", session[0], {})
            return self._repondre({"ok": True}, entetes={"Set-Cookie": "tdb=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict"})
        self._repondre({"erreur": "Introuvable."}, 404)

    def _connexion(self, corps):
        login, mot_de_passe = str(corps.get("login", "")).strip(), str(corps.get("mot_de_passe", ""))
        if not login or not mot_de_passe:
            return self._repondre({"erreur": "Identifiant et mot de passe nécessaires."}, 400)
        try:
            identifiant, nom, admin = verifier_compte(login, mot_de_passe, self._ip())
        except Refus:
            journaliser("connexion", login, {"ip": self._ip()}, "refus")
            return self._repondre({"erreur": "Identifiant ou mot de passe incorrect."}, 401)
        except Exception:
            return self._repondre({"erreur": "Nextcloud ne répond pas."}, 502)
        if not admin:
            journaliser("connexion", identifiant, {"ip": self._ip(), "motif": "journal réservé aux associés"}, "refus")
            return self._repondre({"erreur": "Le journal d'audit est réservé aux associés du cabinet."}, 403)
        jeton = secrets.token_urlsafe(32)
        with verrou_sessions:
            sessions[jeton] = (identifiant, nom, time.time() + DUREE_SESSION)
        journaliser("connexion", identifiant, {"ip": self._ip()})
        securise = "; Secure" if self.headers.get("X-Forwarded-Proto") == "https" else ""
        self._repondre({"login": identifiant, "nom": nom},
                       entetes={"Set-Cookie": f"tdb={jeton}; HttpOnly; SameSite=Strict; Path=/{securise}"})


def lancer():
    config.JOURNAUX.mkdir(parents=True, exist_ok=True)
    serveur = ThreadingHTTPServer(("0.0.0.0", config.PORT), Gestionnaire)
    serveur.daemon_threads = True
    print(f"Tableau de bord prêt sur le port {config.PORT}", flush=True)
    serveur.serve_forever()
