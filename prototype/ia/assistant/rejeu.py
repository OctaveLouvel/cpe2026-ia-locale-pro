"""Mode secours de la démo : rejouer une réponse réelle, enregistrée plus tôt sur cette box.

Ce n'est jamais une réponse écrite à la main. `evaluation/enregistrer_rejeu.py` pose les questions de la démo
au vrai modèle, à travers HTTPS, avec le bon compte, garde la meilleure réponse réelle de plusieurs essais
(vérifiée comme dans evaluer_demo.py) et l'enregistre avec sa date, son modèle et ses sources dans
<IA_DONNEES>/rejeu.json.

Actif seulement si le fichier <IA_DONNEES>/rejeu-actif existe (./box.sh demo-secours activer). Alors, une
question identique (même compte, même texte à la ponctuation près, même dossier choisi) reçoit la réponse
enregistrée, rejouée en quelques secondes, et la page l'annonce en clair : « Réponse enregistrée le … sur cette
box, rejouée ». Toute autre question est posée au modèle comme d'habitude. Chaque rejeu est inscrit au journal.
"""
import json
import re
import time
import unicodedata

from . import config, journal

FICHIER = config.DONNEES / "rejeu.json"
ACTIF = config.DONNEES / "rejeu-actif"


def cle(texte: str) -> str:
    texte = unicodedata.normalize("NFKD", texte.lower().replace("’", "'"))
    texte = "".join(c for c in texte if not unicodedata.combining(c))
    return " ".join(re.sub(r"[^\w' ]", " ", texte).split())


def actif() -> bool:
    return ACTIF.exists() and FICHIER.exists()


def trouver(login: str, question: str, dossier: str) -> dict | None:
    if not actif():
        return None
    try:
        entrees = json.loads(FICHIER.read_text(encoding="utf-8"))
    except ValueError:
        return None
    return next((e for e in entrees if e["login"] == login and cle(e["question"]) == cle(question)
                 and e.get("dossier", "") == dossier), None)


def rejouer(entree: dict, login: str):
    """Les événements enregistrés, dans l'ordre, précédés de l'annonce du rejeu. Le texte défile vite."""
    yield {"type": "rejeu", "date": entree["date"], "modele": entree["modele"], "duree_s": entree["duree_s"]}
    for evenement in entree["evenements"]:
        if evenement["type"] == "texte":
            time.sleep(0.02)
        elif evenement["type"] == "etape":
            time.sleep(0.3)
        if evenement["type"] == "fin":
            evenement = {**evenement, "rejeu": True}
        yield evenement
    journal.ecrire("question", login, {"question": entree["question"], "mode": "rejeu de la réponse du " + entree["date"],
                                       "modele": entree["modele"]})
