#!/usr/bin/env python3
"""Génère le jeu de données FICTIF du cabinet Corbière Avocats.

    sources/<code>/*.md  ->  fichiers/<chemin du dossier>/<nom>.pdf ou .docx
    agendas.json         ->  agendas/<agenda>/<uid>.ics   (un événement par fichier, comme en CalDAV)
    contacts.json        ->  contacts/<carnet>/<uid>.vcf  (un contact par fichier, comme en CardDAV)
    index.json           ->  liste des documents avec leur dossier, leur date et qui peut les lire

Les fichiers produits sont versionnés : inutile de régénérer pour faire la démo.
Pour régénérer après une modification : pandoc 3 et XeLaTeX avec la police Liberation Serif.

    python3 generer.py

Génération incrémentale : un document n'est refait que si sa source ou le modèle a changé
(XeLaTeX ne produit pas deux fois le même PDF au bit près, cela éviterait des modifications
inutiles dans git). `--tout` force la régénération complète.
"""
import datetime
import hashlib
import json
import os
import pathlib
import shutil
import subprocess
import sys
from zoneinfo import ZoneInfo

ICI = pathlib.Path(__file__).resolve().parent
PARIS = ZoneInfo("Europe/Paris")
CABINET = json.loads((ICI / "cabinet.json").read_text(encoding="utf-8"))
DOMAINE_UID = "corbiere-avocats.example"
PRODID = "-//asoterIA//Donnees de demonstration FICTIVES//FR"
DTSTAMP = "20261101T090000Z"  # fixe : la génération est reproductible

AVERTISSEMENT_DOCX = (
    "**DOCUMENT FICTIF - données de démonstration.** "
    "Le cabinet, les personnes et l'affaire sont inventés.\n\n"
)


# ---------------------------------------------------------------- droits d'accès

def membres(groupe):
    return [u["id"] for u in CABINET["utilisateurs"] if groupe in u["groupes"]]


def lecteurs(partages, proprietaire):
    """Comptes qui peuvent lire une ressource : son propriétaire et les membres des groupes partagés."""
    comptes = [proprietaire]
    for partage in partages:
        for compte in membres(partage["groupe"]):
            if compte not in comptes:
                comptes.append(compte)
    return comptes


def dossiers_par_code():
    return {d["code"]: d for d in CABINET["dossiers"]}


# ---------------------------------------------------------------- documents

def lire_entete(texte, chemin):
    lignes = texte.split("\n")
    if lignes[0].strip() != "---":
        sys.exit(f"{chemin} : bloc d'en-tête YAML manquant")
    meta = {}
    for numero, ligne in enumerate(lignes[1:], start=1):
        if ligne.strip() == "---":
            return meta, "\n".join(lignes[numero + 1:])
        cle, _, valeur = ligne.partition(":")
        meta[cle.strip()] = valeur.strip().strip('"')
    sys.exit(f"{chemin} : bloc d'en-tête YAML non fermé")


def horodatage(date_iso, heure=10):
    jour = datetime.date.fromisoformat(date_iso)
    return int(datetime.datetime(jour.year, jour.month, jour.day, heure, tzinfo=PARIS).timestamp())


def nombre_de_pages(pdf):
    if not shutil.which("pdfinfo"):
        return None
    sortie = subprocess.run(["pdfinfo", str(pdf)], capture_output=True, text=True).stdout
    for ligne in sortie.splitlines():
        if ligne.startswith("Pages:"):
            return int(ligne.split()[1])
    return None


def empreinte(donnees):
    return hashlib.sha256(donnees).hexdigest()


def empreinte_source(texte):
    """Empreinte de tout ce dont dépend un document : sa source, le modèle et le filtre."""
    morceaux = texte.encode("utf-8")
    for fichier in ("modele.latex", "filtre.lua"):
        morceaux += (ICI / "generation" / fichier).read_bytes()
    return empreinte(morceaux)


