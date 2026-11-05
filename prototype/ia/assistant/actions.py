"""Actions de l'assistant dans Nextcloud : ajouter un rendez-vous à l'agenda, créer un dossier.

Jamais sans accord : l'assistant comprend la demande, montre ce qu'il va faire (titre, date, heure, agenda ou
emplacement), et n'agit qu'après le clic « Confirmer ». L'action se fait avec les droits Nextcloud de la
personne (un agenda ou un dossier qu'elle ne peut pas modifier est refusé par Nextcloud) et elle est inscrite
au journal d'audit.

Les dates et heures sont lues par le code (« demain à 14 h », « jeudi 12 novembre de 10 h à 11 h 30 »), pas par
le modèle : un petit modèle se trompe dans les calculs de dates. Le modèle ne sert qu'à formuler le titre.
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

AGENDA = re.compile(r"(?i)\b(ajoute[rz]?|cr[ée]e[rz]?|planifie[rz]?|programme[rz]?|note[rz]?|mets|mettre|place[rz]?|"
                    r"fixe[rz]?|cale[rz]?|inscris|inscrire|bloque[rz]?|r[ée]serve[rz]?|pr[ée]vois|pr[ée]voir)\b.*\b(rendez-vous|rdv|r[ée]unions?|audiences?|"
                    r"[ée]v[ée]nements?|agenda|calendrier|rappels?|cr[ée]neaux?|appels?|entretiens?|rencontres?)\b")
DOSSIER = re.compile(r"(?i)\b(cr[ée]e[rz]?|ouvr\w*\s+un|ajoute[rz]?\s+un|nouveau)\s+(?:un\s+|le\s+|nouveau\s+)?"
                     r"(?:sous-)?dossier\b\s*(?P<nom>.*)$")
JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
MOIS = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre",
        "decembre"]
DUREE_DEFAUT = timedelta(hours=1)
EXPIRATION = 15 * 60


def _sans_accents(texte):
    texte = unicodedata.normalize("NFKD", texte.lower())
    return "".join(c for c in texte if not unicodedata.combining(c))


def type_action(question: str) -> str | None:
    if DOSSIER.search(question):
        return "dossier"
    if AGENDA.search(question):
        return "agenda"
    return None


# ------------------------------------------------------------ dates et heures

def lire_date(texte: str, aujourdhui: date) -> date | None:
    t = _sans_accents(texte)
    if "apres-demain" in t or "apres demain" in t:
        return aujourdhui + timedelta(days=2)
    if "demain" in t:
        return aujourdhui + timedelta(days=1)
    if "aujourd'hui" in t or "ce jour" in t or "ce soir" in t or "cet apres-midi" in t:
        return aujourdhui
    m = re.search(r"\b(\d{1,2})(?:er)?\s+(" + "|".join(MOIS) + r")(?:\s+(\d{4}))?", t)
    if m:
        annee = int(m.group(3)) if m.group(3) else aujourdhui.year
        jour = date(annee, MOIS.index(m.group(2)) + 1, int(m.group(1)))
        return jour if m.group(3) or jour >= aujourdhui else jour.replace(year=annee + 1)
    m = re.search(r"\b(\d{1,2})/(\d{1,2})(?:/(\d{2,4}))?\b", t)
    if m:
        annee = int(m.group(3)) if m.group(3) else aujourdhui.year
        annee += 2000 if annee < 100 else 0
        jour = date(annee, int(m.group(2)), int(m.group(1)))
        return jour if m.group(3) or jour >= aujourdhui else jour.replace(year=annee + 1)
    m = re.search(r"\b(" + "|".join(JOURS) + r")\b", t)
    if m:
        # Le prochain jour de ce nom (jamais aujourd'hui) ; « la semaine prochaine » : dans la semaine suivante.
        ecart = (JOURS.index(m.group(1)) - aujourdhui.weekday()) % 7 or 7
        if "semaine prochaine" in t and ecart <= 6 - aujourdhui.weekday():
            ecart += 7
        return aujourdhui + timedelta(days=ecart)
    return None


_HEURE = r"(\d{1,2})\s*(?:h|heures?|:)\s*(\d{2})?"


def lire_heures(texte: str):
    """(début, fin) en (heure, minute), ou None. « de 10 h à 11 h 30 », « à 14h », « 9:15 »."""
    t = _sans_accents(texte)
    m = re.search(rf"\b(?:de|entre)\s+{_HEURE}\s*(?:a|et|-)\s*{_HEURE}", t)
    if m:
        return (int(m.group(1)), int(m.group(2) or 0)), (int(m.group(3)), int(m.group(4) or 0))
    m = re.search(rf"\b{_HEURE}\b", t)
    if m and int(m.group(1)) < 24:
        return (int(m.group(1)), int(m.group(2) or 0)), None
    if "midi" in t:
        return (12, 0), None
    return None


def lire_duree(texte: str) -> timedelta | None:
    t = _sans_accents(texte)
    m = re.search(r"\b(?:pendant|durant|pour|d'une duree de)\s+(\d+)\s*(h|heures?|min|minutes?)\b", t)
    if not m:
        m = re.search(r"\b(une|1)\s+(heure)\b|\b(une demi-heure|30 min)\b", t)
        if m and m.group(3):
            return timedelta(minutes=30)
        return timedelta(hours=1) if m else None
    n = int(m.group(1))
    return timedelta(hours=n) if m.group(2).startswith("h") else timedelta(minutes=n)


# ------------------------------------------------------------ propositions

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


def _titre_par_defaut(question):
    """Titre tiré de la demande : ce qui suit le mot « rendez-vous », « réunion »... sans la date ni l'heure."""
    texte = re.sub(r"(?i)\s*(?:de |dans )?la semaine prochaine|\s+prochaine?\b", " ", question)
    texte = re.sub(r"(?i)\b(demain|apr[eè]s-demain|aujourd'hui|(?:le\s+)?(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)"
                   r"(?:\s+prochain)?|(?:le\s+)?\d{1,2}(?:er)?\s+\w+(?:\s+\d{4})?|\d{1,2}/\d{1,2}(?:/\d{2,4})?|"
                   r"(?:de|entre|à|a|vers)?\s*\d{1,2}\s*(?:h|heures?|:)\s*\d{0,2}(?:\s*(?:à|a|et|-)\s*\d{1,2}\s*(?:h|heures?|:)?\s*\d{0,2})?|"
                   r"dans (?:mon|l'|le) (?:agenda|calendrier)\w*|(?:pendant|durant|pour)\s+\d+\s*\w+|s'il te pla[iî]t|stp|svp)\b", " ", texte)
    m = re.search(r"(?i)\b(rendez-vous|rdv|r[ée]union|audience|[ée]v[ée]nement|rappel|appel|entretien|rencontre)\b(.*)", texte)
    titre = (m.group(1) + m.group(2)) if m else texte
    titre = re.sub(r"\s+", " ", titre).strip(" .,;:!?")
    titre = re.sub(r"(?i)^rdv\b", "Rendez-vous", titre)
    return (titre[:1].upper() + titre[1:])[:120] if titre else "Rendez-vous"


