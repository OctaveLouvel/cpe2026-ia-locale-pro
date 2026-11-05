"""Réponse à une question : garde-fous, recherche avec les droits de la personne, modèle local, citations,
journal. Produit des événements que le serveur envoie au navigateur au fil de l'eau."""
import re
import time
import urllib.parse
from dataclasses import dataclass
from datetime import datetime, timedelta

from . import actions, config, consignes, journal
from .index import jetons
from .nextcloud import PARIS, Client
from .recherche import (contacts_utiles, dossiers_cites, evenements_utiles, noms_inconnus, noms_propres, rechercher)

COFFRE = re.compile(r"(?i)\b(mots? de passe|password|mdp|coffre[- ]?fort|codes? d.acc[eè]s|identifiants? de connexion"
                    r"|cl[ée] e-?barreau)\b")
AGENDA = re.compile(r"(?i)\b([ée]ch[ée]ances?|audiences?|rendez[- ]?vous|rdv|agenda|prochaine?s?|calendrier|planning"
                    r"|quand|dates?|d[ée]lais?|convocations?|r[ée]unions?|appels?|demain|apr[èe]s-demain|aujourd'hui"
                    r"|cette semaine|semaine prochaine|(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche))\b")
RESUME = re.compile(r"(?i)\b(r[ée]sum\w*|synth[èe]se|o[uù] en est|point sur|fais le point)\b")
CONTACTS = re.compile(r"(?i)\b(t[ée]l[ée]phone|num[ée]ro|joindre|courriel|e-?mail|coordonn[ée]es|contacts?|adresse)\b")

REFUS_COFFRE = ("Je n'ai pas accès au coffre-fort de mots de passe : il est séparé de l'assistant, et je ne peux "
                "ni lire ni communiquer un mot de passe. Pour l'obtenir, ouvrez le coffre-fort du cabinet avec "
                "votre propre compte.")
RIEN = "Je ne trouve pas cette information dans les documents auxquels vous avez accès."
# Question qui porte sur le cabinet (ses dossiers, documents, agendas, contacts) : on cherche dans ses données.
# Sinon (« Bonjour », « Rédige un courriel de relance », « Qu'est-ce qu'une SCI ? ») : réponse générale du modèle.
DOCUMENTAIRE = re.compile(r"(?i)\b(dossiers?|documents?|pi[eè]ces?|fichiers?|clients?|affaires?|audiences?|"
                          r"[ée]ch[ée]ances?|agendas?|rendez[- ]?vous|rdv|r[ée]unions?|planning|calendrier|contacts?|"
                          r"t[ée]l[ée]phone|coordonn[ée]es|charte|cabinet|conclusions?|assignations?|factures?|honoraires|"
                          r"r[ée]sum\w*|synth[èe]se|o[uù] en est|selon|d'apr[èe]s|mes|mon|ma|notre|nos|loyers?|bail|"
                          r"contrat|courriers?|j'ai|ai-je|je dois|dois-je)\b")
# Phrase de refus que le modèle ajoute parfois après une réponse sourcée : retirée de la réponse affichée.
REFUS_PARASITE = re.compile(r"\s*Je ne trouve pas cette information dans les documents auxquels vous avez accès\.?\s*$")


@dataclass
class Session:
    login: str
    nom: str
    client: Client
    admin: bool = False  # peut choisir et installer les modèles d'IA
    secret: str = ""     # mot de passe d'application Nextcloud : connexion unique aux services de la box


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


