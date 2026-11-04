"""Choix des extraits donnés au modèle, toujours limités aux fichiers visibles par la personne connectée.

Trois garde-fous avant d'appeler le modèle :
- un nom propre de la question qui n'apparaît dans aucun document accessible : on répond qu'on ne trouve
  rien, sans dire si ce nom existe ailleurs dans le cabinet ;
- un dossier cité dans la question (« dossier Garnier », « 2026-014 ») : la recherche se limite à ce dossier ;
- aucun extrait pertinent : pas d'appel au modèle, donc pas de réponse inventée.
"""
import re
import unicodedata
from collections import Counter
from datetime import datetime, timedelta

from . import config
from .index import Index, jetons

# Mots qui portent une majuscule sans être des noms propres utiles à la recherche.
MAJUSCULES_COURANTES = {"me", "mme", "mlle", "m", "maitre", "monsieur", "madame", "dossier", "dossiers", "article",
                        "code", "sas", "sarl", "sci", "selarl", "ia", "rpva", "carpa"}
SEUIL_SEMANTIQUE = 0.30


def _normaliser(mot):
    mot = unicodedata.normalize("NFKD", mot.lower())
    return "".join(c for c in mot if not unicodedata.combining(c))


def noms_propres(question: str) -> list[str]:
    """Mots à majuscule hors début de phrase : « Résume le dossier Lefort » donne ["Lefort"]."""
    noms = []
    for phrase in re.split(r"[.?!]\s+", question):
        mots = re.findall(r"[\wÀ-ÿ'-]+", phrase)
        for mot in mots[1:]:
            mot = mot.split("'")[-1]
            if mot[:1].isupper() and len(mot) > 2 and _normaliser(mot) not in MAJUSCULES_COURANTES:
                noms.append(mot)
    return noms


def noms_inconnus(question, mots_visibles: set[str]) -> list[str]:
    return [nom for nom in noms_propres(question) if not set(jetons(nom)) & mots_visibles]


def dossiers_cites(question, fichiers) -> set[str]:
    """Dossiers (répertoire parent des fichiers) dont un mot distinctif figure dans la question."""
    noms = {f.dossier for f in fichiers if f.dossier}
    frequence = Counter(j for nom in noms for j in set(jetons(nom)))
    mots_question = set(jetons(question))
    return {nom for nom in noms if {j for j in jetons(nom) if frequence[j] == 1} & mots_question}


# Pour un résumé : les pièces qui exposent déjà le dossier (notes, conclusions, assignations...) et leurs
# sections de faits sont les plus utiles au modèle.
PIECES_DE_SYNTHESE = re.compile(r"(?i)note|conclusion|assignation|requ[eê]te|d[ée]compte|rapport")
SECTIONS_DE_FAITS = re.compile(r"(?i)fait|rappel|expos|objet|analyse|demande|motif")


def rechercher(index: Index, moteur, question: str, fileids: set[str], nombre: int, par_document: int,
               resume: bool = False) -> list[int]:
    """Indices des meilleurs extraits parmi les fichiers autorisés : fusion des rangs BM25 et sémantique."""
    indices = [i for i, m in enumerate(index.morceaux) if m.fileid in fileids]
    if not indices:
        return []
    par_mots = index.bm25(jetons(question), indices)
    par_sens = {}
    if index.vecteurs is not None:
        par_sens = index.similarites(moteur.vecteurs([question], requete=True)[0], indices)
    if max(par_mots.values(), default=0) == 0 and max(par_sens.values(), default=0) < SEUIL_SEMANTIQUE:
        return []
    rang_mots = {i: r for r, i in enumerate(sorted(indices, key=lambda i: -par_mots[i]))}
    rang_sens = {i: r for r, i in enumerate(sorted(indices, key=lambda i: -par_sens.get(i, 0)))}
    score = {i: (1 / (60 + rang_mots[i]) if par_mots[i] > 0 else 0) + (1 / (60 + rang_sens[i]) if par_sens else 0)
             for i in indices}
    if resume:
        for i in indices:
            morceau = index.morceaux[i]
            score[i] += (0.004 if PIECES_DE_SYNTHESE.search(morceau.titre) else 0) + \
                        (0.004 if SECTIONS_DE_FAITS.search(morceau.section or "") else 0)
    choisis, par_fichier = [], Counter()
    for i in sorted(indices, key=lambda i: -score[i]):
        fileid = index.morceaux[i].fileid
        if par_fichier[fileid] < par_document:
            choisis.append(i)
            par_fichier[fileid] += 1
        if len(choisis) == nombre:
            break
    return _completer_articles(index, choisis, indices, nombre + 2)


def _completer_articles(index, choisis, autorises, maximum):
    """Un article coupé en plusieurs extraits est donné en entier au modèle (« Article 12 » : 12.1 à 12.5),
    en commençant par les articles des extraits les mieux classés."""
    resultat, deja = [], set()
    for i in choisis:
        if i in deja:
            continue
        morceau = index.morceaux[i]
        freres = [i]
        if morceau.section and morceau.section.startswith("Article"):
            freres = [j for j in autorises if index.morceaux[j].fileid == morceau.fileid
                      and index.morceaux[j].section == morceau.section]
        for j in freres:
            if j not in deja and (len(resultat) < maximum or j == i):
                resultat.append(j)
                deja.add(j)
    return resultat


def evenements_utiles(evenements, dossiers: set[str], maintenant: datetime, limite=5):
    """Prochains événements, limités aux dossiers cités s'il y en a."""
    fin = maintenant + timedelta(days=config.JOURS_AGENDA)
    a_venir = [e for e in evenements if e.debut <= fin
               and (e.debut >= maintenant or (e.journee and e.debut.date() == maintenant.date()))]
    if dossiers:
        cles = set()
        for nom in dossiers:
            cles |= set(jetons(nom)) - {"2026", "2025", "bail", "commercial", "licenciement", "divorce", "amiable"}
        a_venir = [e for e in a_venir
                   if cles & set(jetons(" ".join([e.titre, e.description, *e.categories])))]
    return a_venir[:limite]


def contacts_utiles(contacts, question, limite=3):
    mots = set(jetons(question))
    notes = [(len(mots & set(jetons(" ".join([c.nom, c.organisation, c.fonction, c.note])))), c) for c in contacts]
    return [c for score, c in sorted(notes, key=lambda x: -x[0]) if score > 0][:limite]
