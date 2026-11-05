"""Lecture des archives ouvertes de la DILA (https://echanges.dila.gouv.fr/OPENDATA/), licence ouverte Etalab.

| Fonds | Contenu |
|---|---|
| LEGI | Codes, lois et règlements consolidés : une version d'article par fichier, avec ses dates de vigueur |
| CASS | Arrêts de la Cour de cassation publiés au Bulletin |
| INCA | Arrêts de la Cour de cassation non publiés |
| CAPP | Sélection de décisions des cours d'appel |
| JADE | Décisions du Conseil d'État, des cours administratives d'appel et des tribunaux administratifs |

Chaque fonds a une archive complète (« Freemium_<fonds>_global_<date>.tar.gz ») puis une archive de
modifications par jour ouvré (« <FONDS>_<date>.tar.gz »), qui contient aussi la liste des éléments supprimés
(liste_suppression_*.dat). Les archives sont lues en flux : rien n'est décompressé sur le disque.
"""
import re
import tarfile
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path

from . import references
from .base import Base

BLOCS = {"p", "div", "br", "tr", "li", "table", "h1", "h2", "h3", "h4", "blockquote"}

FORMATIONS = {
    "CHAMBRE_CIVILE_1": "1re chambre civile", "CHAMBRE_CIVILE_2": "2e chambre civile",
    "CHAMBRE_CIVILE_3": "3e chambre civile", "CHAMBRE_COMMERCIALE": "chambre commerciale",
    "CHAMBRE_SOCIALE": "chambre sociale", "CHAMBRE_CRIMINELLE": "chambre criminelle",
    "CHAMBRE_MIXTE": "chambre mixte", "ASSEMBLEE_PLENIERE": "assemblée plénière",
}
# Visas d'une décision (« Vu l'article 1240 du code civil ») : la règle appliquée.
VISA = re.compile(r"(?im)^\s*Vu\s+(?:les?\s+articles?|l'article|l’article)[^\n]{0,400}")


def texte(element) -> str:
    """Texte d'un bloc HTML de la DILA, avec un saut de ligne par paragraphe."""
    if element is None:
        return ""
    morceaux = []

    def parcourir(e):
        if e.tag in BLOCS:
            morceaux.append("\n")
        if e.text:
            morceaux.append(e.text)
        for enfant in e:
            parcourir(enfant)
            if enfant.tail:
                morceaux.append(enfant.tail)
        if e.tag in BLOCS:
            morceaux.append("\n")

    parcourir(element)
    lignes = [" ".join(l.split()) for l in "".join(morceaux).splitlines()]
    return "\n".join(l for l in lignes if l)


def _valeur(racine, chemin):
    e = racine.find(chemin)
    return (e.text or "").strip() if e is not None and e.text else ""


def _dans_periode(e, jour):
    return e.get("debut", "0000") <= jour < e.get("fin", "2999-01-01")


def _chemin(tm, jour) -> list[str]:
    """Plan du code (Livre, Titre, Chapitre, Section) valable à la date de début de la version."""
    if tm is None:
        return []
    titres = tm.findall("TITRE_TM")
    choisi = next((t for t in titres if _dans_periode(t, jour)), titres[-1] if titres else None)
    suite = _chemin(tm.find("TM"), jour)
    return ([" ".join((choisi.text or "").split())] if choisi is not None and choisi.text else []) + suite


