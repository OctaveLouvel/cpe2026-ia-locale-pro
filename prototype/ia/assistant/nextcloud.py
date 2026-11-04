"""Accès à Nextcloud avec les droits de la personne connectée : fichiers (WebDAV), agendas (CalDAV),
contacts (CardDAV).

L'assistant n'a aucun compte privilégié : il ne voit que ce que Nextcloud accepte de montrer à la
personne qui pose la question. Le coffre-fort de mots de passe n'est jamais contacté.
"""
import base64
import json
import re
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from . import config

NS = {"d": "DAV:", "oc": "http://owncloud.org/ns", "c": "urn:ietf:params:xml:ns:caldav",
      "card": "urn:ietf:params:xml:ns:carddav"}
PARIS = ZoneInfo(config.FUSEAU)


class AccesRefuse(Exception):
    """Identifiants refusés par Nextcloud."""


class Indisponible(Exception):
    """Nextcloud ne répond pas ou renvoie une erreur."""


@dataclass
class Fichier:
    fileid: str
    chemin: str  # chemin vu par la personne, depuis la racine de ses fichiers
    etag: str
    type_mime: str
    taille: int

    @property
    def nom(self):
        return self.chemin.rsplit("/", 1)[-1]

    @property
    def dossier(self):
        return self.chemin.rsplit("/", 1)[0].rsplit("/", 1)[-1] if "/" in self.chemin else ""


@dataclass
class Evenement:
    agenda: str
    titre: str
    debut: datetime
    fin: datetime | None
    journee: bool
    lieu: str = ""
    description: str = ""
    categories: list[str] = field(default_factory=list)


@dataclass
class Contact:
    carnet: str
    nom: str
    organisation: str = ""
    fonction: str = ""
    telephones: list[str] = field(default_factory=list)
    courriels: list[str] = field(default_factory=list)
    note: str = ""


