"""Réglages du tableau de bord, lus dans l'environnement (voir prototype/plateforme/compose.yaml)."""
import os
from pathlib import Path
from zoneinfo import ZoneInfo

NC_URL = os.environ.get("NC_URL", "http://nextcloud").rstrip("/")
COFFRE_URL = os.environ.get("COFFRE_URL", "http://coffre").rstrip("/")
ASSISTANT_URL = os.environ.get("ASSISTANT_URL", "http://assistant:8000").rstrip("/")
MOTEUR_URL = os.environ.get("MOTEUR_URL", "http://ia-moteur:11434").rstrip("/")

# Journaux JSON Lines de la box (plateforme, assistant, tableau de bord, et ceux de DEV-4).
JOURNAUX = Path(os.environ.get("TB_JOURNAUX", "/journal"))
JOURNAL = JOURNAUX / "tableau-de-bord.jsonl"
COMPOSE = Path(os.environ.get("TB_COMPOSE", "/box/compose.yaml"))

# Groupes Nextcloud autorisés à lire le journal d'audit (mêmes que pour les modèles d'IA).
GROUPES_ADMIN = set(os.environ.get("TB_GROUPES_ADMIN", "admin associes").split())
# Au-delà, la dernière sauvegarde est signalée comme trop ancienne (une sauvegarde chaque nuit).
SAUVEGARDE_MAX_HEURES = int(os.environ.get("TB_SAUVEGARDE_MAX_HEURES", "26"))
DELAI_SANTE = float(os.environ.get("TB_DELAI_SANTE", "3"))
PORT = int(os.environ.get("TB_PORT", "8000"))
PARIS = ZoneInfo("Europe/Paris")
