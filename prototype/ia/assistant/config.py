"""Réglages de l'assistant, lus dans l'environnement (voir prototype/plateforme/compose.yaml)."""
import os
from pathlib import Path

NC_URL = os.environ.get("NC_URL", "http://nextcloud").rstrip("/")

# Moteur de rédaction de départ : « ollama » (conteneur ia-moteur) ou « openai » (Colibri). Ensuite le choix
# se fait à chaud (page Modèles d'IA) et est enregistré dans <IA_DONNEES>/moteur.json.
MOTEUR = os.environ.get("IA_MOTEUR", "ollama")
MODELE = os.environ.get("IA_MODELE", "")
OLLAMA_URL = os.environ.get("IA_OLLAMA_URL", "http://ia-moteur:11434").rstrip("/")
# Seul conteneur relié à internet : il télécharge les modèles dans le volume partagé, sur ordre d'un administrateur.
TELECHARGEUR_URL = os.environ.get("IA_TELECHARGEUR_URL", "http://ia-telechargeur:11434").rstrip("/")
COLIBRI_URL = os.environ.get("IA_COLIBRI_URL", "").rstrip("/")
COLIBRI_CLE = os.environ.get("IA_MOTEUR_CLE", "")

# Recherche par le sens de départ (modèle d'embeddings d'Ollama). Vide = recherche par mots.
EMBEDDINGS_URL = os.environ.get("IA_EMBEDDINGS_URL", "")
MODELE_EMBEDDINGS = os.environ.get("IA_MODELE_EMBEDDINGS", "embeddinggemma-2:270m")

BOX_DOMAIN = os.environ.get("BOX_DOMAIN", "cabinet.localhost")
DONNEES = Path(os.environ.get("IA_DONNEES", "/donnees"))
JOURNAL = Path(os.environ.get("IA_JOURNAL", "/journal/assistant.jsonl"))
ACTIF = DONNEES / "moteur.json"
CATALOGUE = Path(os.environ.get("IA_CATALOGUE", "/app/modeles.json"))
# Groupes Nextcloud autorisés à choisir et installer les modèles.
GROUPES_ADMIN = set(os.environ.get("IA_GROUPES_ADMIN", "admin associes").split())
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

# Pack juridique (codes, lois, jurisprudence) : base SQLite en lecture seule, remplie par ./box.sh juridique.
# Absente : l'assistant répond seulement à partir des documents du cabinet.
JURIDIQUE_BASE = Path(os.environ.get("IA_JURIDIQUE_BASE", "/juridique/base.sqlite"))
# Passerelle de recherche en ligne (Légifrance, Judilibre). Vide : aucune recherche en ligne.
JURIDIQUE_EN_LIGNE = os.environ.get("IA_JURIDIQUE_EN_LIGNE", "")
EXTRAITS_JURIDIQUES = int(os.environ.get("IA_EXTRAITS_JURIDIQUES", "4"))