def lire_article(contenu: bytes) -> tuple[dict, tuple] | None:
    """(article, (cid, titre, titre court, nature)) d'un fichier LEGIARTI, ou None."""
    racine = ET.fromstring(contenu)
    if racine.tag != "ARTICLE":
        return None
    debut = _valeur(racine, "META/META_SPEC/META_ARTICLE/DATE_DEBUT") or "0001-01-01"
    contexte = racine.find("CONTEXTE/TEXTE")
    if contexte is None:
        return None
    titres = contexte.findall("TITRE_TXT")
    # Intitulé actuel du texte (un code renommé garde ainsi un seul nom dans la base).
    titre = max(titres, key=lambda t: t.get("debut", "")) if titres else None
    titre_long = " ".join((titre.text or "").split()) if titre is not None else ""
    titre_court = titre.get("c_titre_court", "") if titre is not None else ""
    num = _valeur(racine, "META/META_SPEC/META_ARTICLE/NUM")
    article = {
        "id": _valeur(racine, "META/META_COMMUN/ID"), "cid": contexte.get("cid", ""),
        "titre": titre_court or titre_long, "num": num, "num_norm": references.numero(num) if num else "",
        "etat": _valeur(racine, "META/META_SPEC/META_ARTICLE/ETAT"), "debut": debut,
        "fin": _valeur(racine, "META/META_SPEC/META_ARTICLE/DATE_FIN") or "2999-01-01",
        "chemin": " > ".join(_chemin(contexte.find("TM"), debut)),
        "texte": texte(racine.find("BLOC_TEXTUEL/CONTENU")), "nota": texte(racine.find("NOTA/CONTENU")),
    }
    return article, (article["cid"], titre_long, titre_court, contexte.get("nature", ""))


def lire_decision(contenu: bytes, fonds: str) -> dict | None:
    racine = ET.fromstring(contenu)
    if racine.tag not in ("TEXTE_JURI_JUDI", "TEXTE_JURI_ADMIN"):
        return None
    judi = racine.tag == "TEXTE_JURI_JUDI"
    spec = "META/META_SPEC/META_JURI_JUDI" if judi else "META/META_SPEC/META_JURI_ADMIN"
    numeros = [n.text.strip() for n in racine.findall(f"{spec}/NUMEROS_AFFAIRES/NUMERO_AFFAIRE") if n.text]
    if not judi or not numeros:
        numeros.append(_valeur(racine, "META/META_SPEC/META_JURI/NUMERO"))
    formation = _valeur(racine, f"{spec}/FORMATION")
    publie = (racine.find(f"{spec}/PUBLI_BULL") is not None and racine.find(f"{spec}/PUBLI_BULL").get("publie") == "oui") \
        if judi else _valeur(racine, f"{spec}/PUBLI_RECUEIL") in ("A", "B")
    sommaire = "\n".join(t for t in (texte(e) for e in racine.findall("TEXTE/SOMMAIRE/*")) if t.strip())
    liens = "\n".join(" ".join((l.text or "").split()) for l in racine.findall("LIENS/LIEN") if l.text)
    return {
        "id": _valeur(racine, "META/META_COMMUN/ID"), "fonds": fonds,
        "juridiction": _valeur(racine, "META/META_SPEC/META_JURI/JURIDICTION"),
        "formation": FORMATIONS.get(formation, "" if re.fullmatch(r"[A-Z]{2}\d+", formation) else formation),
        "date": _valeur(racine, "META/META_SPEC/META_JURI/DATE_DEC"),
        "numeros": " ".join(dict.fromkeys(n.replace(" ", "") for n in numeros if n)),
        "ecli": _valeur(racine, f"{spec}/ECLI"), "solution": _valeur(racine, "META/META_SPEC/META_JURI/SOLUTION"),
        "publie": int(bool(publie)), "titre": _valeur(racine, "META/META_SPEC/META_JURI/TITRE"),
        "sommaire": sommaire, "texte": texte(racine.find("TEXTE/BLOC_TEXTUEL/CONTENU")), "liens": liens,
    }


def citations(decision: dict, titres: set[str]) -> list[tuple[str, str]]:
    """Articles cités par une décision : liens officiels, sommaire et visas. (code normalisé, numéro)."""
    sources = [decision["liens"], decision["sommaire"], *VISA.findall(decision["texte"])]
    trouves = []
    for ref in references.articles("\n".join(sources), titres):
        cle = (ref.code, ref.num) if ref.code else (f"{ref.texte[0]}:{ref.texte[1]}", ref.num) if ref.texte and ref.texte[1] else None
        if cle and cle not in trouves:
            trouves.append(cle)
    return trouves


def fonds_de(nom_archive: str) -> str:
    m = re.match(r"(?i)(?:freemium_)?(legi|cass|inca|capp|jade)", Path(nom_archive).name)
    if not m:
        raise ValueError(f"Archive inconnue : {nom_archive} (attendu : LEGI, CASS, INCA, CAPP ou JADE)")
    return m.group(1).upper()


