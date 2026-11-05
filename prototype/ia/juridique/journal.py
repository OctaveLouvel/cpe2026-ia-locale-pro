"""Journal d'audit du pack juridique : même format que celui de la plateforme et de l'assistant (JSON Lines,
un fichier par source dans sortie/journal/). Le tableau de bord et la page Journal d'audit le lisent."""
import json
import os
import threading
from datetime import datetime
from pathlib import Path

CHEMIN = Path(os.environ.get("JURIDIQUE_JOURNAL", "/journal/juridique.jsonl"))
_verrou = threading.Lock()


def ecrire(type_evenement: str, utilisateur: str | None, detail: dict, resultat: str = "ok"):
    ligne = {"date": datetime.now().astimezone().isoformat(timespec="seconds"), "source": "juridique",
             "type": type_evenement, "utilisateur": utilisateur, "detail": detail, "resultat": resultat}
    with _verrou:
        CHEMIN.parent.mkdir(parents=True, exist_ok=True)
        with CHEMIN.open("a", encoding="utf-8") as fichier:
            fichier.write(json.dumps(ligne, ensure_ascii=False) + "\n")
