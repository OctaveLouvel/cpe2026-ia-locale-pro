"""Catalogue des modèles d'IA : état, installation, activation, suppression (page « Modèles d'IA »).

- Les modèles Ollama tournent dans ia-moteur (réseau interne, sans internet).
- Le téléchargement et la suppression passent par ia-telechargeur, seul conteneur relié à internet, qui
  écrit dans le même volume. Chaque téléchargement est inscrit au journal.
- Colibri tourne hors conteneur ; on peut l'activer s'il est démarré (./box.sh moteur-ia demarrer).
"""
import json
from pathlib import Path

from . import config, journal
from .moteur import MoteurIndisponible, appeler, colibri_disponible, modeles_ollama


def catalogue():
    return json.loads(config.CATALOGUE.read_text(encoding="utf-8"))["modeles"]


def memoire_machine_go():
    for ligne in Path("/proc/meminfo").read_text().splitlines():
        if ligne.startswith("MemTotal:"):
            return round(int(ligne.split()[1]) / 1024 / 1024, 1)
    return 0.0


def memoire_go(modele):
    return modele.get("memoire_go") or round(modele["taille_go"] * 1.3 + 0.5, 1)


def etat(moteur):
    try:
        presents = modeles_ollama()
        moteur_ok = True
    except MoteurIndisponible:
        presents, moteur_ok = set(), False
    colibri = colibri_disponible()
    machine = memoire_machine_go()
    liste = []
    for m in catalogue():
        besoin = memoire_go(m)
        installe = colibri if m["moteur"] == "colibri" else m["id"] in presents
        actif = (m["id"] == moteur.modele) if m["type"] == "redaction" else (m["id"] == moteur.modele_embeddings)
        liste.append({**m, "memoire_estimee_go": besoin, "installe": installe, "actif": actif,
                      "tient": "oui" if besoin <= machine * 0.5 else "juste" if besoin <= machine * 0.8 else "non"})
    return {"memoire_machine_go": machine, "moteur_ollama": moteur_ok, "colibri": colibri, "modeles": liste}


def trouver(identifiant):
    for m in catalogue():
        if m["id"] == identifiant:
            return m
    raise KeyError(identifiant)


def installer(identifiant, utilisateur):
    """Télécharge un modèle Ollama. Produit des événements de progression."""
    m = trouver(identifiant)
    if m["moteur"] != "ollama":
        raise ValueError("Ce modèle s'installe hors de la box (Colibri).")
    journal.ecrire("connexion_sortante", utilisateur, {"action": "téléchargement", "modele": identifiant,
                                                       "depuis": "registry.ollama.ai"}, "en_cours")
    dernier = None
    try:
        with appeler(config.TELECHARGEUR_URL, "/api/pull", {"model": identifiant, "stream": True}, delai=7200) as r:
            for ligne in r:
                if not ligne.strip():
                    continue
                donnee = json.loads(ligne)
                if "error" in donnee:
                    raise MoteurIndisponible(donnee["error"])
                total, fait = donnee.get("total") or 0, donnee.get("completed") or 0
                evenement = {"type": "progression", "statut": donnee.get("status", ""),
                             "pourcent": round(100 * fait / total, 1) if total else None}
                if evenement != dernier:
                    dernier = evenement
                    yield evenement
    except MoteurIndisponible as erreur:
        journal.ecrire("connexion_sortante", utilisateur, {"action": "téléchargement", "modele": identifiant,
                                                           "erreur": str(erreur)}, "echec")
        raise
    journal.ecrire("connexion_sortante", utilisateur, {"action": "téléchargement", "modele": identifiant})


def activer(identifiant, moteur, index, utilisateur):
    m = trouver(identifiant)
    if m["type"] == "recherche":
        moteur.choisir(embeddings=identifiant)
        index.vecteurs = None  # recalculées avec le nouveau modèle au rechargement
    elif m["moteur"] == "colibri":
        if not colibri_disponible():
            raise ValueError("Colibri n'est pas démarré : ./box.sh moteur-ia demarrer sur la box.")
        moteur.choisir("openai", identifiant)
    else:
        if identifiant not in modeles_ollama():
            raise ValueError("Modèle non installé.")
        moteur.choisir("ollama", identifiant)
    journal.ecrire("modele_ia", utilisateur, {"action": "activation", "modele": identifiant})


def desactiver_recherche(moteur, index, utilisateur):
    moteur.choisir(embeddings=None)
    index.vecteurs = None
    journal.ecrire("modele_ia", utilisateur, {"action": "recherche par mots seulement"})


def supprimer(identifiant, moteur, utilisateur):
    m = trouver(identifiant)
    if m["moteur"] != "ollama":
        raise ValueError("Ce modèle se supprime hors de la box.")
    if identifiant in (moteur.modele, moteur.modele_embeddings):
        raise ValueError("Modèle actif : en activer un autre d'abord.")
    with appeler(config.TELECHARGEUR_URL, "/api/delete", {"model": identifiant}, methode="DELETE") as r:
        r.read()
    journal.ecrire("modele_ia", utilisateur, {"action": "suppression", "modele": identifiant})
