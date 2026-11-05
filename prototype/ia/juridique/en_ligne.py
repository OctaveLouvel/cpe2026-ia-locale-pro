"""Recherche en ligne dans les API officielles : Légifrance (DILA) et Judilibre (Cour de cassation), sur le
portail PISTE (https://piste.gouv.fr). Optionnelle, désactivée par défaut.

La passerelle est un conteneur à part (« juridique-en-ligne »), le seul du pack relié à internet. L'assistant
reste sur le réseau interne et lui envoie une requête de recherche, jamais un document du cabinet :
- l'assistant retire de la question les noms propres et les numéros (voir recherche.requete_publique) ;
- la passerelle refuse une requête trop longue et inscrit chaque appel au journal d'audit, avec le texte
  exact envoyé et la personne qui a posé la question ;
- les identifiants PISTE (PISTE_CLIENT_ID, PISTE_CLIENT_SECRET, et PISTE_CLE_API pour Judilibre) sont dans le
  fichier .env de la box, jamais dans le dépôt. Sans eux, la passerelle répond « inactive » et rien ne sort.

Écrit d'après la documentation publique des deux API : exemples d'utilisation de l'API Légifrance (DILA) et
spécification OpenAPI de Judilibre (dépôt Cour-de-cassation/judilibre-search, en-tête « KeyId »). Non testé faute
de compte PISTE : à valider sur le bac à sable (PISTE_ENVIRONNEMENT=bac_a_sable) avant la mise en service.
"""
import json
import os
import re
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from . import journal

ENVIRONNEMENTS = {
    "production": ("https://oauth.piste.gouv.fr/api/oauth/token", "https://api.piste.gouv.fr"),
    "bac_a_sable": ("https://sandbox-oauth.piste.gouv.fr/api/oauth/token", "https://sandbox-api.piste.gouv.fr"),
}
LEGIFRANCE = "/dila/legifrance/lf-engine-app"
JUDILIBRE = "/cassation/judilibre/v1.0"
LONGUEUR_MAX = 300
DELAI = 20


class Indisponible(Exception):
    pass


def _date_ms(valeur):
    """Les dates de Légifrance sont en millisecondes depuis 1970."""
    if isinstance(valeur, (int, float)):
        return datetime.fromtimestamp(valeur / 1000, timezone.utc).date().isoformat()
    return str(valeur or "")[:10]


def _sans_html(texte):
    return " ".join(re.sub(r"<[^>]+>", " ", texte or "").split())


