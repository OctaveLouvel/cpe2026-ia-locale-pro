#!/usr/bin/env python3
"""Charge le jeu de données FICTIF du cabinet dans la box.

Lancé par `./box.sh donnees-demo`, dans un conteneur relié au réseau interne de la box :
il parle directement à Nextcloud (http://nextcloud) et au coffre-fort (http://coffre).
Relançable sans risque : ce qui existe déjà est mis à jour, rien n'est créé en double.

Ce qui est chargé (description complète dans prototype/donnees-demo/cabinet.json) :
  - 4 comptes et leurs groupes ;
  - les documents des dossiers, déposés dans l'espace de l'associée puis partagés par groupe ;
  - 3 agendas et 2 carnets d'adresses, partagés selon les droits de chacun ;
  - une invitation au coffre-fort pour l'associée.
"""
import base64
import json
import os
import pathlib
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

import inviter_coffre

DONNEES = pathlib.Path("/donnees-demo")
NC = os.environ.get("NC_URL", "http://nextcloud").rstrip("/")
ADMIN = (os.environ["NC_ADMIN_USER"], os.environ["NC_ADMIN_PASSWORD"])
MOT_DE_PASSE_DEMO = os.environ["DEMO_MOT_DE_PASSE"]

CABINET = json.loads((DONNEES / "cabinet.json").read_text(encoding="utf-8"))
INDEX = json.loads((DONNEES / "index.json").read_text(encoding="utf-8"))
COMPTES = {u["id"]: (u["id"], MOT_DE_PASSE_DEMO) for u in CABINET["utilisateurs"]}
PROPRIETAIRE = CABINET["proprietaire_des_fichiers"]

# Droits des partages Nextcloud : lecture = 1 ; modification = lecture + écriture + création
# + suppression = 15 (pas de droit de repartage : il est désactivé sur la box).
PERMISSIONS = {"lecture": 1, "modification": 15}


class Echec(Exception):
    pass


def http(methode, url, compte=None, corps=None, entetes=None, acceptes=(200, 201, 204, 207)):
    if isinstance(corps, str):
        corps = corps.encode("utf-8")
    requete = urllib.request.Request(url, data=corps, method=methode)
    if compte:
        jeton = base64.b64encode(f"{compte[0]}:{compte[1]}".encode()).decode()
        requete.add_header("Authorization", f"Basic {jeton}")
    for cle, valeur in (entetes or {}).items():
        requete.add_header(cle, valeur)
    try:
        with urllib.request.urlopen(requete, timeout=120) as reponse:
            return reponse.status, reponse.read(), reponse.headers
    except urllib.error.HTTPError as erreur:
        contenu = erreur.read()
        if erreur.code in acceptes:
            return erreur.code, contenu, erreur.headers
        raise Echec(f"{methode} {url} : HTTP {erreur.code} {contenu[:300]!r}") from None


def ocs(methode, chemin, compte=ADMIN, **params):
    """Appel à l'API OCS v1 de Nextcloud. Renvoie (code OCS, données)."""
    corps = urllib.parse.urlencode(params, doseq=True) if params and methode != "GET" else None
    url = f"{NC}/ocs/v1.php{chemin}"
    url += ("&" if "?" in url else "?") + "format=json"
    if params and methode == "GET":
        url += "&" + urllib.parse.urlencode(params, doseq=True)
    entetes = {"OCS-APIRequest": "true"}
    if corps:
        entetes["Content-Type"] = "application/x-www-form-urlencoded"
    _, contenu, _ = http(methode, url, compte, corps, entetes)
    reponse = json.loads(contenu)["ocs"]
    return reponse["meta"]["statuscode"], reponse["data"]


def dav(chemin):
    return f"{NC}/remote.php/dav/{chemin}"


def encoder(chemin):
    return "/".join(urllib.parse.quote(morceau) for morceau in chemin.split("/"))


def attendre_nextcloud():
    for _ in range(60):
        try:
            _, contenu, _ = http("GET", f"{NC}/status.php")
            if json.loads(contenu).get("installed"):
                return
        except (Echec, urllib.error.URLError, ConnectionError):
            pass
        time.sleep(5)
    sys.exit("Nextcloud ne répond pas")


