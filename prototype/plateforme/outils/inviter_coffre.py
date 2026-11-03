#!/usr/bin/env python3
"""Invite une adresse dans le coffre-fort (Vaultwarden) par sa page d'administration.

Usage (depuis l'hôte) : docker compose run --rm -T outils /outils/inviter_coffre.py <courriel>

Le compte se crée ensuite dans le navigateur, sur https://coffre.<domaine> : le chiffrement du
coffre se fait côté client, la box ne connaît jamais le mot de passe maître.
"""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

VW = os.environ.get("VW_URL", "http://coffre").rstrip("/")


class SansRedirection(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def appeler(url, corps, entetes):
    ouvreur = urllib.request.build_opener(SansRedirection)
    requete = urllib.request.Request(url, data=corps.encode(), method="POST", headers=entetes)
    try:
        with ouvreur.open(requete, timeout=30) as reponse:
            return reponse.status, reponse.headers
    except urllib.error.HTTPError as erreur:
        return erreur.code, erreur.headers


def inviter(courriel):
    """Renvoie « créée », « existante » ou lève une exception."""
    statut, entetes = appeler(f"{VW}/admin", urllib.parse.urlencode({"token": os.environ["VW_ADMIN_TOKEN"]}),
                              {"Content-Type": "application/x-www-form-urlencoded"})
    cookie = next((c.split(";")[0] for c in entetes.get_all("Set-Cookie") or [] if c.startswith("VW_ADMIN=")), None)
    if not cookie:
        raise RuntimeError(f"session d'administration refusée (HTTP {statut})")
    statut, _ = appeler(f"{VW}/admin/invite", json.dumps({"email": courriel}),
                        {"Content-Type": "application/json", "Cookie": cookie})
    if statut == 200:
        return "créée"
    if statut in (400, 409):
        return "existante"
    raise RuntimeError(f"invitation refusée (HTTP {statut})")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage : inviter_coffre.py <courriel>")
    try:
        print(f"invitation {inviter(sys.argv[1])} pour {sys.argv[1]}")
    except (RuntimeError, urllib.error.URLError) as erreur:
        sys.exit(f"ERREUR : {erreur}")