def generer_documents(tout=False, adopter=False):
    dossiers = dossiers_par_code()
    racine = ICI / "fichiers"
    ancien_index = ICI / "index.json"
    precedents = {} if tout or not ancien_index.exists() else {
        d["chemin"]: d for d in json.loads(ancien_index.read_text(encoding="utf-8"))["documents"]}
    index, produits, refaits = [], set(), 0
    for source in sorted((ICI / "sources").glob("*/*.md")):
        texte = source.read_text(encoding="utf-8")
        meta, corps = lire_entete(texte, source)
        dossier = dossiers[source.parent.name]
        destination = racine / dossier["chemin"] / f'{meta["fichier"]}.{meta["format"]}'
        chemin = str(destination.relative_to(racine))
        produits.add(destination)
        epoch = horodatage(meta["date"])
        attendue = empreinte_source(texte)
        precedent = precedents.get(chemin)
        a_jour = (precedent and destination.exists()
                  and empreinte(destination.read_bytes()) == precedent["sha256"]
                  and (precedent.get("empreinte_source") == attendue
                       or (adopter and "empreinte_source" not in precedent)))
        if not a_jour:
            produire(source, texte, corps, meta, destination, epoch)
            refaits += 1
        os.utime(destination, (epoch, epoch))
        index.append({
            "chemin": chemin,
            "dossier": dossier["code"],
            "titre": meta["titre"],
            "date": meta["date"],
            "horodatage": epoch,
            "format": meta["format"],
            "pages": nombre_de_pages(destination) if meta["format"] == "pdf" else None,
            "sha256": empreinte(destination.read_bytes()),
            "empreinte_source": attendue,
            "lecteurs": lecteurs(dossier["partage"], CABINET["proprietaire_des_fichiers"]),
        })
    # Documents dont la source a disparu ou a changé de dossier.
    for fichier in sorted(racine.rglob("*")):
        if fichier.is_file() and fichier not in produits:
            fichier.unlink()
            print(f"  supprimé : {fichier.relative_to(ICI)}")
    for dossier in sorted((d for d in racine.rglob("*") if d.is_dir()), reverse=True):
        if not any(dossier.iterdir()):
            dossier.rmdir()
    print(f"  {refaits} document(s) régénéré(s), {len(index) - refaits} inchangé(s)")
    return index


def produire(source, texte, corps, meta, destination, epoch):
    for outil in ("pandoc", "xelatex"):
        if not shutil.which(outil):
            sys.exit(f"{outil} est nécessaire pour régénérer les documents")
    destination.parent.mkdir(parents=True, exist_ok=True)
    env = dict(os.environ, SOURCE_DATE_EPOCH=str(epoch), FORCE_SOURCE_DATE="1")
    commande = ["pandoc", "-f", "markdown-smart", "-o", str(destination),
                "--lua-filter", str(ICI / "generation" / "filtre.lua")]
    if meta["format"] == "pdf":
        commande += ["--pdf-engine=xelatex", "--template", str(ICI / "generation" / "modele.latex")]
        entree = texte
    elif meta["format"] == "docx":
        entree = texte.replace(corps, AVERTISSEMENT_DOCX + corps, 1)
    else:
        sys.exit(f"{source} : format inconnu {meta['format']}")
    resultat = subprocess.run(commande, input=entree, text=True, env=env, capture_output=True)
    if resultat.returncode != 0:
        sys.exit(f"{source} : échec de pandoc\n{resultat.stderr}")
    print(f"  {destination.relative_to(ICI)}")


# ---------------------------------------------------------------- iCalendar et vCard

def plier(ligne):
    """Plie une ligne de contenu à 75 octets (RFC 5545 et RFC 6350) sans couper un caractère UTF-8."""
    morceaux, courant, taille = [], "", 0
    for caractere in ligne:
        octets = len(caractere.encode("utf-8"))
        if taille + octets > 75:
            morceaux.append(courant)
            courant, taille = " ", 1
        courant += caractere
        taille += octets
    morceaux.append(courant)
    return "\r\n".join(morceaux)


def echapper(texte):
    return (texte.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,")
                 .replace("\n", "\\n"))


def ecrire(chemin, lignes):
    chemin.parent.mkdir(parents=True, exist_ok=True)
    chemin.write_bytes(("\r\n".join(plier(l) for l in lignes) + "\r\n").encode("utf-8"))


VTIMEZONE_PARIS = [
    "BEGIN:VTIMEZONE", "TZID:Europe/Paris",
    "BEGIN:DAYLIGHT", "TZOFFSETFROM:+0100", "TZOFFSETTO:+0200", "TZNAME:CEST",
    "DTSTART:19700329T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU", "END:DAYLIGHT",
    "BEGIN:STANDARD", "TZOFFSETFROM:+0200", "TZOFFSETTO:+0100", "TZNAME:CET",
    "DTSTART:19701025T030000", "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU", "END:STANDARD",
    "END:VTIMEZONE",
]


