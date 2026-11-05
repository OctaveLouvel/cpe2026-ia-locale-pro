#!/usr/bin/env python3
"""Vérifie que les fiches préparées par le modèle n'inventent pas de chiffres (DEV-2).

    python3 prototype/ia/evaluation/verifier_fiches.py [prototype/plateforme/sortie/ia]

Pour chaque fiche de pièce, chaque nombre, montant, pourcentage et date qu'elle contient doit se retrouver
dans le texte de la pièce. Pour chaque fiche de dossier, dans les fiches de ses pièces. Ce qui ne s'y
retrouve pas est listé : à relire à la main (un chiffre inventé, ou une reformulation comme « 1er » / « 1 »).
Bibliothèque standard uniquement. Lit index.json et fiches.json, sans appeler le moteur.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

MOIS = "janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre"
# Dates (« 22 septembre 2026 », « 1er mars 2019 »), puis nombres avec espaces de milliers et décimales.
DATE = re.compile(rf"\b(\d{{1,2}})(?:er)? ({MOIS})(?: (\d{{4}}))?", re.I)
NOMBRE = re.compile(r"\b\d{1,3}(?:[  ]\d{3})+(?:,\d+)?\b|\b\d+(?:,\d+)?\b")


def normaliser(texte):
    texte = unicodedata.normalize("NFKC", texte).replace(" ", " ").replace(" ", " ").replace("’", "'")
    texte = re.sub(r"\b1er\b", "1", texte)
    return re.sub(r"\s+", " ", texte.lower())


def faits(texte):
    """Dates et nombres d'un texte, sous une forme comparable."""
    texte = normaliser(texte)
    dates = {" ".join(x for x in m.groups() if x) for m in DATE.finditer(texte)}
    sans_dates = DATE.sub(" ", texte)
    nombres = {n for n in NOMBRE.findall(sans_dates) if not re.fullmatch(r"[1-9]", n)}  # « 3 points » : ignoré
    return dates, nombres


def absents(fiche, source):
    dates, nombres = faits(fiche)
    texte = normaliser(source)
    sources_dates, _ = faits(source)
    manque = [d for d in dates if d not in sources_dates and d not in texte]
    # Une date « 22 septembre » sans année se retrouve dans « 22 septembre 2026 ».
    manque = [d for d in manque if not any(s.startswith(d) for s in sources_dates)]
    manque += [n for n in nombres if not re.search(rf"(?<![\d,]){re.escape(n)}(?![\d])", texte)]
    # Un PDF dont l'extraction a perdu les espaces (« 340000euros ») : comparaison sans espaces.
    colle = texte.replace(" ", "")
    return sorted(m for m in manque if m.replace(" ", "") not in colle)


def main():
    dossier = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parents[2] / "plateforme/sortie/ia")
    index = json.loads((dossier / "index.json").read_text(encoding="utf-8"))
    fiches = json.loads((dossier / "fiches.json").read_text(encoding="utf-8"))
    textes = {}
    for m in index["morceaux"]:
        textes.setdefault(m["fileid"], []).append(m["texte"])
    noms = {f: e["nom"] for f, e in index["fichiers"].items()}

    alertes, verifiees = 0, 0
    print("| Fiche | Faits vérifiés | Absents de la source |\n|---|---|---|")
    for fileid, fiche in sorted(fiches["pieces"].items(), key=lambda x: noms.get(x[0], "")):
        if not fiche.get("texte"):
            continue
        manque = absents(fiche["texte"], " ".join(textes.get(fileid, [])))
        d, n = faits(fiche["texte"])
        verifiees += len(d) + len(n)
        alertes += len(manque)
        print(f"| {noms.get(fileid, fileid)} | {len(d) + len(n)} | {', '.join(manque) or 'aucun'} |")
    for nom, fiche in sorted(fiches["dossiers"].items()):
        if not fiche.get("texte"):
            continue
        source = " ".join(fiches["pieces"].get(f, {}).get("texte", "") for f in fiche["ordre"])
        manque = absents(fiche["texte"], source)
        d, n = faits(fiche["texte"])
        verifiees += len(d) + len(n)
        alertes += len(manque)
        print(f"| Dossier {nom} | {len(d) + len(n)} | {', '.join(manque) or 'aucun'} |")
    print(f"\n{verifiees} faits vérifiés, {alertes} absent(s) de la source, à relire.")
    return 1 if alertes else 0


if __name__ == "__main__":
    sys.exit(main())