class Client:
    def __init__(self, login: str, secret: str, ip_client: str | None = None):
        self.login = login
        self._entetes = {"Authorization": "Basic " + base64.b64encode(f"{login}:{secret}".encode()).decode(),
                         "OCS-APIRequest": "true"}
        # Nextcloud fait confiance au reverse proxy : l'adresse réelle du poste sert à sa protection
        # contre les essais de mots de passe.
        if ip_client:
            self._entetes["X-Forwarded-For"] = ip_client

    def _requete(self, methode, chemin, corps=None, entetes=None, ok=(200, 201, 204, 207)):
        donnees = corps.encode("utf-8") if isinstance(corps, str) else corps
        requete = urllib.request.Request(config.NC_URL + chemin, data=donnees, method=methode,
                                         headers={**self._entetes, **(entetes or {})})
        try:
            with urllib.request.urlopen(requete, timeout=60) as reponse:
                return reponse.read()
        except urllib.error.HTTPError as erreur:
            if erreur.code in ok:
                return erreur.read()
            if erreur.code in (401, 403):
                raise AccesRefuse() from None
            raise Indisponible(f"{methode} {chemin} : HTTP {erreur.code}") from None
        except (urllib.error.URLError, TimeoutError) as erreur:
            raise Indisponible(str(erreur)) from None

    def _dav(self, methode, chemin, corps, profondeur):
        contenu = self._requete(methode, chemin, corps, {"Depth": profondeur, "Content-Type": "application/xml; charset=utf-8"})
        return ET.fromstring(contenu)

    # ------------------------------------------------------------ compte

    def profil(self):
        donnees = json.loads(self._requete("GET", "/ocs/v1.php/cloud/user?format=json"))["ocs"]["data"]
        return {"login": donnees["id"], "nom": donnees.get("display-name") or donnees.get("displayname") or donnees["id"]}

    def groupes(self):
        donnees = json.loads(self._requete("GET", f"/ocs/v1.php/cloud/users/{urllib.parse.quote(self.login)}?format=json"))
        return donnees["ocs"]["data"].get("groups") or []

    def creer_mot_de_passe_application(self):
        """Échange le mot de passe de connexion contre un mot de passe d'application, révocable, visible
        par la personne dans ses réglages Nextcloud (« Appareils et sessions »)."""
        donnees = json.loads(self._requete("GET", "/ocs/v2.php/core/getapppassword?format=json"))
        return donnees["ocs"]["data"]["apppassword"]

    def revoquer_mot_de_passe_application(self):
        self._requete("DELETE", "/ocs/v2.php/core/apppassword?format=json")

    # ------------------------------------------------------------ fichiers

    def fichiers(self) -> list[Fichier]:
        racine = f"/remote.php/dav/files/{urllib.parse.quote(self.login)}/"
        corps = ('<?xml version="1.0"?><d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns"><d:prop>'
                 '<d:getetag/><d:getcontenttype/><d:getcontentlength/><d:resourcetype/><oc:fileid/>'
                 '</d:prop></d:propfind>')
        resultat = []
        for reponse in self._dav("PROPFIND", racine, corps, "infinity").findall("d:response", NS):
            proprietes = _proprietes(reponse)
            if proprietes is None or proprietes.find("d:resourcetype/d:collection", NS) is not None:
                continue
            href = urllib.parse.unquote(reponse.findtext("d:href", "", NS))
            resultat.append(Fichier(
                fileid=proprietes.findtext("oc:fileid", "", NS),
                chemin=href.split(urllib.parse.unquote(racine), 1)[-1],
                etag=proprietes.findtext("d:getetag", "", NS).strip('"'),
                type_mime=proprietes.findtext("d:getcontenttype", "", NS),
                taille=int(proprietes.findtext("d:getcontentlength", "0", NS) or 0)))
        return resultat

    def telecharger(self, fichier: Fichier) -> bytes:
        chemin = f"/remote.php/dav/files/{urllib.parse.quote(self.login)}/{urllib.parse.quote(fichier.chemin)}"
        return self._requete("GET", chemin)

    # ------------------------------------------------------------ agendas

    def _collections(self, racine, type_attendu):
        corps = '<?xml version="1.0"?><d:propfind xmlns:d="DAV:"><d:prop><d:displayname/><d:resourcetype/></d:prop></d:propfind>'
        collections = []
        for reponse in self._dav("PROPFIND", racine, corps, "1").findall("d:response", NS):
            proprietes = _proprietes(reponse)
            if proprietes is not None and proprietes.find(f"d:resourcetype/{type_attendu}", NS) is not None:
                collections.append((reponse.findtext("d:href", "", NS), proprietes.findtext("d:displayname", "", NS)))
        return collections

    def evenements(self, debut: datetime, fin: datetime) -> list[Evenement]:
        """Événements de tous les agendas visibles entre debut et fin, récurrences développées."""
        intervalle = f'start="{_utc(debut)}" end="{_utc(fin)}"'
        corps = ('<?xml version="1.0"?><c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">'
                 f'<d:prop><c:calendar-data><c:expand {intervalle}/></c:calendar-data></d:prop>'
                 '<c:filter><c:comp-filter name="VCALENDAR"><c:comp-filter name="VEVENT">'
                 f'<c:time-range {intervalle}/></c:comp-filter></c:comp-filter></c:filter></c:calendar-query>')
        evenements = []
        racine = f"/remote.php/dav/calendars/{urllib.parse.quote(self.login)}/"
        for href, nom in self._collections(racine, "c:calendar"):
            for reponse in self._dav("REPORT", href, corps, "1").findall("d:response", NS):
                proprietes = _proprietes(reponse)
                ics = proprietes.findtext("c:calendar-data", "", NS) if proprietes is not None else ""
                evenements += [e for e in _evenements_ics(ics, nom) if e.fin is None or e.fin > debut]
        return sorted(evenements, key=lambda e: e.debut)

    # ------------------------------------------------------------ contacts

    def contacts(self) -> list[Contact]:
        corps = ('<?xml version="1.0"?><card:addressbook-query xmlns:d="DAV:" xmlns:card="urn:ietf:params:xml:ns:carddav">'
                 '<d:prop><card:address-data/></d:prop></card:addressbook-query>')
        contacts = []
        racine = f"/remote.php/dav/addressbooks/users/{urllib.parse.quote(self.login)}/"
        for href, nom in self._collections(racine, "card:addressbook"):
            for reponse in self._dav("REPORT", href, corps, "1").findall("d:response", NS):
                proprietes = _proprietes(reponse)
                vcard = proprietes.findtext("card:address-data", "", NS) if proprietes is not None else ""
                if vcard:
                    contacts.append(_contact_vcard(vcard, nom))
        return contacts