def repondre(session: Session, question: str, index, moteur, historique=()):
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

    # 2. Demande d'action (rendez-vous, dossier) : l'assistant propose, la personne confirme (POST /api/action).
    action = actions.type_action(question)
    if action:
        yield {"type": "etape", "texte": "Préparation de l'action"}
        if action == "agenda":
            proposition = actions.proposer_rendez_vous(session, question, maintenant)
        else:
            proposition = actions.proposer_dossier(session, question, session.client.fichiers())
        if proposition["type"] == "action":
            journal.ecrire("action_proposee", session.login, {"question": question, "action": action})
        yield proposition
        yield fin([], action=action)
        return

    # 2. Ce que Nextcloud montre à cette personne, et rien d'autre.
    yield {"type": "etape", "texte": "Lecture de vos droits dans Nextcloud"}
    fichiers = session.client.fichiers()
    nouveaux = index.a_indexer(fichiers)
    if nouveaux:
        yield {"type": "etape", "texte": f"Indexation de {len(nouveaux)} document(s) nouveau(x) ou modifié(s)"}
        index.mettre_a_jour(session.client, fichiers)
    visibles = {f.fileid: f for f in fichiers if f.fileid in index.fichiers}
    evenements = session.client.evenements(maintenant - timedelta(days=60), maintenant + timedelta(days=config.JOURS_AGENDA))
    contacts = session.client.contacts()
    mots_visibles = (index.mots_des_fichiers(set(visibles)) | set(jetons(" ".join(f.chemin for f in fichiers)))
                     | set(jetons(" ".join(f"{e.titre} {e.description} {' '.join(e.categories)}" for e in evenements)))
                     | set(jetons(" ".join(f"{c.nom} {c.organisation} {c.note}" for c in contacts))))

    # 3. Un nom inconnu de cette personne : on ne cherche pas plus loin et on ne dit pas s'il existe ailleurs.
    inconnus = noms_inconnus(question, mots_visibles)
    documentaire = bool(DOCUMENTAIRE.search(question) or (set(noms_propres(question)) - set(inconnus)))
    if inconnus and documentaire:
        texte = (f"Je ne trouve aucun élément mentionnant « {', '.join(inconnus)} » parmi les documents, agendas "
                 "et contacts auxquels vous avez accès.")
        journal.ecrire("aucun_resultat", session.login, {"question": question, "noms_inconnus": inconnus}, "refus")
        yield {"type": "texte", "texte": texte}
        yield fin([], refus="aucun_document")
        return

    # 4. Recherche des extraits, limitée au dossier cité s'il y en a un.
    yield {"type": "etape", "texte": "Recherche dans vos documents"}
    dossiers = dossiers_cites(question, list(visibles.values()))
    fileids = {i for i, f in visibles.items() if not dossiers or f.dossier in dossiers}
    resume = bool(RESUME.search(question))
    requete = question + (" faits procédure demandes montants audience" if resume else "")
    # Question courte qui prolonge la précédente (« et pour Lefort ? ») : on cherche avec les deux.
    if historique and len(question.split()) < 6:
        requete = f"{historique[-1][0]} {requete}"
    indices = rechercher(index, moteur, requete, fileids,
                         config.EXTRAITS_RESUME if resume else config.EXTRAITS, 1 if resume else 3, resume) \
        if documentaire else []
    agenda = evenements_utiles(evenements, dossiers, maintenant) if documentaire and (resume or AGENDA.search(question)) else []
    # « Demain j'ai quoi ? », « mes rendez-vous de lundi » : seulement les événements de ce jour, et si l'agenda
    # est vide ce jour-là, une réponse fixe plutôt qu'un appel au modèle.
    jour = actions.lire_date(question, maintenant.date()) if documentaire and AGENDA.search(question) and not resume else None
    if jour is not None:
        debut_jour = datetime(jour.year, jour.month, jour.day, tzinfo=PARIS)
        if not (maintenant - timedelta(days=60) <= debut_jour <= maintenant + timedelta(days=config.JOURS_AGENDA)):
            evenements = session.client.evenements(debut_jour, debut_jour + timedelta(days=1))
        agenda = [e for e in evenements if e.debut.date() == jour][:8]
        # La liste vient directement des agendas, sans le modèle : exacte, immédiate, chaque ligne citée.
        lignes, sources_jour = [], []
        for n, e in enumerate(agenda, 1):
            heure = "journée entière" if e.journee else (f"{consignes.heure(e.debut)}"
                                                         + (f" à {consignes.heure(e.fin)}" if e.fin else ""))
            lieu = f", {e.lieu}" if e.lieu else ""
            lignes.append(f"- {heure} : {e.titre}{lieu} [{n}]")
            sources_jour.append({"numero": n, "type": "agenda", "titre": e.titre, "agenda": e.agenda, "quand": _quand(e),
                                 "citee": True, "lien_nextcloud": f"https://cloud.{config.BOX_DOMAIN}/apps/calendar/"
                                                                  f"timeGridDay/{jour.isoformat()}"})
        texte = (f"{consignes.date_longue(jour).capitalize()} :\n" + "\n".join(lignes)) if agenda else \
            f"Aucun rendez-vous ni aucune audience dans vos agendas le {consignes.date_longue(jour)}."
        journal.ecrire("question", session.login, {"question": question, "mode": "agenda",
                                                   "sources": [s["titre"] for s in sources_jour]})
        yield {"type": "texte", "texte": texte}
        yield fin(sources_jour, citees=[s["numero"] for s in sources_jour])
        return
    carnet = contacts_utiles(contacts, question) if documentaire and CONTACTS.search(question) else []

    extraits, sources = [], []
    for i in indices:
        morceau, fichier = index.morceaux[i], visibles[index.morceaux[i].fileid]
        numero = len(extraits) + 1
        extraits.append({"numero": numero, "etiquette": _etiquette_document(morceau, fichier), "texte": morceau.texte})
        ancre = f"#page={morceau.page}" if morceau.page else ""
        sources.append({"numero": numero, "type": "document", "titre": fichier.nom, "dossier": fichier.dossier,
                        "page": morceau.page, "section": morceau.section, "extrait": morceau.texte[:300],
                        "lien": f"/api/document/{fichier.fileid}{ancre}",
                        "lien_nextcloud": f"https://cloud.{config.BOX_DOMAIN}/f/{fichier.fileid}"})
    for e in agenda:
        numero = len(extraits) + 1
        lieu = f", lieu : {e.lieu}" if e.lieu else ""
        extraits.append({"numero": numero, "etiquette": f"Agenda « {e.agenda} » : {_quand(e)}{lieu}",
                         "texte": f"{e.titre}. {e.description}".strip()})
        sources.append({"numero": numero, "type": "agenda", "titre": e.titre, "agenda": e.agenda, "quand": _quand(e),
                        "lien_nextcloud": f"https://cloud.{config.BOX_DOMAIN}/apps/calendar/dayGridMonth/"
                                          f"{e.debut.date().isoformat()}"})
    for c in carnet:
        numero = len(extraits) + 1
        details = "; ".join(x for x in [c.organisation, c.fonction, ", ".join(c.telephones), ", ".join(c.courriels), c.note] if x)
        extraits.append({"numero": numero, "etiquette": f"Contact « {c.carnet} » : {c.nom}", "texte": details})
        sources.append({"numero": numero, "type": "contact", "titre": c.nom, "carnet": c.carnet,
                        "lien_nextcloud": f"https://cloud.{config.BOX_DOMAIN}/apps/contacts"})

    # 5. Rien du cabinet ne correspond : réponse générale, signalée comme telle, sans aucune source.
    if not extraits:
        yield {"type": "etape", "texte": "Réponse générale du modèle local"}
        note = ("\n\n(Aucun document, agenda ou contact accessible ne correspond à cette question.)"
                if documentaire else "")
        message = (f"Nous sommes le {consignes.date_longue(maintenant.date())}, {consignes.heure(maintenant)}. "
                   f"Personne qui écrit : {session.nom}.\n\n{question}{note}")
        morceaux, mesures = [], {}
        for morceau in moteur.repondre(consignes.GENERAL, message, historique, temperature=0.4):
            if isinstance(morceau, dict):
                mesures = morceau
            else:
                morceaux.append(morceau)
                yield {"type": "texte", "texte": morceau}
        journal.ecrire("question", session.login, {"question": question, "mode": "général", "modele": moteur.modele,
                                                   "duree_s": round(time.monotonic() - debut, 1), **mesures})
        yield fin([], generale=True, mesures=mesures)
        return

    # 6. Le modèle local rédige, à partir des seuls extraits.
    yield {"type": "etape", "texte": f"Rédaction par le modèle local à partir de {len(extraits)} extrait(s)"}
    message = consignes.message(question, extraits, maintenant, f"{session.nom} ({session.login})", resume)
    morceaux, mesures = [], {}
    for morceau in moteur.repondre(consignes.SYSTEME, message, historique):
        if isinstance(morceau, dict):
            mesures = morceau
        else:
            morceaux.append(morceau)
            yield {"type": "texte", "texte": morceau}
    reponse = "".join(morceaux)
    nettoyee = REFUS_PARASITE.sub("", reponse) if re.search(r"\[\d+\]", reponse) else reponse
    citees = sorted({int(n) for n in re.findall(r"\[(\d+)\]", reponse)} & {s["numero"] for s in sources})
    for source in sources:
        source["citee"] = source["numero"] in citees
    journal.ecrire("question", session.login, {
        "question": question, "dossiers": sorted(dossiers), "modele": moteur.modele,
        "sources": [f"{s['titre']}" + (f" p. {s['page']}" if s.get("page") else "") for s in sources if s["citee"]]
                   or [s["titre"] for s in sources],
        "duree_s": round(time.monotonic() - debut, 1), **mesures})
    yield fin(sources, citees=citees, mesures=mesures, **({"texte": nettoyee} if nettoyee != reponse else {}))


def lien_document(fileid: str) -> str:
    return f"/api/document/{urllib.parse.quote(fileid)}"
