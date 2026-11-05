"""Réponse à une question : le modèle local décide lui-même quoi faire, avec des outils.

Le code ne choisit rien à sa place : pas de mots-clés, pas de réponse toute faite. Le modèle reçoit la
question, la conversation et la liste des outils (chercher dans les documents, lire l'agenda, chercher un
contact, lister les dossiers, lire un dossier à partir des fiches de ses pièces, proposer un rendez-vous,
proposer un dossier) ; il appelle ceux qu'il veut, lit les résultats, puis répond. Ce qui reste dans le code est ce qu'on ne peut pas confier au modèle :
- les droits : chaque outil ne voit que ce que Nextcloud montre à la personne connectée ;
- l'accord de la personne : un outil « proposer_... » prépare l'action, rien n'est fait avant « Confirmer » ;
- le coffre-fort : aucun outil n'y donne accès.
Chaque résultat d'outil est numéroté : le modèle cite ses sources par ce numéro, la page affiche les sources,
et sous la réponse, pour chaque dossier concerné, les pièces lues ou non par le modèle (couverture, DEV-2).
"""
import json
import re
import time
import urllib.parse
from dataclasses import dataclass
from datetime import date, datetime, timedelta

from . import actions, config, consignes, journal
from .index import jetons
from .nextcloud import PARIS, Client
from .recherche import contacts_utiles, rechercher

TOURS_MAX = 4
# Place laissée aux résultats d'outils dans le contexte du modèle (en caractères, environ 3 par token).
CARACTERES_PAR_TOKEN = 3
EVENEMENTS_MAX = 20

OUTILS = [
    {"type": "function", "function": {
        "name": "chercher_documents",
        "description": "Cherche dans les documents du cabinet que la personne a le droit de voir : dossiers clients, "
                       "contrats, conclusions, assignations, notes, et règles du cabinet (charte, usage de l'IA). "
                       "Renvoie des extraits numérotés, ou « aucun document » si la personne n'a accès à rien de tel.",
        "parameters": {"type": "object", "properties": {
            "requete": {"type": "string", "description": "Mots à chercher, en français"},
            "dossier": {"type": "string", "description": "Nom du dossier client si la question en cite un (facultatif)"}},
            "required": ["requete"]}}},
    {"type": "function", "function": {
        "name": "lister_dossiers",
        "description": "Liste les dossiers clients que la personne voit, avec leur nombre de pièces.",
        "parameters": {"type": "object", "properties": {}}}},
    {"type": "function", "function": {
        "name": "lire_dossier",
        "description": "Lit un dossier client en entier, pièce par pièce (fiche préparée de chaque pièce, ou son début "
                       "si la fiche n'est pas encore prête). À utiliser pour résumer un dossier ou faire le point.",
        "parameters": {"type": "object", "properties": {"dossier": {"type": "string", "description": "Nom du dossier"}},
                       "required": ["dossier"]}}},
    {"type": "function", "function": {
        "name": "lire_agenda",
        "description": "Événements des agendas de la personne (rendez-vous, audiences, échéances) entre deux dates incluses.",
        "parameters": {"type": "object", "properties": {
            "debut": {"type": "string", "description": "Date de début, AAAA-MM-JJ"},
            "fin": {"type": "string", "description": "Date de fin incluse, AAAA-MM-JJ"}},
            "required": ["debut", "fin"]}}},
    {"type": "function", "function": {
        "name": "chercher_contacts",
        "description": "Cherche dans les carnets d'adresses de la personne (clients, confrères, experts).",
        "parameters": {"type": "object", "properties": {"requete": {"type": "string", "description": "Nom ou organisation"}},
                       "required": ["requete"]}}},
    {"type": "function", "function": {
        "name": "proposer_rendez_vous",
        "description": "Prépare l'ajout d'un rendez-vous à l'agenda. La personne voit la proposition et doit la confirmer.",
        "parameters": {"type": "object", "properties": {
            "titre": {"type": "string"},
            "debut": {"type": "string", "description": "AAAA-MM-JJTHH:MM, ou AAAA-MM-JJ pour une journée entière"},
            "fin": {"type": "string", "description": "AAAA-MM-JJTHH:MM (facultatif)"},
            "lieu": {"type": "string", "description": "Facultatif"},
            "agenda": {"type": "string", "description": "Nom de l'agenda (facultatif ; sinon l'agenda personnel)"}},
            "required": ["titre", "debut"]}}},
    {"type": "function", "function": {
        "name": "proposer_dossier",
        "description": "Prépare la création d'un dossier dans les fichiers du cabinet. La personne doit confirmer.",
        "parameters": {"type": "object", "properties": {"nom": {"type": "string", "description": "Nom du dossier"}},
                       "required": ["nom"]}}},
]


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