class Piste:
    def __init__(self, client_id=None, secret=None, environnement=None):
        self.client_id = client_id or os.environ.get("PISTE_CLIENT_ID", "")
        self.secret = secret or os.environ.get("PISTE_CLIENT_SECRET", "")
        self.cle_api = os.environ.get("PISTE_CLE_API", "")  # Judilibre : en-tête KeyId ; à défaut, jeton OAuth
        self.oauth, self.api = ENVIRONNEMENTS[environnement or os.environ.get("PISTE_ENVIRONNEMENT", "production")]
        self._jeton, self._expire = None, 0
        self._verrou = threading.Lock()

    @property
    def active(self):
        return bool(self.client_id and self.secret)

    def _jeton_valide(self):
        with self._verrou:
            if self._jeton and time.time() < self._expire - 60:
                return self._jeton
            corps = urllib.parse.urlencode({"grant_type": "client_credentials", "client_id": self.client_id,
                                            "client_secret": self.secret, "scope": "openid"}).encode()
            requete = urllib.request.Request(self.oauth, data=corps,
                                             headers={"Content-Type": "application/x-www-form-urlencoded"})
            try:
                with urllib.request.urlopen(requete, timeout=DELAI) as r:
                    donnees = json.load(r)
            except (urllib.error.URLError, TimeoutError, ValueError) as erreur:
                raise Indisponible(f"authentification PISTE : {erreur}") from None
            self._jeton, self._expire = donnees["access_token"], time.time() + int(donnees.get("expires_in", 3600))
            return self._jeton

    def _appeler(self, chemin, corps=None, params=None):
        if not self.active:
            raise Indisponible("identifiants PISTE absents")
        adresse = self.api + chemin + (f"?{urllib.parse.urlencode(params, doseq=True)}" if params else "")
        if chemin.startswith(JUDILIBRE) and self.cle_api:
            acces = {"KeyId": self.cle_api}
        else:
            acces = {"Authorization": f"Bearer {self._jeton_valide()}"}
        requete = urllib.request.Request(adresse, data=json.dumps(corps).encode() if corps is not None else None,
                                         headers={**acces, "Accept": "application/json", "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(requete, timeout=DELAI) as r:
                return json.load(r)
        except urllib.error.HTTPError as erreur:
            raise Indisponible(f"HTTP {erreur.code} sur {chemin}") from None
        except (urllib.error.URLError, TimeoutError, ValueError) as erreur:
            raise Indisponible(str(erreur)) from None

    # ------------------------------------------------------------ Légifrance

    def articles(self, texte: str, nombre: int = 3) -> list[dict]:
        """Articles de codes en vigueur aujourd'hui, puis leur texte complet (un appel par article)."""
        maintenant = int(time.time() * 1000)
        corps = {"fond": "CODE_DATE", "recherche": {
            "champs": [{"typeChamp": "ALL", "operateur": "ET",
                        "criteres": [{"typeRecherche": "UN_DES_MOTS", "valeur": texte, "operateur": "ET"}]}],
            "filtres": [{"facette": "DATE_VERSION", "singleDate": maintenant}],
            "pageNumber": 1, "pageSize": nombre, "operateur": "ET", "sort": "PERTINENCE", "typePagination": "ARTICLE"}}
        resultats = self._appeler(f"{LEGIFRANCE}/search", corps).get("results", [])
        identifiants = []

        def parcourir(objet):  # les identifiants d'articles sont à plusieurs niveaux selon le type de résultat
            if isinstance(objet, dict):
                identifiant = objet.get("id")
                if isinstance(identifiant, str) and identifiant.startswith("LEGIARTI") and identifiant not in identifiants:
                    identifiants.append(identifiant)
                for valeur in objet.values():
                    parcourir(valeur)
            elif isinstance(objet, list):
                for valeur in objet:
                    parcourir(valeur)

        parcourir(resultats)
        articles = []
        for identifiant in identifiants[:nombre]:
            a = self._appeler(f"{LEGIFRANCE}/consult/getArticle", {"id": identifiant}).get("article") or {}
            titres = (a.get("context") or {}).get("titreTxt") or a.get("textTitles") or []
            code = titres[0].get("titre") or titres[0].get("titreCourt") if titres and isinstance(titres[0], dict) else ""
            articles.append({"id": identifiant, "titre": code or "", "num": a.get("num", ""), "etat": a.get("etat", ""),
                             "debut": _date_ms(a.get("dateDebut")), "fin": _date_ms(a.get("dateFin")),
                             "texte": _sans_html(a.get("texteHtml") or a.get("texte")),
                             "lien": f"https://www.legifrance.gouv.fr/codes/article_lc/{identifiant}"})
        return articles

    # ------------------------------------------------------------ Judilibre

    def decisions(self, texte: str, nombre: int = 3) -> list[dict]:
        donnees = self._appeler(f"{JUDILIBRE}/search", params={"query": texte, "page_size": nombre,
                                                                  "resolve_references": "true"})
        decisions = []
        for d in donnees.get("results", [])[:nombre]:
            extraits = (d.get("highlights") or {}).get("text") or []
            decisions.append({
                "id": d.get("id", ""), "juridiction": d.get("jurisdiction", ""), "formation": d.get("chamber", ""),
                "date": d.get("decision_date", ""), "numeros": d.get("number", ""), "ecli": d.get("ecli", ""),
                "solution": d.get("solution", ""), "publie": int(bool(d.get("publication"))),
                "sommaire": _sans_html(d.get("summary")), "extraits": [_sans_html(e) for e in extraits][:3],
                "lien": f"https://www.courdecassation.fr/decision/{d.get('id', '')}"})
        return decisions


# ------------------------------------------------------------ passerelle (conteneur juridique-en-ligne)

piste = None


class Passerelle(BaseHTTPRequestHandler):
    server_version = "passerelle-juridique"
    protocol_version = "HTTP/1.1"

    def log_message(self, format, *args):
        sys.stderr.write(f"{self.address_string()} {format % args}\n")

    def _repondre(self, corps, statut=200):
        donnees = json.dumps(corps, ensure_ascii=False).encode()
        self.send_response(statut)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(donnees)))
        self.end_headers()
        self.wfile.write(donnees)

    def do_GET(self):
        if self.path == "/etat":
            return self._repondre({"active": piste.active})
        self._repondre({"erreur": "Introuvable."}, 404)

    def do_POST(self):
        if self.path != "/rechercher":
            return self._repondre({"erreur": "Introuvable."}, 404)
        try:
            corps = json.loads(self.rfile.read(min(int(self.headers.get("Content-Length", 0)), 8192)) or b"{}")
        except ValueError:
            return self._repondre({"erreur": "Requête invalide."}, 400)
        texte = " ".join(str(corps.get("texte", "")).split())
        utilisateur = str(corps.get("utilisateur", ""))[:64] or None
        if not texte or len(texte) > LONGUEUR_MAX:
            return self._repondre({"erreur": f"Requête vide ou de plus de {LONGUEUR_MAX} caractères."}, 400)
        if not piste.active:
            return self._repondre({"erreur": "Recherche en ligne inactive : identifiants PISTE absents."}, 503)
        detail = {"action": "recherche juridique en ligne", "destination": "api.piste.gouv.fr (Légifrance, Judilibre)",
                  "requete": texte}
        journal.ecrire("connexion_sortante", utilisateur, detail, "en_cours")
        resultat, erreurs = {"articles": [], "decisions": []}, []
        for cle, fonction in (("articles", piste.articles), ("decisions", piste.decisions)):
            try:
                resultat[cle] = fonction(texte)
            except Indisponible as erreur:
                erreurs.append(f"{cle} : {erreur}")
        journal.ecrire("connexion_sortante", utilisateur,
                       {**detail, "articles": len(resultat["articles"]), "decisions": len(resultat["decisions"]),
                        **({"erreur": " ; ".join(erreurs)} if erreurs else {})}, "echec" if len(erreurs) == 2 else "ok")
        self._repondre({**resultat, "erreurs": erreurs})


def lancer_passerelle(port: int = 8000):
    global piste
    piste = Piste()
    serveur = ThreadingHTTPServer(("0.0.0.0", port), Passerelle)
    serveur.daemon_threads = True
    print(f"Passerelle juridique prête sur le port {port} ({'active' if piste.active else 'inactive : identifiants PISTE absents'})",
          flush=True)
    serveur.serve_forever()


# ------------------------------------------------------------ côté assistant

def rechercher(adresse: str, texte: str, utilisateur: str | None) -> dict:
    """Appel de la passerelle depuis l'assistant (réseau interne)."""
    requete = urllib.request.Request(adresse.rstrip("/") + "/rechercher",
                                     data=json.dumps({"texte": texte, "utilisateur": utilisateur}).encode(),
                                     headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(requete, timeout=2 * DELAI + 10) as r:
            return json.load(r)
    except urllib.error.HTTPError as erreur:
        try:
            message = json.load(erreur).get("erreur", "")
        except ValueError:
            message = ""
        raise Indisponible(message or f"HTTP {erreur.code}") from None
    except (urllib.error.URLError, TimeoutError, ValueError) as erreur:
        raise Indisponible(str(erreur)) from None
