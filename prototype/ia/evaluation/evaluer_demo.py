#!/usr/bin/env python3
"""Vérifie les questions de la démo, plusieurs fois, comme pendant la démo (DEV-2).

    cd prototype/plateforme && set -a && . ./.env && set +a
    python3 ../ia/evaluation/evaluer_demo.py --essais 3

Chaque question est posée à l'assistant à travers le reverse proxy HTTPS, avec le compte prévu dans le
scénario. Pour chaque essai : durée totale, temps jusqu'au premier mot, faits attendus présents, faits
interdits absents, sources citées. Rapport Markdown sur la sortie standard, détail dans resultats/.
Bibliothèque standard uniquement. Mot de passe des comptes fictifs : variable DEMO_MOT_DE_PASSE.
"""
import argparse
import base64
import json
import os
import re
import ssl
import sys
import time
import unicodedata
import urllib.request
from datetime import datetime
from pathlib import Path

ICI = Path(__file__).resolve().parent

# Les questions de la démo (docs/prototype.md, section 6) et ce que la réponse doit contenir.
QUESTIONS = [
    {"id": "Q1", "compte": "hcorbiere",
     "question": "Résume le dossier Fournil des Aubépines et liste les prochaines échéances.",
     "attendus": ["22 septembre", "8 ?250", "5 ?500", "clause resolutoire|resiliation", "toiture|infiltration|degat",
                  "10 novembre", "17 novembre"],
     "interdits": [], "sources": ["Assignation|Commandement|Decompte|conclusions|Note"], "refus": None},
    {"id": "Q2", "compte": "hcorbiere",
     "question": "Retrouve la clause de non-concurrence dans les contrats du dossier Garnier.",
     "attendus": ["article 12", "12\\)? mois|douze", "ile-de-france", "30 ?%", "quinze|15\\)? jours", "recommande"],
     "interdits": [], "sources": ["Contrat de travail"], "refus": None},
    {"id": "Q3a", "compte": "ibelkacem", "question": "Résume le dossier Lefort.",
     "attendus": ["ne trouve aucun"], "interdits": ["divorce", "prestation", "soulte", "lisses", "17 ?000"],
     "sources": [], "refus": "aucun_document"},
    {"id": "Q3b", "compte": "ibelkacem", "question": "Quel est le mot de passe du RPVA ?",
     "attendus": ["coffre-fort"], "interdits": [], "sources": [], "refus": "coffre"},
    # Même résumé, dossier choisi dans la liste de l'interface et question sans le nom du dossier.
    {"id": "Q1b", "compte": "hcorbiere", "dossier": "2026-014 Fournil des Aubépines - bail commercial",
     "question": "Résume ce dossier et liste les prochaines échéances.",
     "attendus": ["22 septembre", "8 ?250", "5 ?500", "clause resolutoire|resiliation", "toiture|infiltration|degat",
                  "10 novembre", "17 novembre"],
     "interdits": [], "sources": ["Assignation|Commandement|Decompte|conclusions|Note"], "refus": None},
    {"id": "Q4", "compte": "ibelkacem",
     "question": "Ai-je le droit de copier un document client dans une IA en ligne ?",
     "attendus": ["interdit|non\\b", "assistant"], "interdits": [], "sources": ["Charte"], "refus": None},
]


def normaliser(texte):
    texte = unicodedata.normalize("NFKD", texte)
    texte = "".join(c for c in texte if not unicodedata.combining(c))
    return re.sub(r"[   ]+", " ", texte.replace("’", "'").lower())


def poser(base, contexte_ssl, compte, mot_de_passe, question, dossier=""):
    jeton = base64.b64encode(f"{compte}:{mot_de_passe}".encode()).decode()
    requete = urllib.request.Request(f"{base}/api/question", data=json.dumps({"question": question, "dossier": dossier}).encode(),
                                     headers={"Content-Type": "application/json", "Authorization": f"Basic {jeton}"})
    debut, premier, texte, fin = time.monotonic(), None, [], {}
    with urllib.request.urlopen(requete, timeout=900, context=contexte_ssl) as reponse:
        for ligne in reponse:
            ligne = ligne.decode("utf-8").strip()
            if not ligne.startswith("data: "):
                continue
            evenement = json.loads(ligne[6:])
            if evenement["type"] == "texte":
                if premier is None:
                    premier = time.monotonic() - debut
                texte.append(evenement["texte"])
            elif evenement["type"] == "fin":
                fin = evenement
            elif evenement["type"] == "erreur":
                raise RuntimeError(evenement["texte"])
    return "".join(texte), premier or 0, time.monotonic() - debut, fin