def _retenir_legi(chemin: str, non_vigueur: bool, textes_choisis: set[str] | None) -> bool:
    """Articles des codes et des textes en vigueur ; les codes abrogés seulement si demandé."""
    if "/article/" not in chemin or not chemin.endswith(".xml"):
        return False
    if not non_vigueur and "_non_vigueur/" in chemin:
        return False
    if textes_choisis:
        m = re.search(r"/(LEGITEXT\d+|JORFTEXT\d+)/", chemin)
        return bool(m and m.group(1) in textes_choisis)
    return True


def importer(chemin_archive: Path, base: Base, non_vigueur: bool = False, textes_choisis: set[str] | None = None,
             progression=print) -> dict:
    """Importe une archive dans la base. Une archive déjà importée est ignorée. Renvoie le décompte."""
    chemin_archive = Path(chemin_archive)
    nom, fonds = chemin_archive.name, fonds_de(chemin_archive.name)
    c = base.connexion()
    if c.execute("SELECT 1 FROM archives WHERE nom = ?", (nom,)).fetchone():
        return {"archive": nom, "deja_importee": True}
    complete = nom.lower().startswith("freemium")
    if complete:
        base.suspendre_index()
    titres = base.titres() if fonds != "LEGI" else set()
    compte = {"archive": nom, "articles": 0, "decisions": 0, "suppressions": 0, "erreurs": 0}
    textes_vus = {}
    with tarfile.open(chemin_archive, mode="r|gz") as archive:
        for membre in archive:
            if not membre.isfile():
                continue
            if membre.name.endswith(".dat") and "suppression" in membre.name:
                for ligne in archive.extractfile(membre).read().decode("utf-8", "replace").splitlines():
                    identifiant = ligne.strip().rsplit("/", 1)[-1].removesuffix(".xml")
                    if identifiant:
                        base.supprimer(c, identifiant)
                        compte["suppressions"] += 1
                continue
            if not membre.name.endswith(".xml"):
                continue
            if fonds == "LEGI" and not _retenir_legi(membre.name, non_vigueur, textes_choisis):
                continue
            try:
                contenu = archive.extractfile(membre).read()
                if fonds == "LEGI":
                    lu = lire_article(contenu)
                    if lu is None:
                        continue
                    article, texte_parent = lu
                    base.ecrire_article(c, article)
                    textes_vus[texte_parent[0]] = texte_parent
                    compte["articles"] += 1
                else:
                    decision = lire_decision(contenu, fonds)
                    if decision is None:
                        continue
                    base.ecrire_decision(c, decision, citations(decision, titres))
                    compte["decisions"] += 1
            except ET.ParseError:
                compte["erreurs"] += 1
                continue
            total = compte["articles"] + compte["decisions"]
            if total % 5000 == 0:
                c.commit()
                progression(f"{nom} : {total} éléments")
    for cid, titre_long, titre_court, nature in textes_vus.values():
        base.ecrire_texte(c, cid, titre_long, titre_court, nature)
    c.execute("INSERT INTO archives(nom, fonds, importee_le, elements) VALUES (?, ?, ?, ?)",
              (nom, fonds, datetime.now().astimezone().isoformat(timespec="seconds"),
               compte["articles"] + compte["decisions"]))
    c.commit()
    base._titres = None
    if complete:
        progression(f"{nom} : reconstruction de l'index plein texte")
        base.reconstruire_index()
    return compte


def recalculer_citations(base: Base, progression=print) -> int:
    """À lancer si la jurisprudence a été importée avant les codes : les noms de codes sont alors reconnus."""
    c = base.connexion()
    titres = base.titres()
    n = 0
    for ligne in c.execute("SELECT id, liens, sommaire, texte FROM decisions").fetchall():
        base.ecrire_citations(c, ligne["id"], citations(dict(ligne), titres))
        n += 1
        if n % 5000 == 0:
            c.commit()
            progression(f"{n} décisions")
    c.commit()
    return n
