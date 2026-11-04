#!/usr/bin/env python3
"""Landing page et liste d'attente (DEV-3). Bibliothèque standard uniquement.

    python3 serveur.py                       sert la page (défaut 127.0.0.1:8080, derrière un reverse proxy HTTPS)
    python3 serveur.py compter               nombre d'inscrits, à noter chaque soir (planning)
    python3 serveur.py desinscrire <adresse> supprime une inscription (demande de retrait, droit à l'effacement)

Les inscriptions vont dans <LANDING_DONNEES>/inscriptions.csv (défaut ./donnees/, ignoré par git), lisible par
le seul compte qui fait tourner le serveur. Elles ne doivent jamais être copiées dans le dépôt.
"""
import csv
import os
import re
import sys
import threading
import time
import urllib.parse
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ICI = Path(__file__).resolve().parent
DONNEES = Path(os.environ.get("LANDING_DONNEES", ICI / "donnees"))
FICHIER = DONNEES / "inscriptions.csv"
ADRESSE = os.environ.get("LANDING_ADRESSE", "127.0.0.1")
PORT = int(os.environ.get("LANDING_PORT", "8080"))
PAGES = {"/": "index.html", "/index.html": "index.html", "/confidentialite.html": "confidentialite.html"}
COLONNES = ["date", "courriel", "taille", "fonction", "consentement"]
TAILLES = {"", "1 avocat", "2 à 4 avocats", "5 à 10 avocats", "Plus de 10 avocats"}
FONCTIONS = {"", "Avocat associé ou fondateur", "Avocat collaborateur", "Assistant ou secrétaire juridique", "Autre"}
CONSENTEMENT = ("J'accepte que l'équipe conserve mon adresse pour me tenir informé de l'avancement du projet "
                "et me proposer un échange.")
COURRIEL = re.compile(r"^[^@\s,;\"<>]{1,64}@[^@\s,;\"<>]{1,190}\.[A-Za-z]{2,}$")
ESSAIS_PAR_HEURE = 10
A_REMPLIR = re.compile(r"\[(Nom du projet|adresse de contact|hébergeur[^\]]*)\]")
POLITIQUE = ("default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self'; "
             "form-action 'self'; frame-ancestors 'none'; base-uri 'none'")

verrou = threading.Lock()
essais: dict[str, list[float]] = {}


def lire():
    if not FICHIER.exists():
        return []
    with FICHIER.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def ecrire(lignes):
    DONNEES.mkdir(parents=True, exist_ok=True)
    temporaire = FICHIER.with_suffix(".tmp")
    with os.fdopen(os.open(temporaire, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600), "w", newline="", encoding="utf-8") as f:
        sortie = csv.DictWriter(f, COLONNES)
        sortie.writeheader()
        sortie.writerows(lignes)
    temporaire.replace(FICHIER)


def inscrire(courriel, taille, fonction):
    """Ajoute l'inscription. Une adresse déjà inscrite n'est pas doublée (et rien ne le révèle au visiteur)."""
    with verrou:
        lignes = lire()
        if any(l["courriel"] == courriel for l in lignes):
            return
        lignes.append({"date": datetime.now().astimezone().isoformat(timespec="seconds"), "courriel": courriel,
                       "taille": taille, "fonction": fonction, "consentement": CONSENTEMENT})
        ecrire(lignes)


class Gestionnaire(BaseHTTPRequestHandler):
    server_version = "liste-attente"

    def log_message(self, format, *args):
        # Pas d'adresse IP ni de paramètres dans les journaux : seulement la méthode et le code de réponse.
        sys.stderr.write(f"{datetime.now():%Y-%m-%d %H:%M:%S} {self.command} {urllib.parse.urlsplit(self.path).path} {args[1] if len(args) > 1 else ''}\n")

    def _entetes_communs(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Content-Security-Policy", POLITIQUE)

    def _rediriger(self, cible):
        self.send_response(303)
        self.send_header("Location", cible)
        self.send_header("Content-Length", "0")
        self._entetes_communs()
        self.end_headers()

    def do_GET(self):
        page = PAGES.get(urllib.parse.urlsplit(self.path).path)
        if page is None:
            self.send_error(404)
            return
        contenu = (ICI / page).read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(contenu)))
        self.send_header("Cache-Control", "no-cache")
        self._entetes_communs()
        self.end_headers()
        self.wfile.write(contenu)

    def do_POST(self):
        if urllib.parse.urlsplit(self.path).path != "/inscription":
            self.send_error(404)
            return
        longueur = int(self.headers.get("Content-Length", 0) or 0)
        if longueur > 4096:
            self.send_error(413)
            return
        champs = {cle: valeurs[0].strip() for cle, valeurs in
                  urllib.parse.parse_qs(self.rfile.read(longueur).decode("utf-8", "replace")).items()}
        # Robot : le champ caché « site » est rempli. On répond comme pour une inscription, sans rien garder.
        if champs.get("site"):
            return self._rediriger("./?inscription=ok#liste")
        ip = (self.headers.get("X-Forwarded-For") or self.client_address[0]).split(",")[0].strip()
        maintenant = time.time()
        with verrou:
            recents = [t for t in essais.get(ip, []) if maintenant - t < 3600]
            essais[ip] = recents + [maintenant]
        if len(recents) >= ESSAIS_PAR_HEURE:
            return self._rediriger("./?erreur=trop#liste")
        courriel = champs.get("courriel", "").lower()
        if not COURRIEL.match(courriel):
            return self._rediriger("./?erreur=courriel#liste")
        if champs.get("consentement") != "oui":
            return self._rediriger("./?erreur=consentement#liste")
        taille = champs.get("taille", "") if champs.get("taille", "") in TAILLES else ""
        fonction = champs.get("fonction", "") if champs.get("fonction", "") in FONCTIONS else ""
        try:
            inscrire(courriel, taille, fonction)
        except OSError:
            return self._rediriger("./?erreur=serveur#liste")
        self._rediriger("./?inscription=ok#liste")


def main():
    commande = sys.argv[1] if len(sys.argv) > 1 else "servir"
    if commande == "compter":
        lignes = lire()
        print(f"{len(lignes)} inscrit(s)")
        for cle in ("taille", "fonction"):
            compte = {}
            for l in lignes:
                compte[l[cle] or "non précisé"] = compte.get(l[cle] or "non précisé", 0) + 1
            print(f"  {cle} : " + ", ".join(f"{v} {k}" for k, v in sorted(compte.items(), key=lambda x: -x[1])))
        return
    if commande == "desinscrire" and len(sys.argv) == 3:
        with verrou:
            lignes = lire()
            restantes = [l for l in lignes if l["courriel"] != sys.argv[2].strip().lower()]
            ecrire(restantes)
        print("inscription supprimée" if len(restantes) < len(lignes) else "adresse introuvable")
        return
    if commande != "servir":
        sys.exit(__doc__)
    for page in sorted(set(PAGES.values())):
        if A_REMPLIR.search((ICI / page).read_text(encoding="utf-8")):
            print(f"ATTENTION : {page} contient encore des champs à remplir entre crochets ([Nom du projet], "
                  "[adresse de contact]...). Ne pas publier en l'état.", file=sys.stderr)
    serveur = ThreadingHTTPServer((ADRESSE, PORT), Gestionnaire)
    print(f"Landing page sur http://{ADRESSE}:{PORT}/ ; inscriptions dans {FICHIER}", flush=True)
    serveur.serve_forever()


if __name__ == "__main__":
    main()