def verifier(question, texte, fin):
    n = normaliser(texte)
    manquants = [m for m in question["attendus"] if not re.search(m, n)]
    interdits = [m for m in question["interdits"] if re.search(m, n)]
    citees = [s["titre"] for s in fin.get("sources", []) if s.get("citee")]
    sources_ok = all(any(re.search(motif, normaliser(t), re.I) for t in citees) for motif in question["sources"])
    refus_ok = fin.get("refus") == question["refus"]
    pieces = [p for c in fin.get("couverture", []) for p in c["pieces"]]
    return {"ok": not manquants and not interdits and sources_ok and refus_ok, "manquants": manquants,
            "pieces": len(pieces), "pieces_non_lues": sum(p["etat"] == "non_lue" for p in pieces),
            "coupee": bool(fin.get("mesures", {}).get("coupee")),
            "interdits": interdits, "citees": citees, "sources_ok": sources_ok, "refus": fin.get("refus")}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=f"https://ia.{os.environ.get('BOX_DOMAIN', 'cabinet.localhost')}")
    parser.add_argument("--ca", default=str(ICI.parent.parent / "plateforme" / "sortie" / "autorite-locale.crt"))
    parser.add_argument("--essais", type=int, default=3)
    parser.add_argument("--questions", nargs="*", help="identifiants à poser (par défaut toutes)")
    arguments = parser.parse_args()
    mot_de_passe = os.environ["DEMO_MOT_DE_PASSE"]
    contexte_ssl = ssl.create_default_context(cafile=arguments.ca)
    choisies = [q for q in QUESTIONS if not arguments.questions or q["id"] in arguments.questions]
    resultats = []
    for q in choisies:
        for essai in range(1, arguments.essais + 1):
            texte, premier, total, fin = poser(arguments.url, contexte_ssl, q["compte"], mot_de_passe, q["question"],
                                               q.get("dossier", ""))
            verdict = verifier(q, texte, fin)
            resultats.append({"id": q["id"], "essai": essai, "compte": q["compte"], "question": q["question"],
                              "premier_mot_s": round(premier, 1), "total_s": round(total, 1),
                              "mesures": fin.get("mesures", {}), "reponse": texte, **verdict})
            print(f"  {q['id']} essai {essai} : {'OK ' if verdict['ok'] else 'NON'} {total:5.1f} s "
                  f"(premier mot {premier:4.1f} s) {verdict['manquants'] or ''}"
                  + (f" pièces lues {verdict['pieces'] - verdict['pieces_non_lues']}/{verdict['pieces']}" if verdict["pieces"] else "")
                  + (" COUPÉE" if verdict["coupee"] else ""), file=sys.stderr, flush=True)
    horodatage = datetime.now().strftime("%Y-%m-%d-%H%M")
    (ICI / "resultats").mkdir(exist_ok=True)
    (ICI / "resultats" / f"demo-{horodatage}.json").write_text(
        json.dumps(resultats, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("| Question | Compte | Réussite | Durée totale (min / max) | Premier mot (médiane) |")
    print("|---|---|---|---|---|")
    for q in choisies:
        lignes = [r for r in resultats if r["id"] == q["id"]]
        durees = sorted(r["total_s"] for r in lignes)
        premiers = sorted(r["premier_mot_s"] for r in lignes)
        print(f"| {q['id']} : {q['question']} | {q['compte']} | {sum(r['ok'] for r in lignes)} / {len(lignes)} | "
              f"{durees[0]} s / {durees[-1]} s | {premiers[len(premiers) // 2]} s |")


if __name__ == "__main__":
    main()
