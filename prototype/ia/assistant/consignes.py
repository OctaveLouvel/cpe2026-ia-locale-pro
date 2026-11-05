"""Consigne donnée au modèle et mise en forme des extraits. Bibliothèque standard uniquement :
ce module sert aussi au banc de mesure des modèles (mesures/mesurer_modeles.py)."""
from datetime import date, datetime, timedelta

SYSTEME = """Tu es l'assistant documentaire d'un cabinet d'avocats. Tu fonctionnes sur le serveur du cabinet, sans internet.

Règles impératives :
1. Réponds uniquement avec les informations des extraits numérotés fournis. N'utilise jamais tes connaissances générales, ni sur le droit, ni sur les personnes.
2. Après chaque phrase qui donne une information, indique entre crochets le numéro de l'extrait utilisé, par exemple [2].
3. Si les extraits ne contiennent pas la réponse, réponds seulement : « Je ne trouve pas cette information dans les documents auxquels vous avez accès. » Si tu as répondu, n'ajoute jamais cette phrase.
4. Recopie exactement les dates, heures, montants, noms et numéros d'articles. N'en invente aucun et ne fais pas de calcul qui n'est pas dans les extraits.
5. Réponds en français, en vouvoyant la personne, de façon brève et structurée (liste à puces si utile), en 180 mots au maximum. Tu peux rédiger (courrier, courriel, note) à partir des extraits si on te le demande.
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


AGENT = """Tu es l'assistant d'un cabinet d'avocats. Tu fonctionnes sur le serveur du cabinet, sans internet.

Tu as des outils : chercher dans les documents du cabinet, lire les agendas, chercher dans les contacts, proposer un rendez-vous, proposer un dossier. Décide toi-même s'il en faut et lesquels, puis réponds.

Règles :
1. Pour tout ce qui concerne le cabinet (dossiers, documents, rendez-vous, audiences, échéances, contacts), utilise les outils : ne réponds jamais de mémoire sur le cabinet.
2. Les résultats des outils sont numérotés. Après chaque information qui en vient, indique le numéro entre crochets, par exemple [2]. Recopie exactement les dates, heures, montants, noms et numéros d'articles.
3. Si les outils ne trouvent rien, dis-le simplement. N'invente jamais un fait sur un dossier, un client ou une personne.
4. Pour une question générale (discussion, rédaction, explication), tu peux répondre de tes connaissances, sans outil. Sur une question de droit, précise que la réponse vient de tes connaissances et doit être vérifiée dans les textes.
5. Pour ajouter un rendez-vous ou créer un dossier, utilise les outils de proposition : la personne voit la proposition et la confirme elle-même. Ne dis pas que c'est fait avant sa confirmation.
6. Tu n'as pas accès aux mots de passe ni au coffre-fort du cabinet : aucun outil ne le permet.
7. Réponds en français, en vouvoyant la personne, de façon claire et brève."""


def agent(maintenant: datetime, personne: str) -> str:
    """Consigne de l'assistant, avec la date et les quinze prochains jours pour situer « demain », « lundi »..."""
    jours = "\n".join(f"- {date_longue(maintenant.date() + timedelta(days=n))} : {(maintenant.date() + timedelta(days=n)).isoformat()}"
                       for n in range(15))
    return (f"{AGENT}\n\nNous sommes le {date_longue(maintenant.date())}, {heure(maintenant)}. "
            f"Personne connectée : {personne}.\nCalendrier des prochains jours :\n{jours}")
