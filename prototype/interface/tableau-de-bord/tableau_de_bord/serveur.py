"""Serveur du tableau de bord : page d'accueil de la box (https://<domaine>) et son état en direct.

Bibliothèque standard uniquement. Ce qui est montré (état des services, sauvegardes, connexions sortantes,
versions) est visible de tous les postes du cabinet : aucune donnée de dossier, aucun nom de personne.
Le journal d'audit détaillé est la page réservée aux administrateurs de DEV-4 (https://ia.<domaine>/journal).
"""
import json
import sys
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from . import collecte, config

PAGE = (Path(__file__).parent / "page.html").read_bytes()
POLITIQUE = ("default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; "
             "img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'")


class Gestionnaire(BaseHTTPRequestHandler):
    server_version = "tableau-de-bord-box"
    protocol_version = "HTTP/1.1"

    def log_message(self, format, *args):
        sys.stderr.write(f"{self.address_string()} {format % args}\n")

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

    def do_GET(self):
        chemin = urllib.parse.urlsplit(self.path).path
        if chemin in ("/", "/index.html"):
            return self._repondre(PAGE, type_contenu="text/html; charset=utf-8",
                                  entetes={"Content-Security-Policy": POLITIQUE, "Referrer-Policy": "no-referrer"})
        if chemin == "/api/sante":
            return self._repondre({"ok": True})
        if chemin == "/api/resume":
            return self._repondre(collecte.resume())
        self._repondre({"erreur": "Introuvable."}, 404)


def lancer():
    serveur = ThreadingHTTPServer(("0.0.0.0", config.PORT), Gestionnaire)
    serveur.daemon_threads = True
    print(f"Tableau de bord prêt sur le port {config.PORT}", flush=True)
    serveur.serve_forever()
