"""Mise à jour du pack juridique depuis le site de la DILA (https://echanges.dila.gouv.fr/OPENDATA/).

Seule connexion sortante du pack hors ligne : elle se fait sur ordre d'un administrateur (pendant la fenêtre
de maintenance), en HTTPS, depuis un conteneur ponctuel relié à internet, et elle est inscrite au journal
d'audit (début, puis fin avec le nombre d'archives). Les archives sont supprimées une fois importées.

Premier passage : l'archive complète la plus récente de chaque fonds, puis toutes les archives quotidiennes
publiées depuis. Passages suivants : seulement les archives quotidiennes nouvelles.
"""
import re
import shutil
import urllib.request
from pathlib import Path

from . import dila, journal
from .base import Base

SITE = "https://echanges.dila.gouv.fr/OPENDATA"
# Les codes d'abord : les citations des décisions sont reconnues grâce aux noms des codes.
ORDRE = ["LEGI", "CASS", "INCA", "CAPP", "JADE"]
DELAI = 120


def lister(fonds: str) -> list[str]:
    """Archives publiées pour un fonds, dans l'ordre chronologique."""
    with urllib.request.urlopen(f"{SITE}/{fonds}/", timeout=DELAI) as reponse:
        page = reponse.read().decode("utf-8", "replace")
    noms = set(re.findall(rf'href="((?:Freemium_{fonds.lower()}_global|{fonds})_(\d{{8}}-\d{{6}})\.tar\.gz)"', page))
    return [nom for nom, _ in sorted(noms, key=lambda n: n[1])]


def _horodatage(nom: str) -> str:
    return re.search(r"(\d{8}-\d{6})", nom).group(1)


def a_importer(base: Base, fonds: str, publiees: list[str]) -> list[str]:
    deja = {r[0] for r in base.connexion().execute("SELECT nom FROM archives WHERE fonds = ?", (fonds,))}
    completes = [n for n in publiees if n.lower().startswith("freemium")]
    if not any(n.lower().startswith("freemium") for n in deja):
        if not completes:
            return []
        depart = completes[-1]
        return [depart] + [n for n in publiees if not n.lower().startswith("freemium")
                           and _horodatage(n) > _horodatage(depart) and n not in deja]
    dernier = max(_horodatage(n) for n in deja)
    return [n for n in publiees if not n.lower().startswith("freemium") and _horodatage(n) > dernier]


def telecharger(fonds: str, nom: str, dossier: Path) -> Path:
    dossier.mkdir(parents=True, exist_ok=True)
    cible = dossier / nom
    if cible.exists():
        return cible
    temporaire = cible.with_suffix(".part")
    with urllib.request.urlopen(f"{SITE}/{fonds}/{nom}", timeout=DELAI) as reponse, temporaire.open("wb") as f:
        shutil.copyfileobj(reponse, f, 1 << 20)
    temporaire.rename(cible)
    return cible


def mettre_a_jour(base: Base, dossier: Path, fonds: list[str], utilisateur: str | None = None,
                  garder: bool = False, progression=print) -> dict:
    fonds = [f for f in ORDRE if f in fonds]
    journal.ecrire("connexion_sortante", utilisateur, {
        "action": "mise à jour du pack juridique", "destination": "echanges.dila.gouv.fr", "fonds": fonds}, "en_cours")
    bilan = {"archives": 0, "articles": 0, "decisions": 0}
    try:
        for f in fonds:
            liste = a_importer(base, f, lister(f))
            progression(f"{f} : {len(liste)} archive(s) à importer")
            for nom in liste:
                chemin = telecharger(f, nom, dossier)
                compte = dila.importer(chemin, base, progression=progression)
                bilan["archives"] += 1
                bilan["articles"] += compte.get("articles", 0)
                bilan["decisions"] += compte.get("decisions", 0)
                progression(f"{nom} : {compte.get('articles', 0)} articles, {compte.get('decisions', 0)} décisions")
                if not garder:
                    chemin.unlink(missing_ok=True)
    except Exception as erreur:
        journal.ecrire("connexion_sortante", utilisateur, {
            "action": "mise à jour du pack juridique", "destination": "echanges.dila.gouv.fr",
            "erreur": str(erreur)[:200], **bilan}, "echec")
        raise
    journal.ecrire("connexion_sortante", utilisateur, {
        "action": "mise à jour du pack juridique", "destination": "echanges.dila.gouv.fr", **bilan}, "ok")
    return bilan