# ---------------------------------------------------------------- analyse des réponses DAV

def _proprietes(reponse):
    """Propriétés renvoyées avec succès (le propstat dont le statut est 200)."""
    for propstat in reponse.findall("d:propstat", NS):
        if " 200 " in propstat.findtext("d:status", "", NS):
            return propstat.find("d:prop", NS)
    return None


def _utc(moment: datetime) -> str:
    return moment.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def _lignes(texte: str):
    """Lignes de contenu iCalendar ou vCard, repliées (RFC 5545 et 6350)."""
    lignes = []
    for ligne in texte.replace("\r\n", "\n").split("\n"):
        if ligne[:1] in (" ", "\t") and lignes:
            lignes[-1] += ligne[1:]
        elif ligne:
            lignes.append(ligne)
    for ligne in lignes:
        tete, _, valeur = ligne.partition(":")
        nom, *parametres = tete.split(";")
        yield nom.upper(), dict(p.split("=", 1) for p in parametres if "=" in p), valeur


def _texte(valeur: str) -> str:
    return (valeur.replace("\\n", "\n").replace("\\N", "\n").replace("\\,", ",").replace("\\;", ";")
                  .replace("\\\\", "\\"))


def _moment(valeur: str, parametres: dict) -> tuple[datetime, bool]:
    if parametres.get("VALUE") == "DATE" or re.fullmatch(r"\d{8}", valeur):
        jour = datetime.strptime(valeur[:8], "%Y%m%d")
        return jour.replace(tzinfo=PARIS), True
    moment = datetime.strptime(valeur.rstrip("Z"), "%Y%m%dT%H%M%S")
    if valeur.endswith("Z"):
        return moment.replace(tzinfo=timezone.utc).astimezone(PARIS), False
    return moment.replace(tzinfo=ZoneInfo(parametres.get("TZID", config.FUSEAU))).astimezone(PARIS), False


def _evenements_ics(ics: str, agenda: str) -> list[Evenement]:
    evenements, courant, dans_alarme = [], None, False
    for nom, parametres, valeur in _lignes(ics):
        if nom == "BEGIN" and valeur == "VEVENT":
            courant = {}
        elif nom == "BEGIN" and valeur == "VALARM":
            dans_alarme = True
        elif nom == "END" and valeur == "VALARM":
            dans_alarme = False
        elif nom == "END" and valeur == "VEVENT" and courant is not None:
            if "debut" in courant:
                evenements.append(Evenement(agenda=agenda, titre=courant.get("titre", "(sans titre)"),
                                            debut=courant["debut"], fin=courant.get("fin"),
                                            journee=courant.get("journee", False), lieu=courant.get("lieu", ""),
                                            description=courant.get("description", ""),
                                            categories=courant.get("categories", [])))
            courant = None
        elif courant is not None and not dans_alarme:
            if nom == "SUMMARY":
                courant["titre"] = _texte(valeur)
            elif nom == "DTSTART":
                courant["debut"], courant["journee"] = _moment(valeur, parametres)
            elif nom == "DTEND":
                courant["fin"], _ = _moment(valeur, parametres)
            elif nom == "LOCATION":
                courant["lieu"] = _texte(valeur)
            elif nom == "DESCRIPTION":
                courant["description"] = _texte(valeur)
            elif nom == "CATEGORIES":
                courant["categories"] = [_texte(c) for c in re.split(r"(?<!\\),", valeur)]
    return evenements


def _contact_vcard(vcard: str, carnet: str) -> Contact:
    contact = Contact(carnet=carnet, nom="")
    for nom, _, valeur in _lignes(vcard):
        if nom == "FN":
            contact.nom = _texte(valeur)
        elif nom == "ORG":
            contact.organisation = _texte(valeur).replace(";", " ").strip()
        elif nom == "TITLE":
            contact.fonction = _texte(valeur)
        elif nom == "TEL":
            contact.telephones.append(valeur)
        elif nom == "EMAIL":
            contact.courriels.append(valeur)
        elif nom == "NOTE":
            contact.note = _texte(valeur)
    return contact


def aujourdhui_local() -> date:
    return datetime.now(PARIS).date()