# ---------------------------------------------------------------- comptes et groupes

def creer_groupes():
    for groupe, nom in CABINET["groupes"].items():
        code, _ = ocs("POST", "/cloud/groups", groupid=groupe, displayname=nom)
        if code not in (100, 102):
            raise Echec(f"groupe {groupe} : code OCS {code}")
        if code == 102:  # existe déjà : on remet le nom affiché à jour
            ocs("PUT", f"/cloud/groups/{urllib.parse.quote(groupe)}", key="displayname", value=nom)
    print(f"  {len(CABINET['groupes'])} groupes")


def creer_comptes():
    for u in CABINET["utilisateurs"]:
        code, _ = ocs("POST", "/cloud/users", userid=u["id"], password=MOT_DE_PASSE_DEMO,
                      displayName=u["affichage"], email=u["courriel"], language="fr",
                      **{"groups[]": u["groupes"]})
        if code == 102:  # existe déjà : mise à jour
            for cle, valeur in (("password", MOT_DE_PASSE_DEMO), ("displayname", u["affichage"]),
                                ("email", u["courriel"]), ("language", "fr")):
                ocs("PUT", f"/cloud/users/{u['id']}", key=cle, value=valeur)
            for groupe in u["groupes"]:
                ocs("POST", f"/cloud/users/{u['id']}/groups", groupid=groupe)
        elif code != 100:
            raise Echec(f"compte {u['id']} : code OCS {code}")
        print(f"  {u['id']:10} {u['affichage']} ({u['fonction']})")


# ---------------------------------------------------------------- fichiers et partages

def creer_dossiers(compte, chemin):
    courant = ""
    for morceau in chemin.split("/"):
        courant = f"{courant}/{morceau}" if courant else morceau
        http("MKCOL", dav(f"files/{compte}/{encoder(courant)}"), COMPTES[compte], acceptes=(201, 405))


