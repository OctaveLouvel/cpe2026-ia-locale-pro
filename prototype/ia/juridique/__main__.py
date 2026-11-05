"""Commandes du pack juridique (lancées par ./box.sh juridique, ou à la main dans l'image de l'assistant).

    python -m juridique etat                          contenu de la base
    python -m juridique mettre-a-jour [FONDS...]      télécharge et importe depuis la DILA (LEGI CASS INCA CAPP JADE)
    python -m juridique importer ARCHIVE...           importe des archives déjà téléchargées
    python -m juridique recalculer-citations          relie décisions et articles (après un import des codes)
    python -m juridique article NUMERO CODE [DATE]    une version d'article : « article 1240 "code civil" »
    python -m juridique chercher "QUESTION"           ce que l'assistant donnerait au modèle
    python -m juridique passerelle                    passerelle en ligne Légifrance et Judilibre (port 8000)

Base : JURIDIQUE_BASE (par défaut /juridique/base.sqlite). Archives : JURIDIQUE_ARCHIVES.
"""
import json
import os
import sys
from datetime import date
from pathlib import Path

from . import dila, references, telechargement
from .base import Base

BASE = Path(os.environ.get("JURIDIQUE_BASE", "/juridique/base.sqlite"))
ARCHIVES = Path(os.environ.get("JURIDIQUE_ARCHIVES", "/juridique/archives"))


def principal(arguments):
    commande, reste = (arguments[0], arguments[1:]) if arguments else ("aide", [])
    if commande == "etat":
        print(json.dumps(Base(BASE).statistiques(), ensure_ascii=False, indent=2))
    elif commande == "mettre-a-jour":
        fonds = [f.upper() for f in reste if not f.startswith("--")] or ["LEGI", "CASS", "INCA", "CAPP", "JADE"]
        bilan = telechargement.mettre_a_jour(Base(BASE, ecriture=True), ARCHIVES, fonds,
                                             os.environ.get("BOX_ADMIN"), garder="--garder" in reste)
        print(f"{bilan['archives']} archive(s), {bilan['articles']} articles, {bilan['decisions']} décisions")
    elif commande == "importer":
        base = Base(BASE, ecriture=True)
        chemins = [Path(c) for c in reste if not c.startswith("--")]
        # Les codes d'abord, et dans l'ordre des dates : chaque archive quotidienne corrige la précédente.
        chemins.sort(key=lambda c: (telechargement.ORDRE.index(dila.fonds_de(c.name)), not c.name.lower().startswith("freemium"), c.name))
        for chemin in chemins:
            print(dila.importer(chemin, base, non_vigueur="--non-vigueur" in reste), flush=True)
    elif commande == "recalculer-citations":
        print(f"{dila.recalculer_citations(Base(BASE, ecriture=True))} décisions")
    elif commande == "article" and len(reste) >= 2:
        base = Base(BASE)
        quand = date.fromisoformat(reste[2]) if len(reste) > 2 else date.today()
        code = references.normaliser(reste[1])
        a = base.article(base.cids(code), references.numero(reste[0]), quand)
        if a is None:
            sys.exit(f"Article {reste[0]} introuvable dans « {reste[1]} ».")
        print(f"{a['titre']}, article {a['num']} ({a['etat']}, du {a['debut']} au {a['fin']})\n{a['chemin']}\n\n{a['texte']}")
        for v in base.versions(a["cid"], a["num_norm"]):
            print(f"  version {v['id']} : {v['etat']}, du {v['debut']} au {v['fin']}")
    elif commande == "chercher" and reste:
        from .recherche import Juridique
        resultat = Juridique(BASE, os.environ.get("IA_JURIDIQUE_EN_LIGNE", "")).extraits(reste[0], [], date.today())
        for etape in resultat.etapes:
            print(f"… {etape}")
        for i, e in enumerate(resultat.extraits, 1):
            print(f"\n[{i}] {e['etiquette']}\n{e['texte']}")
    elif commande == "passerelle":
        from .en_ligne import lancer_passerelle
        lancer_passerelle(int(os.environ.get("JURIDIQUE_PORT", "8000")))
    else:
        print(__doc__)


if __name__ == "__main__":
    principal(sys.argv[1:])
