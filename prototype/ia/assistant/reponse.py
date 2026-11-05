"""Réponse à une question : garde-fous, recherche avec les droits de la personne, modèle local, citations,
journal. Produit des événements que le serveur envoie au navigateur au fil de l'eau."""
import re
import time
import urllib.parse
from dataclasses import dataclass
from datetime import datetime, timedelta

from . import config, consignes, journal
from .index import jetons
from .nextcloud import PARIS, Client
from .recherche import (contacts_utiles, dossiers_cites, evenements_utiles, noms_inconnus, rechercher)

COFFRE = re.compile(r"(?i)\b(mots? de passe|password|mdp|coffre[- ]?fort|codes? d.acc[eè]s|identifiants? de connexion"
                    r"|cl[ée] e-?barreau)\b")
AGENDA = re.compile(r"(?i)\b([ée]ch[ée]ances?|audiences?|rendez-vous|rdv|agenda|prochaine?s?|calendrier|planning"
                    r"|quand|dates?|d[ée]lais?|convocations?)\b")
RESUME = re.compile(r"(?i)\b(r[ée]sum\w*|synth[èe]se|o[uù] en est|point sur|fais le point)\b")
CONTACTS = re.compile(r"(?i)\b(t[ée]l[ée]phone|num[ée]ro|joindre|courriel|e-?mail|coordonn[ée]es|contacts?|adresse)\b")

REFUS_COFFRE = ("Je n'ai pas accès au coffre-fort de mots de passe : il est séparé de l'assistant, et je ne peux "
                "ni lire ni communiquer un mot de passe. Pour l'obtenir, ouvrez le coffre-fort du cabinet avec "
                "votre propre compte.")
RIEN = "Je ne trouve pas cette information dans les documents auxquels vous avez accès."


@dataclass
class Session:
    login: str
    nom: str
    client: Client
    admin: bool = False  # peut choisir et installer les modèles d'IA


def _etiquette_document(morceau, fichier):
    morceaux = [f"Document « {fichier.nom} »"]
    if fichier.dossier:
        morceaux.append(f"dossier « {fichier.dossier} »")
    if morceau.page:
        morceaux.append(f"page {morceau.page}")
    if morceau.section:
        morceaux.append(morceau.section)
    return ", ".join(morceaux)


def _quand(evenement):
    jour = consignes.date_longue(evenement.debut.date())
    if evenement.journee:
        return f"{jour} (journée entière)"
    fin = f" à {consignes.heure(evenement.fin)}" if evenement.fin else ""
    return f"{jour}, de {consignes.heure(evenement.debut)}{fin}"


def dossiers_visibles(fichiers, index) -> dict[str, list]:
    """Dossiers clients que la personne voit, avec leurs pièces indexées (triées par nom)."""
    groupes = {}
    for f in fichiers:
        if f.fileid in index.fichiers and index.est_piece(f.fileid) and f.dossier:
            groupes.setdefault(f.dossier, []).append(f)
    return {nom: sorted(pieces, key=lambda f: f.nom) for nom, pieces in sorted(groupes.items())}


def _source_document(numero, fichier, morceau=None, fiche=None):
    ancre = f"#page={morceau.page}" if morceau and morceau.page else ""
    return {"numero": numero, "type": "document", "titre": fichier.nom, "dossier": fichier.dossier,
            "fileid": fichier.fileid, "page": morceau.page if morceau else None,
            "section": morceau.section if morceau else ("fiche préparée à partir du document" if fiche else None),
            "extrait": (morceau.texte if morceau else fiche or "")[:300],
            "lien": f"/api/document/{fichier.fileid}{ancre}",
            "lien_nextcloud": f"https://cloud.{config.BOX_DOMAIN}/f/{fichier.fileid}"}


def _tokens(texte):
    return len(texte) // 3 + 1  # estimation prudente pour le français (environ 3,5 à 4 caractères par token)


def _tenir_dans_le_contexte(extraits, sources, priorites, question):
    """Retire les extraits les moins prioritaires tant que la consigne, les extraits, la question et la
    réponse attendue dépassent le contexte du modèle. Les numéros sont ensuite remis dans l'ordre."""
    budget = config.CONTEXTE - config.GENERATION_MAX - _tokens(consignes.SYSTEME) - _tokens(question) - 250
    gardes = list(range(len(extraits)))
    while gardes and sum(_tokens(extraits[i]["etiquette"] + extraits[i]["texte"]) + 8 for i in gardes) > budget:
        gardes.remove(min(gardes, key=lambda i: priorites[i]))
    retires = len(extraits) - len(gardes)
    extraits, sources = [extraits[i] for i in gardes], [sources[i] for i in gardes]
    for numero, (e, s) in enumerate(zip(extraits, sources), 1):
        e["numero"] = s["numero"] = numero
    return extraits, sources, retires


