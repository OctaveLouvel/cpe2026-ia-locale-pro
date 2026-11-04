#!/usr/bin/env python3
"""Choisir, installer et activer le modèle d'IA de la box (DEV-2). Lancé par ./box.sh ia.

    ./box.sh ia                      menu : liste numérotée, on tape un numéro
    ./box.sh ia liste
    ./box.sh ia installer qwen3:4b   télécharge (connexion sortante inscrite au journal)
    ./box.sh ia activer qwen3:4b     branche l'assistant sur ce modèle
    ./box.sh ia supprimer qwen3:4b

Les modèles « ollama » tournent dans le conteneur ia-moteur, sur le réseau interne sans internet. Le
téléchargement passe par un conteneur temporaire relié à internet, qui remplit le volume des modèles puis
disparaît. Le modèle « colibri » tourne hors conteneur (./box.sh moteur-ia). Bibliothèque standard seulement.
"""
import json
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

PLATEFORME = Path(__file__).resolve().parent.parent / "plateforme"
CATALOGUE = Path(__file__).resolve().parent / "modeles.json"
ENV = PLATEFORME / ".env"
JOURNAL = PLATEFORME / "sortie" / "journal" / "evenements.jsonl"
IMAGE_OLLAMA = "ollama/ollama:0.40.14"
VOLUME = "box_ia_modeles"
URL_OLLAMA = "http://ia-moteur:11434"

GRAS, VERT, JAUNE, ROUGE, GRIS, FIN = "\033[1m", "\033[32m", "\033[33m", "\033[31m", "\033[90m", "\033[0m"


# ---------------------------------------------------------------- outils

def lire_env():
    valeurs = {}
    for ligne in ENV.read_text(encoding="utf-8").splitlines():
        if "=" in ligne and not ligne.lstrip().startswith("#"):
            cle, _, valeur = ligne.partition("=")
            valeurs[cle.strip()] = valeur.strip().strip('"').strip("'")
    return valeurs


def ecrire_env(**valeurs):
    lignes = ENV.read_text(encoding="utf-8").splitlines()
    for cle, valeur in valeurs.items():
        nouvelle = f"{cle}={valeur}"
        for i, ligne in enumerate(lignes):
            if ligne.startswith(f"{cle}="):
                lignes[i] = nouvelle
                break
        else:
            lignes.append(nouvelle)
    ENV.write_text("\n".join(lignes) + "\n", encoding="utf-8")


def environnement():
    """Environnement des commandes docker compose : le .env à jour l'emporte sur celui hérité de box.sh."""
    env = dict(os.environ)
    env.update(lire_env())
    env.setdefault("BOX_UID", str(os.getuid()))
    env.setdefault("BOX_GID", str(os.getgid()))
    return env


def lancer(*commande, capturer=False, verifier=True):
    resultat = subprocess.run(commande, cwd=PLATEFORME, env=environnement(), text=True,
                              capture_output=capturer)
    if verifier and resultat.returncode != 0:
        sys.exit(f"{ROUGE}ERREUR{FIN} : {' '.join(commande[:4])}… a échoué" +
                 (f"\n{resultat.stderr.strip()}" if capturer else ""))
    return resultat


def journal(type_evenement, detail, resultat="ok"):
    JOURNAL.parent.mkdir(parents=True, exist_ok=True)
    with JOURNAL.open("a", encoding="utf-8") as f:
        f.write(json.dumps({"date": datetime.now().astimezone().isoformat(timespec="seconds"),
                            "source": "plateforme", "type": type_evenement, "detail": detail,
                            "resultat": resultat}, ensure_ascii=False) + "\n")


def catalogue():
    return json.loads(CATALOGUE.read_text(encoding="utf-8"))["modeles"]


def memoire_go(modele):
    return modele.get("memoire_go") or round(modele["taille_go"] * 1.3 + 0.5, 1)


def memoire_machine_go():
    for ligne in Path("/proc/meminfo").read_text().splitlines():
        if ligne.startswith("MemTotal:"):
            return int(ligne.split()[1]) / 1024 / 1024
    return 0


def preparer_volume():
    if lancer("docker", "volume", "inspect", VOLUME, capturer=True, verifier=False).returncode != 0:
        lancer("docker", "compose", "--profile", "ollama", "up", "--no-start", "ia-moteur", capturer=True)


