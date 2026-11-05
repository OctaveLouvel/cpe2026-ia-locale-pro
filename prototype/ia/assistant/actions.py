"""Actions de l'assistant dans Nextcloud : ajouter un rendez-vous à l'agenda, créer un dossier.

C'est le modèle qui décide de proposer une action et qui en donne le contenu (titre, date, heure, nom), en
appelant les outils proposer_rendez_vous ou proposer_dossier. Le code vérifie seulement que le contenu est
utilisable (date lisible, nom de dossier sans caractère interdit), puis montre la proposition : rien n'est
fait avant le clic « Confirmer ». L'action se fait avec les droits Nextcloud de la personne et elle est
inscrite au journal d'audit.
"""
import re
import secrets
import threading
import time
import unicodedata
import urllib.parse
import uuid
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone

from .nextcloud import PARIS

DUREE_DEFAUT = timedelta(hours=1)
EXPIRATION = 15 * 60


def _sans_accents(texte):
    texte = unicodedata.normalize("NFKD", texte.lower())
    return "".join(c for c in texte if not unicodedata.combining(c))


@dataclass
class Proposition:
    jeton: str
    type: str
    login: str
    details: dict
    cree: float = field(default_factory=time.time)


_attente: dict[str, Proposition] = {}
_verrou = threading.Lock()


def _garder(proposition):
    with _verrou:
        for jeton in [j for j, p in _attente.items() if time.time() - p.cree > EXPIRATION]:
            del _attente[jeton]
        _attente[proposition.jeton] = proposition
    return proposition


def reprendre(jeton: str, login: str) -> Proposition | None:
    with _verrou:
        p = _attente.pop(jeton, None)
    if p is None or p.login != login or time.time() - p.cree > EXPIRATION:
        return None
    return p


def _moment(valeur: str) -> tuple[datetime, bool]:
    """« 2026-11-06T14:00 » ou « 2026-11-06 » (journée entière). ValueError sinon : le modèle reçoit l'erreur."""
    valeur = valeur.strip().replace(" ", "T")
    if len(valeur) == 10:
        jour = date.fromisoformat(valeur)
        return datetime(jour.year, jour.month, jour.day, tzinfo=PARIS), True
    moment = datetime.fromisoformat(valeur[:16])
    return moment.replace(tzinfo=PARIS) if moment.tzinfo is None else moment.astimezone(PARIS), False


def proposer_rendez_vous(session, titre: str, debut: str, fin: str = "", lieu: str = "", agenda: str = "") -> dict:
    moment, journee = _moment(debut)
    fin_moment = None if journee else (_moment(fin)[0] if fin else moment + DUREE_DEFAUT)
    if fin_moment is not None and fin_moment <= moment:
        raise ValueError("la fin doit être après le début")
    agendas = session.client.agendas()
    if not agendas:
        raise ValueError("aucun agenda accessible")
    cible = next((a for a in agendas if agenda and _sans_accents(agenda) in _sans_accents(a[1])), None) \
        or next((a for a in agendas if a[0].rstrip("/").endswith("/personal")), agendas[0])
    p = _garder(Proposition(secrets.token_urlsafe(16), "agenda", session.login, {
        "titre": titre.strip()[:120] or "Rendez-vous", "debut": moment.isoformat(),
        "fin": fin_moment.isoformat() if fin_moment else None, "journee": journee, "lieu": lieu.strip()[:120],
        "agenda": cible[1], "href": cible[0]}))
    return {"type": "action", "jeton": p.jeton, "action": "agenda", "details": _public(p.details)}


def proposer_dossier(session, nom: str, fichiers) -> dict:
    nom = nom.strip()
    if not nom or re.search(r"[\\/:*?\"<>|]", nom) or nom.startswith(".") or len(nom) > 120:
        raise ValueError("nom de dossier vide ou avec un caractère interdit (/ \\ : * ? \" < > |)")
    p = _garder(Proposition(secrets.token_urlsafe(16), "dossier", session.login,
                            {"nom": nom, "parent": _dossier_des_clients(fichiers)}))
    return {"type": "action", "jeton": p.jeton, "action": "dossier", "details": _public(p.details)}


def _dossier_des_clients(fichiers) -> str:
    """Le dossier qui regroupe les dossiers clients (« Dossiers clients »), sinon la racine des fichiers."""
    parents = [f.chemin.split("/")[0] for f in fichiers if f.chemin.count("/") >= 2]
    candidats = [p for p in dict.fromkeys(parents) if "dossier" in _sans_accents(p)]
    return candidats[0] if candidats else ""


def _public(details):
    return {k: v for k, v in details.items() if k != "href"}


# ------------------------------------------------------------ exécution

def _ics(details) -> tuple[str, str]:
    uid = str(uuid.uuid4())
    debut = datetime.fromisoformat(details["debut"])

    def echapper(t):
        return t.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")

    if details["journee"]:
        moments = [f"DTSTART;VALUE=DATE:{debut:%Y%m%d}", f"DTEND;VALUE=DATE:{debut + timedelta(days=1):%Y%m%d}"]
    else:
        fin = datetime.fromisoformat(details["fin"])
        moments = [f"DTSTART;TZID=Europe/Paris:{debut:%Y%m%dT%H%M%S}", f"DTEND;TZID=Europe/Paris:{fin:%Y%m%dT%H%M%S}"]
    lignes = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//asoterIA//Assistant//FR", "BEGIN:VEVENT", f"UID:{uid}",
              f"DTSTAMP:{datetime.now(timezone.utc):%Y%m%dT%H%M%SZ}", *moments, f"SUMMARY:{echapper(details['titre'])}"]
    if details.get("lieu"):
        lignes.append(f"LOCATION:{echapper(details['lieu'])}")
    lignes += ["DESCRIPTION:Ajouté par l'assistant à la demande de la personne connectée", "END:VEVENT", "END:VCALENDAR"]
    return uid, "\r\n".join(lignes) + "\r\n"


def executer(session, proposition: Proposition) -> str:
    d = proposition.details
    if proposition.type == "agenda":
        uid, ics = _ics(d)
        session.client.ajouter_evenement(d["href"], uid, ics)
        debut = datetime.fromisoformat(d["debut"])
        quand = debut.strftime("%d/%m/%Y") + ("" if d["journee"] else debut.strftime(" à %H:%M"))
        return f"Rendez-vous « {d['titre']} » ajouté à l'agenda « {d['agenda']} » le {quand}."
    chemin = f"{d['parent']}/{d['nom']}" if d["parent"] else d["nom"]
    session.client.creer_dossier(chemin)
    return f"Dossier « {d['nom']} » créé dans « {d['parent'] or 'vos fichiers'} »."


def lien(proposition: Proposition, domaine: str) -> str:
    d = proposition.details
    if proposition.type == "agenda":
        return f"https://cloud.{domaine}/apps/calendar/timeGridWeek/{d['debut'][:10]}"
    chemin = f"/{d['parent']}/{d['nom']}" if d["parent"] else f"/{d['nom']}"
    return f"https://cloud.{domaine}/apps/files/?dir={urllib.parse.quote(chemin)}"