def dossiers_visibles(fichiers, index) -> dict[str, list]:
    """Dossiers clients que la personne voit, avec leurs pièces indexées (triées par nom)."""
    groupes = {}
    for f in fichiers:
        if f.fileid in index.fichiers and index.est_piece(f.fileid) and f.dossier:
            groupes.setdefault(f.dossier, []).append(f)
    return {nom: sorted(pieces, key=lambda f: f.nom) for nom, pieces in sorted(groupes.items())}


def _source_document(fichier, morceau=None, fiche=None):
    ancre = f"#page={morceau.page}" if morceau and morceau.page else ""
    return {"type": "document", "titre": fichier.nom, "dossier": fichier.dossier, "fileid": fichier.fileid,
            "page": morceau.page if morceau else None,
            "section": morceau.section if morceau else ("fiche préparée à partir du document" if fiche else None),
            "extrait": (morceau.texte if morceau else fiche or "")[:300],
            "lien": f"/api/document/{fichier.fileid}{ancre}",
            "lien_nextcloud": f"https://cloud.{config.BOX_DOMAIN}/f/{fichier.fileid}"}


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


def _quand(evenement):
    jour = consignes.date_longue(evenement.debut.date())
    if evenement.journee:
        return f"{jour} (journée entière)"
    fin = f" à {consignes.heure(evenement.fin)}" if evenement.fin else ""
    return f"{jour}, de {consignes.heure(evenement.debut)}{fin}"


