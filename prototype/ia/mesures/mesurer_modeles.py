#!/usr/bin/env python3
"""Banc de mesure des modèles candidats de l'assistant (DEV-2). Bibliothèque standard uniquement.

    python3 mesurer_modeles.py --ollama http://127.0.0.1:11434 qwen3:4b granite4.2:3b lfm3:1.7b
    python3 mesurer_modeles.py --openai http://127.0.0.1:5000 --processus qwen36 qwen3.6-35b-a3b

Le second cas mesure un serveur compatible OpenAI déjà démarré (par exemple Colibri) : la mémoire est alors
celle du processus du moteur (--processus), lue dans /proc.

Pour chaque modèle : mémoire occupée, temps de chargement, temps jusqu'au premier mot, vitesse de
lecture du contexte et de génération (tokens par seconde), et qualité en français sur les 5 questions
types de questions.json. La qualité est mesurée, pas estimée : part des faits attendus présents dans la
réponse, 0 si la réponse contient un fait interdit (par exemple un montant inventé).
Résultats bruts (réponses complètes) dans resultats/, tableau Markdown sur la sortie standard.
"""
import argparse
import json
import re
import statistics
import sys
import time
import unicodedata
import urllib.request
from datetime import datetime
from pathlib import Path

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI.parent))
from assistant import consignes  # noqa: E402  (module sans dépendance)


def normaliser(texte):
    texte = unicodedata.normalize("NFKD", texte)
    texte = "".join(c for c in texte if not unicodedata.combining(c))
    texte = re.sub(r"[    ]", " ", texte)
    texte = texte.replace("’", "'").lower()
    return re.sub(r"[ \t]+", " ", texte)


def appeler(base, chemin, corps=None, delai=900):
    donnees = json.dumps(corps).encode() if corps is not None else None
    requete = urllib.request.Request(base + chemin, data=donnees, headers={"Content-Type": "application/json"},
                                     method="POST" if donnees else "GET")
    return urllib.request.urlopen(requete, timeout=delai)


def capacites(base, modele):
    with appeler(base, "/api/show", {"model": modele}) as r:
        return json.load(r).get("capabilities", [])


def charger(base, modele):
    debut = time.monotonic()
    with appeler(base, "/api/generate", {"model": modele, "prompt": "", "keep_alive": "30m"}) as r:
        json.load(r)
    return time.monotonic() - debut


def memoire(base, modele):
    with appeler(base, "/api/ps") as r:
        for m in json.load(r).get("models", []):
            if m.get("name") == modele or m.get("model") == modele:
                return m.get("size", 0)
    return 0


def decharger(base, modele):
    with appeler(base, "/api/generate", {"model": modele, "keep_alive": 0}) as r:
        r.read()


def interroger(base, modele, message, penser):
    corps = {"model": modele, "stream": True, "keep_alive": "30m",
             "messages": [{"role": "system", "content": consignes.SYSTEME}, {"role": "user", "content": message}],
             "options": {"temperature": 0.1, "seed": 42, "num_ctx": 4096, "num_predict": 450}}
    if penser is not None:
        corps["think"] = penser
    debut, premier, morceaux, final = time.monotonic(), None, [], {}
    with appeler(base, "/api/chat", corps) as r:
        for ligne in r:
            if not ligne.strip():
                continue
            donnee = json.loads(ligne)
            if "error" in donnee:
                raise RuntimeError(donnee["error"])
            contenu = donnee.get("message", {}).get("content", "")
            if contenu and premier is None:
                premier = time.monotonic() - debut
            morceaux.append(contenu)
            if donnee.get("done"):
                final = donnee
    return "".join(morceaux), premier, time.monotonic() - debut, final


def noter(reponse, question):
    texte = normaliser(reponse)
    trouves = [bool(re.search(motif, texte)) for motif in question["attendus"]]
    interdit = any(re.search(motif, texte) for motif in question["interdits"])
    return (0.0 if interdit else sum(trouves) / len(trouves)), trouves, interdit


def interroger_openai(base, modele, message):
    """Même mesure sur une API compatible OpenAI (Colibri...) : réponse en flux, réflexion désactivée."""
    corps = {"model": modele, "stream": True, "stream_options": {"include_usage": True}, "enable_thinking": False,
             "messages": [{"role": "system", "content": consignes.SYSTEME}, {"role": "user", "content": message}],
             "temperature": 0.1, "max_tokens": 450}
    debut, premier, morceaux, usage = time.monotonic(), None, [], {}
    with appeler(base, "/v1/chat/completions", corps) as r:
        for ligne in r:
            ligne = ligne.decode().strip()
            if not ligne.startswith("data: ") or ligne == "data: [DONE]":
                continue
            donnee = json.loads(ligne[6:])
            for choix in donnee.get("choices") or []:
                contenu = (choix.get("delta") or {}).get("content") or ""
                if contenu and premier is None:
                    premier = time.monotonic() - debut
                morceaux.append(contenu)
            usage = donnee.get("usage") or usage
    total = time.monotonic() - debut
    premier = premier or total
    # Sans statistiques du moteur : lecture du contexte jusqu'au premier mot, génération ensuite.
    final = {"prompt_eval_count": usage.get("prompt_tokens", 0), "prompt_eval_duration": premier * 1e9,
             "eval_count": usage.get("completion_tokens", 0), "eval_duration": max(total - premier, 1e-3) * 1e9}
    return "".join(morceaux), premier, total, final