def installes():
    """Modèles présents dans le volume (lecture des manifestes, sans démarrer de serveur)."""
    preparer_volume()
    sortie = lancer("docker", "run", "--rm", "--entrypoint", "sh", "-v", f"{VOLUME}:/root/.ollama", IMAGE_OLLAMA, "-c",
                    "cd /root/.ollama/models/manifests/registry.ollama.ai/library 2>/dev/null && find . -type f",
                    capturer=True, verifier=False).stdout
    presents = {ligne[2:].replace("/", ":", 1) for ligne in sortie.split() if ligne.startswith("./")}
    env = lire_env()
    colibri = Path(env.get("COLIBRI_DIR", "/nulle-part"), "c", "coli")
    if colibri.exists() and Path(env.get("COLIBRI_MODELE", "/nulle-part")).is_dir():
        presents.add("qwen3.6-colibri")
    return presents


def actifs():
    env = lire_env()
    resultat = {env.get("IA_MODELE", "")}
    if env.get("IA_EMBEDDINGS_URL"):
        resultat.add(env.get("IA_MODELE_EMBEDDINGS", ""))
    return resultat


# ---------------------------------------------------------------- commandes

def liste():
    machine = memoire_machine_go()
    presents, en_service = installes(), actifs()
    print(f"\n{GRAS}Modèles d'IA de la box{FIN}  (mémoire de la machine : {machine:.1f} Go)\n")
    modeles = catalogue()
    for numero, m in enumerate(modeles, start=1):
        besoin = memoire_go(m)
        if besoin <= machine * 0.5:
            tient = f"{VERT}tient{FIN}"
        elif besoin <= machine * 0.8:
            tient = f"{JAUNE}juste{FIN}"
        else:
            tient = f"{ROUGE}trop gros{FIN}"
        etat = (f"{VERT}{GRAS}ACTIF{FIN}" if m["id"] in en_service else
                f"{VERT}installé{FIN}" if m["id"] in presents else f"{GRIS}à installer{FIN}")
        role = "recherche" if m["type"] == "recherche" else "rédaction"
        print(f" {numero:>2}. {GRAS}{m['nom']:<28}{FIN} {m['taille_go']:>5.1f} Go  mémoire ~{besoin:>4.1f} Go  "
              f"{tient:<18}  {etat:<20} {GRIS}{role}{FIN}")
        print(f"     {GRIS}{m['id']} · {m['editeur']} · {m['description']}{FIN}")
    print(f"\n {GRIS}Mémoire estimée (taille x 1,3 + 0,5 Go), à confirmer par une mesure.{FIN}")
    return modeles


def trouver(identifiant):
    for m in catalogue():
        if m["id"] == identifiant:
            return m
    sys.exit(f"{ROUGE}Modèle inconnu{FIN} : {identifiant} (voir ./box.sh ia liste)")


def installer(identifiant, demander=True):
    m = trouver(identifiant)
    if m["moteur"] == "colibri":
        print("Colibri s'installe hors de la box : voir https://github.com/JustVugg/colibri (./start-here.sh), "
              "puis renseigner COLIBRI_DIR et COLIBRI_MODELE dans .env.")
        return False
    if identifiant in installes():
        print(f"{VERT}déjà installé{FIN} : {m['nom']}")
        return True
    if demander:
        reponse = input(f"Télécharger {m['nom']} ({m['taille_go']} Go) depuis registry.ollama.ai ? "
                        "C'est une connexion sortante, inscrite au journal. [o/N] ")
        if reponse.strip().lower() not in ("o", "oui", "y"):
            print("annulé")
            return False
    nom = "box-ia-telechargement"
    lancer("docker", "rm", "-f", nom, capturer=True, verifier=False)
    # Conteneur temporaire, sur le réseau par défaut (internet) : il ne sert qu'au téléchargement.
    lancer("docker", "run", "-d", "--name", nom, "-v", f"{VOLUME}:/root/.ollama", IMAGE_OLLAMA, capturer=True)
    try:
        for _ in range(30):
            if lancer("docker", "exec", nom, "ollama", "list", capturer=True, verifier=False).returncode == 0:
                break
            time.sleep(1)
        journal("connexion_sortante", f"téléchargement du modèle {identifiant} depuis registry.ollama.ai", "en_cours")
        debut = time.monotonic()
        code = subprocess.run(["docker", "exec", "-t", nom, "ollama", "pull", identifiant]).returncode
        journal("connexion_sortante", f"modèle {identifiant} : téléchargement en {time.monotonic() - debut:.0f} s",
                "ok" if code == 0 else "echec")
        if code != 0:
            sys.exit(f"{ROUGE}Téléchargement échoué{FIN}")
    finally:
        lancer("docker", "rm", "-f", nom, capturer=True, verifier=False)
    print(f"{VERT}installé{FIN} : {m['nom']}")
    return True