def deposer_documents():
    racine = DONNEES / "fichiers"
    for document in INDEX["documents"]:
        chemin = document["chemin"]
        creer_dossiers(PROPRIETAIRE, str(pathlib.PurePosixPath(chemin).parent))
        type_mime = ("application/pdf" if document["format"] == "pdf" else
                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        http("PUT", dav(f"files/{PROPRIETAIRE}/{encoder(chemin)}"), COMPTES[PROPRIETAIRE],
             corps=(racine / chemin).read_bytes(),
             entetes={"Content-Type": type_mime, "X-OC-Mtime": str(document["horodatage"])})
    print(f"  {len(INDEX['documents'])} documents déposés dans l'espace de {PROPRIETAIRE}")


def partager_dossiers():
    compte = COMPTES[PROPRIETAIRE]
    for dossier in CABINET["dossiers"]:
        chemin = "/" + dossier["chemin"]
        creer_dossiers(PROPRIETAIRE, dossier["chemin"])
        _, existants = ocs("GET", "/apps/files_sharing/api/v1/shares", compte, path=chemin, reshares="false")
        par_groupe = {p["share_with"]: p for p in existants if p["share_type"] == 1}
        for partage in dossier["partage"]:
            permissions = PERMISSIONS[partage["droits"]]
            actuel = par_groupe.get(partage["groupe"])
            if actuel is None:
                code, _ = ocs("POST", "/apps/files_sharing/api/v1/shares", compte, path=chemin,
                              shareType=1, shareWith=partage["groupe"], permissions=permissions)
                if code != 100:
                    raise Echec(f"partage de {chemin} avec {partage['groupe']} : code OCS {code}")
            elif actuel["permissions"] != permissions:
                ocs("PUT", f"/apps/files_sharing/api/v1/shares/{actuel['id']}", compte, permissions=permissions)
        groupes = ", ".join(f"{p['groupe']} ({p['droits']})" for p in dossier["partage"]) or "aucun partage"
        print(f"  {dossier['chemin']} : {groupes}")


# ---------------------------------------------------------------- agendas et contacts

def partager_collection(url, compte, partages):
    for partage in partages:
        droits = "<o:read-write/>" if partage["droits"] == "modification" else ""
        corps = ('<?xml version="1.0" encoding="utf-8"?>'
                 '<o:share xmlns:d="DAV:" xmlns:o="http://owncloud.org/ns"><o:set>'
                 f'<d:href>principal:principals/groups/{urllib.parse.quote(partage["groupe"])}</d:href>'
                 f'{droits}</o:set></o:share>')
        http("POST", url, compte, corps, {"Content-Type": "application/xml; charset=utf-8"})


def charger_agendas():
    for agenda in CABINET["agendas"]:
        compte = COMPTES[agenda["proprietaire"]]
        url = dav(f"calendars/{agenda['proprietaire']}/{agenda['id']}/")
        corps = ('<?xml version="1.0" encoding="UTF-8"?>'
                 '<c:mkcalendar xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav" '
                 'xmlns:a="http://apple.com/ns/ical/"><d:set><d:prop>'
                 f'<d:displayname>{agenda["nom"]}</d:displayname>'
                 f'<a:calendar-color>{agenda["couleur"]}</a:calendar-color>'
                 '<c:supported-calendar-component-set><c:comp name="VEVENT"/></c:supported-calendar-component-set>'
                 '</d:prop></d:set></c:mkcalendar>')
        http("MKCALENDAR", url, compte, corps, {"Content-Type": "application/xml; charset=utf-8"}, acceptes=(201, 405))
        fichiers = sorted((DONNEES / "agendas" / agenda["id"]).glob("*.ics"))
        for fichier in fichiers:
            http("PUT", url + fichier.name, compte, fichier.read_bytes(), {"Content-Type": "text/calendar; charset=utf-8"})
        partager_collection(url, compte, agenda["partage"])
        print(f"  {agenda['nom']} : {len(fichiers)} événements")


def charger_contacts():
    for carnet in CABINET["carnets"]:
        compte = COMPTES[carnet["proprietaire"]]
        url = dav(f"addressbooks/users/{carnet['proprietaire']}/{carnet['id']}/")
        corps = ('<?xml version="1.0" encoding="UTF-8"?>'
                 '<d:mkcol xmlns:d="DAV:" xmlns:card="urn:ietf:params:xml:ns:carddav"><d:set><d:prop>'
                 '<d:resourcetype><d:collection/><card:addressbook/></d:resourcetype>'
                 f'<d:displayname>{carnet["nom"]}</d:displayname>'
                 '</d:prop></d:set></d:mkcol>')
        http("MKCOL", url, compte, corps, {"Content-Type": "application/xml; charset=utf-8"}, acceptes=(201, 405))
        fichiers = sorted((DONNEES / "contacts" / carnet["id"]).glob("*.vcf"))
        for fichier in fichiers:
            http("PUT", url + fichier.name, compte, fichier.read_bytes(), {"Content-Type": "text/vcard; charset=utf-8"})
        partager_collection(url, compte, carnet["partage"])
        print(f"  {carnet['nom']} : {len(fichiers)} contacts")


# ---------------------------------------------------------------- coffre-fort

def inviter_au_coffre():
    """Invite l'associée dans le coffre-fort. Le compte et les entrées se créent ensuite dans le
    navigateur : le chiffrement du coffre se fait côté client, la box ne connaît jamais le mot de passe."""
    associee = next(u for u in CABINET["utilisateurs"] if u["id"] == CABINET["coffre_fort"]["compte"])
    try:
        print(f"  invitation {inviter_coffre.inviter(associee['courriel'])} pour {associee['courriel']}")
    except (RuntimeError, urllib.error.URLError) as erreur:
        print(f"  Attention : invitation au coffre-fort impossible ({erreur})")


def main():
    print(CABINET["avertissement"])
    attendre_nextcloud()
    print("Groupes et comptes :")
    creer_groupes()
    creer_comptes()
    print("Documents :")
    deposer_documents()
    print("Partages :")
    partager_dossiers()
    print("Agendas :")
    charger_agendas()
    print("Contacts :")
    charger_contacts()
    print("Coffre-fort :")
    inviter_au_coffre()
    print("Terminé.")


if __name__ == "__main__":
    try:
        main()
    except Echec as erreur:
        sys.exit(f"ERREUR : {erreur}")