def generer_agendas():
    donnees = json.loads((ICI / "agendas.json").read_text(encoding="utf-8"))
    racine = ICI / "agendas"
    if racine.exists():
        shutil.rmtree(racine)
    total = 0
    for evenement in donnees["evenements"]:
        uid = f'{evenement["id"]}@{DOMAINE_UID}'
        lignes = ["BEGIN:VCALENDAR", "VERSION:2.0", f"PRODID:{PRODID}", "CALSCALE:GREGORIAN"]
        if "jour" in evenement:  # événement sur la journée entière
            jour = datetime.date.fromisoformat(evenement["jour"])
            debut = [f"DTSTART;VALUE=DATE:{jour:%Y%m%d}",
                     f"DTEND;VALUE=DATE:{jour + datetime.timedelta(days=1):%Y%m%d}"]
        else:
            lignes += VTIMEZONE_PARIS
            d = datetime.datetime.fromisoformat(evenement["debut"])
            f = datetime.datetime.fromisoformat(evenement["fin"])
            debut = [f"DTSTART;TZID=Europe/Paris:{d:%Y%m%dT%H%M%S}",
                     f"DTEND;TZID=Europe/Paris:{f:%Y%m%dT%H%M%S}"]
        lignes += ["BEGIN:VEVENT", f"UID:{uid}", f"DTSTAMP:{DTSTAMP}", *debut,
                   f'SUMMARY:{echapper(evenement["titre"])}']
        if evenement.get("lieu"):
            lignes.append(f'LOCATION:{echapper(evenement["lieu"])}')
        description = evenement.get("description", "")
        description += ("\n\n" if description else "") + "Événement FICTIF (données de démonstration)."
        lignes.append(f"DESCRIPTION:{echapper(description)}")
        if evenement.get("dossier"):
            lignes.append(f'CATEGORIES:{echapper("Dossier " + evenement["dossier"])}')
        if evenement.get("repetition"):
            lignes.append(f'RRULE:{evenement["repetition"]}')
        lignes += ["END:VEVENT", "END:VCALENDAR"]
        ecrire(racine / evenement["agenda"] / f'{evenement["id"]}.ics', lignes)
        total += 1
    print(f"  {total} événements dans agendas/")


def generer_contacts():
    donnees = json.loads((ICI / "contacts.json").read_text(encoding="utf-8"))
    racine = ICI / "contacts"
    if racine.exists():
        shutil.rmtree(racine)
    for contact in donnees["contacts"]:
        nom = contact.get("nom", "")
        prenom = contact.get("prenom", "")
        civilite = contact.get("civilite", "")
        affiche = " ".join(x for x in (civilite, prenom, nom) if x) or contact["organisation"]
        lignes = ["BEGIN:VCARD", "VERSION:3.0", f"PRODID:{PRODID}",
                  f'UID:{contact["id"]}@{DOMAINE_UID}', f"FN:{echapper(affiche)}",
                  f"N:{echapper(nom)};{echapper(prenom)};;{echapper(civilite)};"]
        if contact.get("organisation"):
            lignes.append(f'ORG:{echapper(contact["organisation"])}')
        if contact.get("fonction"):
            lignes.append(f'TITLE:{echapper(contact["fonction"])}')
        for type_tel, numero in contact.get("telephones", {}).items():
            vcard_type = "CELL" if type_tel == "mobile" else "WORK,VOICE"
            lignes.append(f"TEL;TYPE={vcard_type}:{numero}")
        if contact.get("courriel"):
            lignes.append(f'EMAIL;TYPE=WORK:{contact["courriel"]}')
        if contact.get("adresse"):
            a = contact["adresse"]
            lignes.append(f'ADR;TYPE=WORK:;;{echapper(a["rue"])};{echapper(a["ville"])};;{a["code_postal"]};France')
        note = contact.get("note", "")
        note += (" " if note else "") + "Contact FICTIF (données de démonstration)."
        lignes.append(f"NOTE:{echapper(note)}")
        if contact.get("categories"):
            lignes.append("CATEGORIES:" + ",".join(echapper(c) for c in contact["categories"]))
        lignes.append("END:VCARD")
        ecrire(racine / contact["carnet"] / f'{contact["id"]}.vcf', lignes)
    print(f'  {len(donnees["contacts"])} contacts dans contacts/')


def main():
    print("Documents :")
    index = generer_documents(tout="--tout" in sys.argv, adopter="--adopter" in sys.argv)
    print("Agendas :")
    generer_agendas()
    print("Contacts :")
    generer_contacts()
    (ICI / "index.json").write_text(json.dumps({
        "avertissement": CABINET["avertissement"],
        "date_de_reference": CABINET["date_de_reference"],
        "documents": index,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"index.json : {len(index)} documents")


if __name__ == "__main__":
    main()