class Outils:
    """Exécute les outils choisis par le modèle, avec les droits de la personne. Numérote les sources."""

    def __init__(self, session, index, moteur, fiches=None, dossier_choisi="", budget=6000):
        self.session, self.index, self.moteur, self.fiches = session, index, moteur, fiches
        self.dossier_choisi = dossier_choisi
        self.sources, self.etapes, self.actions = [], [], []
        self.dossiers = set()  # dossiers concernés, pour la couverture et la préparation des fiches
        self.budget = budget   # caractères encore disponibles pour les résultats d'outils
        self._visibles = None
        self._fichiers, self.par_dossier = [], {}
        self._contacts = None

    def _source(self, source, etiquette, texte):
        if self.budget <= 0:
            return ""
        texte = texte.strip()[:max(200, self.budget)]
        self.budget -= len(texte) + len(etiquette)
        numero = len(self.sources) + 1
        self.sources.append({"numero": numero, **source})
        return f"Source [{numero}] — {etiquette}\n{texte}"

    def visibles(self):
        if self._visibles is None:
            self._fichiers = self.session.client.fichiers()
            if self.index.a_indexer(self._fichiers):
                self.etapes.append("Indexation des documents nouveaux ou modifiés")
            self.index.synchroniser(self.session.client, self._fichiers)
            self._visibles = {f.fileid: f for f in self._fichiers if f.fileid in self.index.fichiers}
            self.par_dossier = dossiers_visibles(self._fichiers, self.index)
            if self.dossier_choisi not in self.par_dossier:
                self.dossier_choisi = ""  # un nom hors des dossiers visibles est ignoré, sans dire s'il existe
        return self._visibles

    def _trouver_dossier(self, nom):
        """Le dossier visible dont le nom ressemble le plus à celui donné par le modèle, ou None."""
        self.visibles()
        cles = set(jetons(nom))
        notes = [(len(cles & set(jetons(d))), d) for d in self.par_dossier]
        meilleur = max(notes, default=(0, None))
        return meilleur[1] if meilleur[0] else None

    def _concerne(self, dossier):
        if dossier and dossier not in self.dossiers:
            self.dossiers.add(dossier)
            if self.fiches is not None:
                self.fiches.demander({dossier})

    def executer(self, nom, arguments):
        fonction = getattr(self, f"_outil_{nom}", None)
        if fonction is None:
            return f"Outil inconnu : {nom}."
        try:
            return fonction(**{k: str(v) for k, v in (arguments or {}).items() if v not in (None, "")})
        except TypeError as erreur:
            return f"Arguments invalides pour {nom} : {erreur}."
        except ValueError as erreur:
            return f"Impossible : {erreur}."

    def _outil_lister_dossiers(self):
        self.etapes.append("Liste de vos dossiers")
        self.visibles()
        if not self.par_dossier:
            return "Aucun dossier client accessible."
        return "\n".join(f"- {nom} ({len(p)} pièce(s))" for nom, p in self.par_dossier.items())

    def _outil_lire_dossier(self, dossier):
        nom = self._trouver_dossier(dossier)
        if nom is None:
            return f"Aucun dossier accessible ne correspond à « {dossier} »."
        self.etapes.append(f"Lecture du dossier « {nom} », pièce par pièce")
        self._concerne(nom)
        blocs = []
        for fichier in self.par_dossier[nom]:
            fiche = self.fiches.piece(fichier.fileid) if self.fiches is not None else None
            texte = fiche or self.index.texte_document(fichier.fileid, 120) or ""
            bloc = self._source(_source_document(fichier, fiche=fiche or texte),
                                f"{'Fiche de la pièce' if fiche else 'Début de la pièce'} « {fichier.nom} », dossier « {nom} »", texte)
            if bloc:
                blocs.append(bloc)
        return "\n\n".join(blocs) or "Le dossier ne contient aucune pièce lisible."

    def _outil_chercher_documents(self, requete, dossier=""):
        self.etapes.append(f"Recherche dans vos documents : « {requete} »")
        visibles = self.visibles()
        fileids = set(visibles)
        nom = self._trouver_dossier(dossier) if dossier else self.dossier_choisi or None
        if nom:
            self._concerne(nom)
            fileids = {i for i, f in visibles.items() if f.dossier == nom} or fileids
        indices = rechercher(self.index, self.moteur, f"{dossier} {requete}", fileids, config.EXTRAITS, 3)
        if not indices:
            return "Aucun document accessible ne correspond."
        blocs = []
        for i in indices:
            morceau = self.index.morceaux[i]
            fichier = visibles[morceau.fileid]
            bloc = self._source(_source_document(fichier, morceau), _etiquette_document(morceau, fichier), morceau.texte)
            if bloc:
                blocs.append(bloc)
        return "\n\n".join(blocs) or "Plus de place dans le contexte : réponds avec les sources déjà lues."

    def _outil_lire_agenda(self, debut, fin=""):
        jour_debut = date.fromisoformat(debut[:10])
        jour_fin = max(date.fromisoformat((fin or debut)[:10]), jour_debut)
        self.etapes.append(f"Lecture de vos agendas du {consignes.date_longue(jour_debut)} au {consignes.date_longue(jour_fin)}")
        evenements = self.session.client.evenements(
            datetime(jour_debut.year, jour_debut.month, jour_debut.day, tzinfo=PARIS),
            datetime(jour_fin.year, jour_fin.month, jour_fin.day, tzinfo=PARIS) + timedelta(days=1))
        if not evenements:
            return "Aucun événement dans les agendas sur cette période."
        blocs = []
        for e in evenements[:EVENEMENTS_MAX]:
            lieu = f", lieu : {e.lieu}" if e.lieu else ""
            blocs.append(self._source(
                {"type": "agenda", "titre": e.titre, "agenda": e.agenda, "quand": _quand(e),
                 "lien_nextcloud": f"https://cloud.{config.BOX_DOMAIN}/apps/calendar/timeGridDay/{e.debut.date().isoformat()}"},
                f"Agenda « {e.agenda} » : {_quand(e)}{lieu}", f"{e.titre}. {e.description}"))
        return "\n\n".join(blocs)

    def _outil_chercher_contacts(self, requete):
        self.etapes.append(f"Recherche dans vos contacts : « {requete} »")
        if self._contacts is None:
            self._contacts = self.session.client.contacts()
        trouves = contacts_utiles(self._contacts, requete, 5)
        if not trouves:
            return "Aucun contact ne correspond."
        return "\n\n".join(self._source(
            {"type": "contact", "titre": c.nom, "carnet": c.carnet, "lien_nextcloud": f"https://cloud.{config.BOX_DOMAIN}/apps/contacts"},
            f"Contact « {c.carnet} » : {c.nom}",
            "; ".join(x for x in [c.organisation, c.fonction, ", ".join(c.telephones), ", ".join(c.courriels), c.note] if x))
            for c in trouves)

    def _outil_proposer_rendez_vous(self, titre, debut, fin="", lieu="", agenda=""):
        self.etapes.append("Préparation du rendez-vous")
        proposition = actions.proposer_rendez_vous(self.session, titre, debut, fin, lieu, agenda)
        self.actions.append(proposition)
        return ("Proposition affichée à la personne, qui doit cliquer sur Confirmer : "
                + json.dumps(proposition["details"], ensure_ascii=False))

    def _outil_proposer_dossier(self, nom):
        self.etapes.append("Préparation du dossier")
        self.visibles()
        proposition = actions.proposer_dossier(self.session, nom, self._fichiers)
        self.actions.append(proposition)
        return ("Proposition affichée à la personne, qui doit cliquer sur Confirmer : "
                + json.dumps(proposition["details"], ensure_ascii=False))


