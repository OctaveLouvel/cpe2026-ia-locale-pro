"""Point d'entrée.

    python -m assistant                     lance le serveur (port 8000)
    python -m assistant indexer <compte>    demande au serveur en marche d'indexer ce que voit ce compte
                                            (mot de passe dans IA_MOT_DE_PASSE, ou demandé)
    python -m assistant fiches              attend que les fiches des pièces et des dossiers soient prêtes
"""
import base64
import getpass
import json
import os
import sys
import time
import urllib.error
import urllib.request

from . import config


def indexer(login):
    mot_de_passe = os.environ.get("IA_MOT_DE_PASSE") or getpass.getpass(f"Mot de passe de {login} : ")
    base = f"http://localhost:{config.PORT}"
    for _ in range(120):  # attend que les modèles soient chargés
        try:
            with urllib.request.urlopen(base + "/api/etat", timeout=5) as r:
                if json.load(r).get("pret"):
                    break
        except (urllib.error.URLError, TimeoutError):
            pass
        time.sleep(5)
    jeton = base64.b64encode(f"{login}:{mot_de_passe}".encode()).decode()
    requete = urllib.request.Request(base + "/api/indexer", data=b"{}", method="POST",
                                     headers={"Authorization": f"Basic {jeton}", "Content-Type": "application/json"})
    with urllib.request.urlopen(requete, timeout=1800) as r:
        resultat = json.load(r)
    print(f"{resultat['indexes']} document(s) indexé(s) pour {login} ; index : {resultat['documents']} documents, "
          f"{resultat['extraits']} extraits")


def attendre_fiches():
    """Les fiches se préparent en tâche de fond, une à la fois, quand personne ne pose de question."""
    base, dernier = f"http://localhost:{config.PORT}", None
    while True:
        try:
            with urllib.request.urlopen(base + "/api/etat", timeout=5) as r:
                f = json.load(r)["fiches"]
        except (urllib.error.URLError, TimeoutError, KeyError):
            time.sleep(5)
            continue
        ligne = (f"fiches : {f['pieces_faites']}/{f['pieces']} pièces, {f['dossiers_faits']}/{f['dossiers']} dossiers"
                 + (f" (en cours : {f['en_cours']})" if f["en_cours"] else ""))
        if ligne != dernier:
            print(ligne, flush=True)
            dernier = ligne
        if not f["pieces"]:
            print("Aucun dossier suivi : ouvrez dans l'assistant chaque dossier à préparer, puis relancez.")
            return
        if f["pieces_faites"] >= f["pieces"] and f["dossiers_faits"] >= f["dossiers"]:
            return
        time.sleep(5)


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "indexer":
        indexer(sys.argv[2])
    elif len(sys.argv) == 2 and sys.argv[1] == "fiches":
        attendre_fiches()
    else:
        from . import serveur
        serveur.lancer()
