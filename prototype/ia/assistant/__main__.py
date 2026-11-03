"""Point d'entrée.

    python -m assistant                     lance le serveur (port 8000)
    python -m assistant indexer <compte>    demande au serveur en marche d'indexer ce que voit ce compte
                                            (mot de passe dans IA_MOT_DE_PASSE, ou demandé)
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


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "indexer":
        indexer(sys.argv[2])
    else:
        from . import serveur
        serveur.lancer()
