"""Journal d'audit de l'assistant : chaque connexion et chaque question, avec les sources utilisées.

Format JSON Lines, compatible avec le journal de la plateforme (date, source, type, resultat), avec en
plus la personne concernée. Le journal reste sur la box : il contient le texte des questions.
"""
import json
import threading
from datetime import datetime

from . import config

_verrou = threading.Lock()


def ecrire(type_evenement: str, utilisateur: str | None, detail: dict, resultat: str = "ok"):
    ligne = {"date": datetime.now().astimezone().isoformat(timespec="seconds"), "source": "assistant",
             "type": type_evenement, "utilisateur": utilisateur, "detail": detail, "resultat": resultat}
    with _verrou:
        config.JOURNAL.parent.mkdir(parents=True, exist_ok=True)
        with config.JOURNAL.open("a", encoding="utf-8") as fichier:
            fichier.write(json.dumps(ligne, ensure_ascii=False) + "\n")


def lire(utilisateur: str, nombre: int = 20) -> list[dict]:
    """Dernières entrées concernant une personne (pour qu'elle voie ce qui a été tracé)."""
    if not config.JOURNAL.exists():
        return []
    lignes = [json.loads(l) for l in config.JOURNAL.read_text(encoding="utf-8").splitlines() if l.strip()]
    return [l for l in lignes if l.get("utilisateur") == utilisateur][-nombre:]


def lire_tout(nombre: int = 500) -> list[dict]:
    """Journal complet de la box, pour les administrateurs : journal de la plateforme (installation,
    sauvegardes, connexions sortantes, modèles) et journal de l'assistant (connexions, questions, refus)."""
    entrees = []
    for fichier in sorted(config.JOURNAL.parent.glob("*.jsonl")):
        for ligne in fichier.read_text(encoding="utf-8").splitlines():
            try:
                entree = json.loads(ligne)
            except ValueError:
                continue
            detail = entree.get("detail")
            if isinstance(detail, dict):
                detail = " · ".join(f"{cle} : {', '.join(map(str, v)) if isinstance(v, list) else v}"
                                    for cle, v in detail.items() if v not in (None, "", []))
            entrees.append({"date": entree.get("date", ""), "source": entree.get("source", ""),
                            "type": entree.get("type", ""), "utilisateur": entree.get("utilisateur"),
                            "detail": detail or "", "resultat": entree.get("resultat", "")})
    entrees.sort(key=lambda e: e["date"], reverse=True)
    return entrees[:nombre]