def proposer_rendez_vous(session, question: str, maintenant: datetime) -> dict:
    jour = lire_date(question, maintenant.date())
    heures = lire_heures(question)
    manque = [nom for nom, valeur in (("la date", jour), ("l'heure", heures)) if valeur is None]
    if manque and not re.search(r"(?i)journ[ée]e enti[èe]re|toute la journ[ée]e", question):
        return {"type": "texte", "texte": f"Pour ajouter ce rendez-vous, il me manque {' et '.join(manque)}. "
                                          "Par exemple : « Ajoute un rendez-vous avec M. Garnier demain de 14 h à 15 h »."}
    journee = heures is None
    if journee:
        debut, fin = datetime.combine(jour, datetime.min.time(), PARIS), None
    else:
        (h, mi), fin_h = heures
        debut = datetime(jour.year, jour.month, jour.day, h, mi, tzinfo=PARIS)
        fin = datetime(jour.year, jour.month, jour.day, *fin_h, tzinfo=PARIS) if fin_h else debut + (lire_duree(question) or DUREE_DEFAUT)
    agendas = session.client.agendas()
    if not agendas:
        return {"type": "texte", "texte": "Je ne trouve aucun agenda que vous puissiez modifier."}
    cible = _choisir_agenda(agendas, question)
    lieu = ""
    m = re.search(r"(?i)\b(?:au|à la|à l'|a la|chez|en salle|salle)\s+((?:cabinet|tribunal|cour|salle|si[eè]ge|visio)\b[^,.;]*)", question)
    if m:
        lieu = m.group(1).strip()
    p = _garder(Proposition(secrets.token_urlsafe(16), "agenda", session.login, {
        "titre": _titre_par_defaut(question), "debut": debut.isoformat(), "fin": fin.isoformat() if fin else None,
        "journee": journee, "lieu": lieu, "agenda": cible[1], "href": cible[0]}))
    return {"type": "action", "jeton": p.jeton, "action": "agenda", "details": _public(p.details)}


def _choisir_agenda(agendas, question):
    q = _sans_accents(question)
    for href, nom in agendas:
        if nom and _sans_accents(nom) in q:
            return href, nom
    if re.search(r"\baudiences?\b", q):
        for href, nom in agendas:
            if "audience" in _sans_accents(nom):
                return href, nom
    personnel = [a for a in agendas if a[0].rstrip("/").endswith("/personal")]
    return (personnel or agendas)[0]


def proposer_dossier(session, question: str, fichiers) -> dict:
    m = DOSSIER.search(question)
    nom = re.sub(r"(?i)^(?:pour|nomm[ée]|appel[ée]|intitul[ée])\s+", "", (m.group("nom") if m else "").strip())
    nom = re.sub(r"(?i)\s+(?:dans|sous)\s+(?:les?\s+)?(?:dossiers? clients?|mes fichiers)\s*$", "", nom)
    nom = nom.strip(" .,;:!?«»\"'")
    if not nom:
        return {"type": "texte", "texte": "Quel nom faut-il donner au dossier ? Par exemple : « Crée le dossier 2026-021 Martin, bail commercial »."}
    if re.search(r"[\\/:*?\"<>|]", nom) or nom.startswith(".") or len(nom) > 120:
        return {"type": "texte", "texte": "Ce nom de dossier contient des caractères interdits (/ \\ : * ? \" < > |)."}
    parent = _dossier_des_clients(fichiers)
    p = _garder(Proposition(secrets.token_urlsafe(16), "dossier", session.login, {"nom": nom, "parent": parent}))
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
