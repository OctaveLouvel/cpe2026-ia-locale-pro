#!/usr/bin/env python3
"""Enregistre les réponses réelles du modèle aux questions de la démo, pour le mode secours (assistant/rejeu.py).

    cd prototype/plateforme && set -a && . ./.env && set +a
    python3 ../ia/evaluation/enregistrer_rejeu.py --essais 3

Chaque question de evaluer_demo.py est posée au vrai modèle, à travers HTTPS, avec le compte du scénario.
Pour chaque question, la première réponse qui passe les mêmes contrôles que evaluer_demo.py est gardée ; si
aucune ne passe, la meilleure (le moins de faits manquants) est gardée et signalée comme imparfaite. Rien
n'est écrit à la main : on enregistre exactement ce que le modèle a produit, avec la date, le modèle et la durée.
Le mode secours doit être désactivé pendant l'enregistrement (sinon on enregistrerait un rejeu).
Résultat : prototype/plateforme/sortie/ia/rejeu.json (lu par l'assistant dans /donnees).
"""
import argparse
import base64
import json
import os
import ssl
import sys
import time
import urllib.request
from datetime import datetime
from pathlib import Path

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI))
from evaluer_demo import QUESTIONS, verifier  # noqa: E402

SORTIE = ICI.parent.parent / "plateforme" / "sortie" / "ia" / "rejeu.json"


def poser(base, contexte_ssl, compte, mot_de_passe, question, dossier=""):
    """Comme evaluer_demo.poser, mais garde tous les événements, pour pouvoir les rejouer."""
    jeton = base64.b64encode(f"{compte}:{mot_de_passe}".encode()).decode()
    requete = urllib.request.Request(f"{base}/api/question", data=json.dumps({"question": question, "dossier": dossier}).encode(),
                                     headers={"Content-Type": "application/json", "Authorization": f"Basic {jeton}"})
    debut, evenements = time.monotonic(), []
    with urllib.request.urlopen(requete, timeout=1200, context=contexte_ssl) as reponse:
        for ligne in reponse:
            ligne = ligne.decode("utf-8").strip()
            if ligne.startswith("data: "):
                evenements.append(json.loads(ligne[6:]))
    if any(e["type"] == "rejeu" for e in evenements):
        sys.exit("Le mode secours est actif : le désactiver avant d'enregistrer (./box.sh demo-secours desactiver).")
    if any(e["type"] == "erreur" for e in evenements):
        raise RuntimeError(next(e["texte"] for e in evenements if e["type"] == "erreur"))
    return evenements, time.monotonic() - debut


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=f"https://ia.{os.environ.get('BOX_DOMAIN', 'cabinet.localhost')}")
    parser.add_argument("--ca", default=str(ICI.parent.parent / "plateforme" / "sortie" / "autorite-locale.crt"))
    parser.add_argument("--essais", type=int, default=3)
    parser.add_argument("--questions", nargs="*", help="identifiants à enregistrer (par défaut toutes)")
    parser.add_argument("--sortie", default=str(SORTIE), help="fichier rejeu.json lu par l'assistant")
    arguments = parser.parse_args()
    mot_de_passe = os.environ["DEMO_MOT_DE_PASSE"]
    contexte_ssl = ssl.create_default_context(cafile=arguments.ca)
    sortie = Path(arguments.sortie)
    anciennes = json.loads(sortie.read_text(encoding="utf-8")) if sortie.exists() else []
    choisies = [q for q in QUESTIONS if not arguments.questions or q["id"] in arguments.questions]
    nouvelles = []
    for q in choisies:
        meilleure = None
        for essai in range(1, arguments.essais + 1):
            try:
                evenements, duree = poser(arguments.url, contexte_ssl, q["compte"], mot_de_passe, q["question"], q.get("dossier", ""))
            except (RuntimeError, OSError) as erreur:  # moteur arrêté, délai dépassé : essai suivant
                print(f"  {q['id']} essai {essai} : ERREUR {erreur}", file=sys.stderr, flush=True)
                continue
            texte = "".join(e["texte"] for e in evenements if e["type"] == "texte")
            fin = next((e for e in evenements if e["type"] == "fin"), {})
            verdict = verifier(q, texte, fin)
            print(f"  {q['id']} essai {essai} : {'OK ' if verdict['ok'] else 'NON'} {duree:5.1f} s {verdict['manquants'] or ''}",
                  file=sys.stderr, flush=True)
            candidat = (len(verdict["manquants"]) + len(verdict["interdits"]) + (not verdict["sources_ok"]), duree, evenements, verdict)
            if meilleure is None or candidat[0] < meilleure[0]:
                meilleure = candidat
            if verdict["ok"]:
                break
        if meilleure is None:
            continue
        _, duree, evenements, verdict = meilleure
        nouvelles.append({"id": q["id"], "login": q["compte"], "question": q["question"], "dossier": q.get("dossier", ""),
                          "date": datetime.now().astimezone().isoformat(timespec="seconds"),
                          "modele": next((e.get("modele") for e in evenements if e["type"] == "fin"), ""),
                          "duree_s": round(duree, 1), "controle_ok": verdict["ok"], "manquants": verdict["manquants"],
                          "evenements": evenements})
        # Écrit après chaque question : un arrêt du moteur ne fait pas perdre les précédentes.
        ids = {n["id"] for n in nouvelles}
        sortie.parent.mkdir(parents=True, exist_ok=True)
        sortie.write_text(json.dumps([a for a in anciennes if a.get("id") not in ids] + nouvelles, ensure_ascii=False,
                                     indent=1) + "\n", encoding="utf-8")
    print(f"\n{len(nouvelles)} réponse(s) enregistrée(s) dans {sortie}")
    for n in nouvelles:
        print(f"- {n['id']} ({n['login']}) : {'contrôles réussis' if n['controle_ok'] else 'IMPARFAITE, manque ' + ', '.join(n['manquants'])}, "
              f"{n['duree_s']} s")


if __name__ == "__main__":
    main()
