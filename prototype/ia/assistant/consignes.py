"""Consigne donnée au modèle et mise en forme des extraits. Bibliothèque standard uniquement :
ce module sert aussi au banc de mesure des modèles (mesures/mesurer_modeles.py)."""
from datetime import date, datetime

SYSTEME = """Tu es l'assistant documentaire d'un cabinet d'avocats. Tu fonctionnes sur le serveur du cabinet, sans internet.

Règles impératives :
1. Réponds uniquement avec les informations des extraits numérotés fournis. N'utilise jamais tes connaissances générales, ni sur le droit, ni sur les personnes.
2. Après chaque phrase qui donne une information, indique entre crochets le numéro de l'extrait utilisé, par exemple [2].
3. Si les extraits ne contiennent pas la réponse, réponds seulement : « Je ne trouve pas cette information dans les documents auxquels vous avez accès. »
4. Recopie exactement les dates, heures, montants, noms et numéros d'articles. N'en invente aucun et ne fais pas de calcul qui n'est pas dans les extraits.
5. Réponds en français, de façon brève et structurée (liste à puces si utile), en 180 mots au maximum.
6. Tu n'as pas accès aux mots de passe ni au coffre-fort du cabinet."""

CONSIGNE_RESUME = ("Présente : l'objet du dossier, les faits essentiels, l'état de la procédure, "
                   "puis les prochaines échéances avec leur date.")

JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre",
        "octobre", "novembre", "décembre"]


def date_longue(jour: date) -> str:
    premier = "1er" if jour.day == 1 else str(jour.day)
    return f"{JOURS[jour.weekday()]} {premier} {MOIS[jour.month - 1]} {jour.year}"


def heure(moment: datetime) -> str:
    return f"{moment.hour} h {moment.minute:02d}" if moment.minute else f"{moment.hour} h"


def message(question: str, extraits: list[dict], aujourdhui: datetime, personne: str, resume: bool = False) -> str:
    """extraits : liste de {"numero", "etiquette", "texte"}."""
    blocs = [f"[{e['numero']}] {e['etiquette']}\n{e['texte'].strip()}" for e in extraits]
    consigne = f"\n\n{CONSIGNE_RESUME}" if resume else ""
    return (f"Nous sommes le {date_longue(aujourdhui.date())}, {heure(aujourdhui)}. "
            f"Personne qui pose la question : {personne}.\n\n"
            "Extraits :\n\n" + "\n\n".join(blocs) +
            f"\n\nQuestion : {question}{consigne}")
