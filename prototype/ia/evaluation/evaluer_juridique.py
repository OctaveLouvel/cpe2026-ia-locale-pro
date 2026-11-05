"""Évaluation de la recherche du pack juridique : pour chaque question, l'article attendu fait-il partie des
extraits donnés au modèle, à quel rang, et en combien de temps ? Aucun modèle d'IA n'est appelé.

    cd prototype/ia
    JURIDIQUE_BASE=../plateforme/sortie/juridique/base.sqlite python3 evaluation/evaluer_juridique.py
"""
import json
import os
import sys
import time
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from juridique.recherche import Juridique  # noqa: E402
from juridique.references import normaliser, numero  # noqa: E402

QUESTIONS = Path(__file__).with_name("questions_juridiques.json")


def principal():
    juridique = Juridique(Path(os.environ.get("JURIDIQUE_BASE", "/juridique/base.sqlite")))
    if not juridique.disponible:
        sys.exit("Base juridique absente : renseigner JURIDIQUE_BASE.")
    questions = json.loads(QUESTIONS.read_text(encoding="utf-8"))["questions"]
    trouvees, durees = 0, []
    for q in questions:
        debut = time.monotonic()
        resultat = juridique.extraits(q["question"], [], date.today())
        durees.append(time.monotonic() - debut)
        code, num = q["attendu"]
        rang = next((i for i, e in enumerate(resultat.extraits, 1) if e["source"]["type"] == "loi"
                     and normaliser(e["source"]["titre"]).startswith(f"{code}, article ")
                     and numero(e["source"]["titre"].rsplit("article ", 1)[1]) == num), None)
        trouvees += rang is not None
        donnes = " ; ".join(e["source"]["titre"] for e in resultat.extraits)
        print(f"{'OK ' if rang else 'NON'} [{q['type']}] {q['question']}\n    rang {rang or '-'} · {durees[-1]:.2f} s · {donnes}")
    print(f"\n{trouvees}/{len(questions)} articles attendus trouvés ; temps moyen {sum(durees) / len(durees):.2f} s, "
          f"maximum {max(durees):.2f} s")


if __name__ == "__main__":
    principal()