def memoire_processus(nom):
    total = 0
    for pid in Path("/proc").iterdir():
        try:
            if pid.name.isdigit() and (pid / "comm").read_text().strip() == nom:
                ligne = next(l for l in (pid / "status").read_text().splitlines() if l.startswith("VmRSS:"))
                total += int(ligne.split()[1]) * 1024
        except (OSError, StopIteration):
            continue
    return total


def mesurer(base, modele, jeu, openai=False, processus=None):
    aujourdhui = datetime.fromisoformat(jeu["aujourdhui"])
    if openai:
        penser, chargement = False, 0.0
    else:
        penser = False if "thinking" in capacites(base, modele) else None
        chargement = charger(base, modele)
    resultats = []
    for q in jeu["questions"]:
        extraits = [{"numero": i, **e} for i, e in enumerate(q["extraits"], start=1)]
        message = consignes.message(q["question"], extraits, aujourdhui, jeu["personne"], q["resume"])
        if openai:
            reponse, premier, total, final = interroger_openai(base, modele, message)
        else:
            reponse, premier, total, final = interroger(base, modele, message, penser)
        note, trouves, interdit = noter(reponse, q)
        resultats.append({
            "id": q["id"], "note": round(note, 2), "faits_trouves": trouves, "interdit": interdit,
            "citations": bool(re.search(r"\[\d+\]", reponse)),
            "premier_mot_s": round(premier or total, 2), "total_s": round(total, 2),
            "tokens_contexte": final.get("prompt_eval_count", 0),
            "duree_contexte_s": round(final.get("prompt_eval_duration", 0) / 1e9, 2),
            "tokens_generes": final.get("eval_count", 0),
            "duree_generation_s": round(final.get("eval_duration", 0) / 1e9, 2),
            "reponse": reponse,
        })
        print(f"  {modele:24} {q['id']:8} note {note:.2f}  premier mot {premier or total:5.1f} s  total {total:5.1f} s",
              file=sys.stderr, flush=True)
    if openai:
        occupation = memoire_processus(processus) if processus else 0
    else:
        occupation = memoire(base, modele)
        decharger(base, modele)
    contexte = sum(r["tokens_contexte"] for r in resultats) / max(sum(r["duree_contexte_s"] for r in resultats), 1e-9)
    generation = sum(r["tokens_generes"] for r in resultats) / max(sum(r["duree_generation_s"] for r in resultats), 1e-9)
    return {
        "modele": modele, "reflexion_desactivee": penser is False,
        "memoire_go": round(occupation / 1e9, 2), "chargement_s": round(chargement, 1),
        "premier_mot_median_s": round(statistics.median(r["premier_mot_s"] for r in resultats), 1),
        "premier_mot_max_s": round(max(r["premier_mot_s"] for r in resultats), 1),
        "lecture_tokens_s": round(contexte, 1), "generation_tokens_s": round(generation, 1),
        "qualite_sur_5": round(sum(r["note"] for r in resultats), 2),
        "citations_sur_5": sum(r["citations"] for r in resultats),
        "questions": resultats,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--ollama", default="http://127.0.0.1:11434")
    parser.add_argument("--openai", help="URL d'un serveur compatible OpenAI déjà démarré (Colibri...)")
    parser.add_argument("--processus", help="nom du processus du moteur, pour mesurer sa mémoire")
    parser.add_argument("modeles", nargs="+")
    arguments = parser.parse_args()
    jeu = json.loads((ICI / "questions.json").read_text(encoding="utf-8"))
    mesures = []
    for modele in arguments.modeles:
        try:
            if arguments.openai:
                mesures.append(mesurer(arguments.openai, modele, jeu, openai=True, processus=arguments.processus))
            else:
                mesures.append(mesurer(arguments.ollama, modele, jeu))
        except Exception as erreur:  # un modèle en échec ne bloque pas les autres
            print(f"  {modele} : ÉCHEC {erreur}", file=sys.stderr)
    horodatage = datetime.now().strftime("%Y-%m-%d-%H%M")
    (ICI / "resultats").mkdir(exist_ok=True)
    (ICI / "resultats" / f"mesures-{horodatage}.json").write_text(
        json.dumps({"date": horodatage, "mesures": mesures}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("| Modèle | Mémoire | Chargement | Premier mot (médiane / max) | Lecture du contexte | Génération | Qualité en français | Citations |")
    print("|---|---|---|---|---|---|---|---|")
    for m in mesures:
        print(f"| {m['modele']} | {m['memoire_go']} Go | {m['chargement_s']} s | {m['premier_mot_median_s']} s / "
              f"{m['premier_mot_max_s']} s | {m['lecture_tokens_s']} tokens/s | {m['generation_tokens_s']} tokens/s | "
              f"{m['qualite_sur_5']} / 5 | {m['citations_sur_5']} / 5 |")


if __name__ == "__main__":
    main()