def activer(identifiant):
    m = trouver(identifiant)
    if identifiant not in installes():
        sys.exit(f"{ROUGE}{m['nom']} n'est pas installé{FIN} : ./box.sh ia installer {identifiant}")
    env = lire_env()
    if m["type"] == "recherche":
        ecrire_env(IA_MODELE_EMBEDDINGS=identifiant, IA_EMBEDDINGS_URL=URL_OLLAMA, COMPOSE_PROFILES="ollama")
        lancer("docker", "compose", "--profile", "ollama", "up", "-d", "ia-moteur", "assistant")
    elif m["moteur"] == "colibri":
        recherche = env.get("IA_EMBEDDINGS_URL", "")
        ecrire_env(IA_MOTEUR="openai", IA_MODELE=identifiant,
                   COMPOSE_PROFILES="ollama" if recherche else "")
        lancer("./box.sh", "moteur-ia", "arreter", capturer=True, verifier=False)
        lancer("./box.sh", "moteur-ia", "demarrer")
        if not recherche:
            lancer("docker", "compose", "--profile", "ollama", "stop", "ia-moteur", capturer=True, verifier=False)
        lancer("docker", "compose", "up", "-d", "assistant")
    else:
        if env.get("IA_MOTEUR") == "openai":
            lancer("./box.sh", "moteur-ia", "arreter", verifier=False)
        ecrire_env(IA_MOTEUR="ollama", IA_MOTEUR_URL=URL_OLLAMA, IA_MODELE=identifiant, COMPOSE_PROFILES="ollama")
        lancer("docker", "compose", "--profile", "ollama", "up", "-d", "ia-moteur", "assistant")
    journal("modele_ia", f"modèle activé : {identifiant}")
    print(f"{VERT}actif{FIN} : {m['nom']}. L'assistant redémarre et charge le modèle (environ une minute) : "
          "suivre l'état sur https://" + env.get("BOX_DOMAIN", "cabinet.localhost"))


def supprimer(identifiant):
    m = trouver(identifiant)
    if m["moteur"] == "colibri":
        sys.exit("Colibri se désinstalle hors de la box (supprimer COLIBRI_MODELE).")
    if identifiant in actifs():
        sys.exit(f"{ROUGE}{m['nom']} est actif{FIN} : en activer un autre d'abord.")
    lancer("docker", "run", "--rm", "--entrypoint", "sh", "-v", f"{VOLUME}:/root/.ollama", IMAGE_OLLAMA, "-c",
           "ollama serve >/dev/null 2>&1 & sleep 2; ollama rm " + identifiant, capturer=True)
    journal("modele_ia", f"modèle supprimé : {identifiant}")
    print(f"supprimé : {m['nom']}")


def menu():
    modeles = liste()
    choix = input(f"\nNuméro du modèle à installer et activer (Entrée pour quitter) : ").strip()
    if not choix:
        return
    if not choix.isdigit() or not 1 <= int(choix) <= len(modeles):
        sys.exit("numéro invalide")
    m = modeles[int(choix) - 1]
    if memoire_go(m) > memoire_machine_go() * 0.8:
        if input(f"{JAUNE}Ce modèle risque de ne pas tenir en mémoire.{FIN} Continuer ? [o/N] ").strip().lower() not in ("o", "oui"):
            return
    if installer(m["id"]):
        activer(m["id"])


def main():
    if not ENV.exists():
        sys.exit("Fichier .env absent : lancer d'abord ./box.sh installer")
    arguments = sys.argv[1:]
    if not arguments:
        return menu()
    commande, *reste = arguments
    actions = {"liste": liste, "installer": installer, "activer": activer, "supprimer": supprimer}
    if commande not in actions or (commande != "liste" and len(reste) != 1):
        sys.exit(__doc__)
    actions[commande](*reste)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print()