def repondre(session: Session, question: str, index, moteur, fiches=None, dossier_choisi: str = "", historique=()):
    debut = time.monotonic()
    maintenant = datetime.now(PARIS)
    question = " ".join(question.split())[:1000]
    systeme = consignes.agent(maintenant, session.nom)
    budget = (config.CONTEXTE - config.GENERATION_MAX - len(systeme) // CARACTERES_PAR_TOKEN - 400) * CARACTERES_PAR_TOKEN
    outils = Outils(session, index, moteur, fiches, dossier_choisi, budget)
    if dossier_choisi:  # choisi dans la liste de la page : une information pour le modèle, pas une décision
        outils.visibles()
        if outils.dossier_choisi:
            outils._concerne(outils.dossier_choisi)
            systeme += f"\nDossier choisi par la personne dans la liste : « {outils.dossier_choisi} »."

    messages = [{"role": "system", "content": systeme}]
    for q, r in historique:
        messages += [{"role": "user", "content": q}, {"role": "assistant", "content": r}]
    messages.append({"role": "user", "content": question})

    reponse, mesures, utilises = "", {}, []
    yield {"type": "etape", "texte": "Le modèle local lit votre question"}
    moteur.question_commencee()  # les fiches en tâche de fond attendent la fin de la question (DEV-2)
    try:
        yield from _tours(moteur, messages, outils, utilises, etat := {"reponse": "", "mesures": {}})
    finally:
        moteur.question_terminee()
    reponse, mesures = etat["reponse"], etat["mesures"]

    citees = sorted({int(n) for n in re.findall(r"\[(\d+)\]", reponse)} & {s["numero"] for s in outils.sources})
    for source in outils.sources:
        source["citee"] = source["numero"] in citees
    journal.ecrire("question", session.login, {
        "question": question, "outils": utilises, "modele": moteur.modele, "dossiers": sorted(outils.dossiers),
        "sources": [s["titre"] + (f" p. {s['page']}" if s.get("page") else "") for s in outils.sources if s["citee"]],
        "duree_s": round(time.monotonic() - debut, 1), **mesures})
    yield {"type": "fin", "sources": outils.sources, "duree_s": round(time.monotonic() - debut, 1),
           "modele": moteur.modele, "citees": citees, "mesures": mesures, "generale": not utilises,
           "couverture": couverture(outils.dossiers, outils.par_dossier, outils.sources, citees),
           "perimetre": sorted(outils.dossiers) if outils.dossiers else "tous"}


def _tours(moteur, messages, outils, utilises, etat):
    """Tours de conversation : le modèle appelle des outils, lit leurs résultats, puis répond."""
    for tour in range(TOURS_MAX):
        texte_tour, appels = "", []
        # Dernier tour sans outils : le modèle répond avec ce qu'il a trouvé.
        for genre, valeur in moteur.discuter(messages, OUTILS if tour < TOURS_MAX - 1 else []):
            if genre == "texte":
                texte_tour += valeur
                yield {"type": "texte", "texte": valeur}
            elif genre == "appels":
                appels = valeur
            else:
                etat["mesures"] = valeur
        etat["reponse"] += texte_tour
        if not appels:
            return
        messages.append({"role": "assistant", "content": texte_tour,
                         "tool_calls": [{"function": {"name": a["nom"], "arguments": a["arguments"]}} for a in appels]})
        for a in appels:
            avant = len(outils.etapes)
            resultat = outils.executer(a["nom"], a["arguments"])
            utilises.append(a["nom"])
            for etape in outils.etapes[avant:]:
                yield {"type": "etape", "texte": etape}
            messages.append({"role": "tool", "content": resultat, "tool_name": a["nom"]})
        for proposition in outils.actions:
            yield proposition
        outils.actions = []


def lien_document(fileid: str) -> str:
    return f"/api/document/{urllib.parse.quote(fileid)}"