def couverture(dossiers, pieces_par_dossier, sources, citees):
    """Pour chaque dossier concerné : ses pièces, et si chacune a été donnée au modèle, puis citée."""
    lues = {s["fileid"] for s in sources if s.get("fileid")}
    cites = {s["fileid"] for s in sources if s.get("fileid") and s["numero"] in citees}
    resultat = []
    for nom in sorted(dossiers):
        pieces = [{"titre": f.nom, "lien": f"/api/document/{f.fileid}",
                   "etat": "citee" if f.fileid in cites else "lue" if f.fileid in lues else "non_lue"}
                  for f in pieces_par_dossier.get(nom, [])]
        resultat.append({"dossier": nom, "pieces": pieces})
    return resultat


def repondre(session: Session, question: str, index, moteur, fiches=None, dossier_choisi: str = ""):
    debut = time.monotonic()
    maintenant = datetime.now(PARIS)
    question = " ".join(question.split())[:1000]

    def fin(sources, **autres):
        return {"type": "fin", "sources": sources, "duree_s": round(time.monotonic() - debut, 1),
                "modele": moteur.modele, **autres}

    # 1. Mot de passe demandé : refus immédiat, le modèle n'est même pas appelé.
    if COFFRE.search(question):
        journal.ecrire("refus_coffre", session.login, {"question": question}, "refus")
        yield {"type": "texte", "texte": REFUS_COFFRE}
        yield fin([], refus="coffre")
        return

    # 2. Ce que Nextcloud montre à cette personne, et rien d'autre.
    yield {"type": "etape", "texte": "Lecture de vos droits dans Nextcloud"}
    fichiers = session.client.fichiers()
    nouveaux = index.a_indexer(fichiers)
    if nouveaux:
        yield {"type": "etape", "texte": f"Indexation de {len(nouveaux)} document(s) nouveau(x) ou modifié(s)"}
    index.synchroniser(session.client, fichiers)
    visibles = {f.fileid: f for f in fichiers if f.fileid in index.fichiers}
    par_dossier = dossiers_visibles(fichiers, index)
    evenements = session.client.evenements(maintenant - timedelta(days=60), maintenant + timedelta(days=config.JOURS_AGENDA))
    contacts = session.client.contacts()
    mots_visibles = (index.mots_des_fichiers(set(visibles)) | set(jetons(" ".join(f.chemin for f in fichiers)))
                     | set(jetons(" ".join(f"{e.titre} {e.description} {' '.join(e.categories)}" for e in evenements)))
                     | set(jetons(" ".join(f"{c.nom} {c.organisation} {c.note}" for c in contacts))))

    # 3. Un nom inconnu de cette personne : on ne cherche pas plus loin et on ne dit pas s'il existe ailleurs.
    inconnus = noms_inconnus(question, mots_visibles)
    if inconnus:
        texte = (f"Je ne trouve aucun élément mentionnant « {', '.join(inconnus)} » parmi les documents, agendas "
                 "et contacts auxquels vous avez accès.")
        journal.ecrire("aucun_resultat", session.login, {"question": question, "noms_inconnus": inconnus}, "refus")
        yield {"type": "texte", "texte": texte}
        yield fin([], refus="aucun_document")
        return

    # 4. Recherche des extraits, limitée au dossier cité s'il y en a un.
    yield {"type": "etape", "texte": "Recherche dans vos documents"}
    # Le dossier choisi dans la liste s'ajoute à ceux que la question nomme. Un nom qui ne fait pas partie
    # des dossiers visibles est ignoré, sans dire s'il existe.
    dossiers = dossiers_cites(question, list(visibles.values()))
    if dossier_choisi in par_dossier:
        dossiers.add(dossier_choisi)
    fileids = {i for i, f in visibles.items() if not dossiers or f.dossier in dossiers}
    if dossiers and fiches is not None:
        fiches.demander(dossiers)
    resume = bool(RESUME.search(question))
    requete = question + (" faits procédure demandes montants audience" if resume else "")
    agenda = evenements_utiles(evenements, dossiers, maintenant) if (resume or AGENDA.search(question)) else []
    carnet = contacts_utiles(contacts, question) if CONTACTS.search(question) else []

    extraits, sources, priorites = [], [], []
    # Résumé d'un dossier : la fiche de chaque pièce, préparée à l'avance à partir du document entier.
    # Les pièces sans fiche (pas encore préparée) sont représentées par leur meilleur extrait.
    pieces_resumees = set()
    if resume and dossiers and fiches is not None:
        scores = index.bm25(jetons(requete), [i for i, m in enumerate(index.morceaux) if m.fileid in fileids])
        pertinence = {}
        for i, score in scores.items():
            pertinence[index.morceaux[i].fileid] = max(pertinence.get(index.morceaux[i].fileid, 0), score)
        for nom in sorted(dossiers):
            for fichier in par_dossier.get(nom, []):
                fiche = fiches.piece(fichier.fileid)
                if fiche:
                    numero = len(extraits) + 1
                    extraits.append({"numero": numero, "texte": fiche,
                                     "etiquette": f"Fiche de la pièce « {fichier.nom} », dossier « {fichier.dossier} »"})
                    sources.append(_source_document(numero, fichier, fiche=fiche))
                    priorites.append(1 + pertinence.get(fichier.fileid, 0))
                    pieces_resumees.add(fichier.fileid)
    reste = fileids - pieces_resumees
    indices = rechercher(index, moteur, requete, reste,
                         config.EXTRAITS_RESUME if resume else config.EXTRAITS, 1 if resume else 3, resume) \
        if reste else []
    for rang, i in enumerate(indices):
        morceau, fichier = index.morceaux[i], visibles[index.morceaux[i].fileid]
        numero = len(extraits) + 1
        extraits.append({"numero": numero, "etiquette": _etiquette_document(morceau, fichier), "texte": morceau.texte})
        sources.append(_source_document(numero, fichier, morceau))
        priorites.append(1 - rang / 100)
    for e in agenda:
        priorites.append(10)
        numero = len(extraits) + 1
        lieu = f", lieu : {e.lieu}" if e.lieu else ""
        extraits.append({"numero": numero, "etiquette": f"Agenda « {e.agenda} » : {_quand(e)}{lieu}",
                         "texte": f"{e.titre}. {e.description}".strip()})
        sources.append({"numero": numero, "type": "agenda", "titre": e.titre, "agenda": e.agenda, "quand": _quand(e),
                        "lien_nextcloud": f"https://cloud.{config.BOX_DOMAIN}/apps/calendar/dayGridMonth/"
                                          f"{e.debut.date().isoformat()}"})
    for c in carnet:
        priorites.append(10)
        numero = len(extraits) + 1
        details = "; ".join(x for x in [c.organisation, c.fonction, ", ".join(c.telephones), ", ".join(c.courriels), c.note] if x)
        extraits.append({"numero": numero, "etiquette": f"Contact « {c.carnet} » : {c.nom}", "texte": details})
        sources.append({"numero": numero, "type": "contact", "titre": c.nom, "carnet": c.carnet,
                        "lien_nextcloud": f"https://cloud.{config.BOX_DOMAIN}/apps/contacts"})

    # 5. Rien de pertinent : pas d'appel au modèle, pas de réponse inventée.
    if not extraits:
        journal.ecrire("aucun_resultat", session.login, {"question": question}, "refus")
        yield {"type": "texte", "texte": RIEN}
        yield fin([], refus="aucun_extrait")
        return

    # 6. Le modèle local rédige, à partir des seuls extraits, dans la limite de son contexte.
    extraits, sources, retires = _tenir_dans_le_contexte(extraits, sources, priorites, question)
    texte_etape = f"Rédaction par le modèle local à partir de {len(extraits)} extrait(s)"
    if pieces_resumees:
        texte_etape = (f"Rédaction par le modèle local à partir des fiches de {len(pieces_resumees)} pièce(s)"
                       + (f" et de {len(extraits) - len(pieces_resumees)} autre(s) extrait(s)"
                          if len(extraits) > len(pieces_resumees) else ""))
    yield {"type": "etape", "texte": texte_etape}
    message = consignes.message(question, extraits, maintenant, f"{session.nom} ({session.login})", resume)
    morceaux, mesures = [], {}
    moteur.question_commencee()
    try:
        for morceau in moteur.repondre(consignes.SYSTEME, message):
            if isinstance(morceau, dict):
                mesures = morceau
            else:
                morceaux.append(morceau)
                yield {"type": "texte", "texte": morceau}
    finally:
        moteur.question_terminee()
    reponse = "".join(morceaux)
    citees = sorted({int(n) for n in re.findall(r"\[(\d+)\]", reponse)} & {s["numero"] for s in sources})
    for source in sources:
        source["citee"] = source["numero"] in citees
    journal.ecrire("question", session.login, {
        "question": question, "dossiers": sorted(dossiers), "modele": moteur.modele,
        "sources": [f"{s['titre']}" + (f" p. {s['page']}" if s.get("page") else "") for s in sources if s["citee"]]
                   or [s["titre"] for s in sources],
        "duree_s": round(time.monotonic() - debut, 1), **mesures})
    yield fin(sources, citees=citees, mesures=mesures, retires=retires,
              couverture=couverture(dossiers, par_dossier, sources, citees),
              perimetre=sorted(dossiers) if dossiers else "tous")


def lien_document(fileid: str) -> str:
    return f"/api/document/{urllib.parse.quote(fileid)}"
