"""Réglages de l'assistant, lus dans l'environnement (voir prototype/plateforme/compose.yaml)."""
import os
from pathlib import Path

NC_URL = os.environ.get("NC_URL", "http://nextcloud").rstrip("/")

# Moteur de rédaction : « ollama » (choix de la démo, conteneur ia-moteur) ou « openai » pour un serveur
# compatible OpenAI (Colibri...). Il n'est joignable que depuis le réseau interne de la box.
MOTEUR = os.environ.get("IA_MOTEUR", "ollama")
MOTEUR_URL = os.environ.get("IA_MOTEUR_URL", "http://ia-moteur:11434").rstrip("/")
MOTEUR_CLE = os.environ.get("IA_MOTEUR_CLE", "")
MODELE = os.environ.get("IA_MODELE", "qwen3:4b")

# Recherche par le sens, en option : un serveur Ollama avec un modèle d'embeddings. Vide = recherche par mots.
EMBEDDINGS_URL = os.environ.get("IA_EMBEDDINGS_URL", "http://ia-moteur:11434").rstrip("/")
MODELE_EMBEDDINGS = os.environ.get("IA_MODELE_EMBEDDINGS", "embeddinggemma-2:270m")

BOX_DOMAIN = os.environ.get("BOX_DOMAIN", "cabinet.localhost")
DONNEES = Path(os.environ.get("IA_DONNEES", "/donnees"))
JOURNAL = Path(os.environ.get("IA_JOURNAL", "/journal/assistant.jsonl"))
PORT = int(os.environ.get("IA_PORT", "8000"))
FUSEAU = "Europe/Paris"

# Taille du contexte (tokens) et nombre d'extraits donnés au modèle. Sur processeur, la lecture du contexte
# domine le temps de réponse : peu d'extraits, mais les bons.
CONTEXTE = int(os.environ.get("IA_CONTEXTE", "4096"))
EXTRAITS = int(os.environ.get("IA_EXTRAITS", "5"))
EXTRAITS_RESUME = int(os.environ.get("IA_EXTRAITS_RESUME", "5"))
MOTS_PAR_EXTRAIT = int(os.environ.get("IA_MOTS_PAR_EXTRAIT", "130"))
JOURS_AGENDA = int(os.environ.get("IA_JOURS_AGENDA", "45"))
GENERATION_MAX = int(os.environ.get("IA_GENERATION_MAX", "400"))
