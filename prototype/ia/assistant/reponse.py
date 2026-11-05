"""Réponse à une question : le modèle local décide lui-même quoi faire, avec des outils.

Le code ne choisit rien à sa place : pas de mots-clés, pas de réponse toute faite. Le modèle reçoit la
question, la conversation et la liste des outils (chercher dans les documents, lire l'agenda, chercher un
contact, proposer un rendez-vous, proposer un dossier) ; il appelle ceux qu'il veut, lit les résultats, puis
répond. Ce qui reste dans le code est ce qu'on ne peut pas confier au modèle :
- les droits : chaque outil ne voit que ce que Nextcloud montre à la personne connectée ;
- l'accord de la personne : un outil « proposer_... » prépare l'action, rien n'est fait avant « Confirmer » ;
- le coffre-fort : aucun outil n'y donne accès.
Chaque résultat d'outil est numéroté : le modèle cite ses sources par ce numéro, la page affiche les sources.
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
EVENEMENTS_MAX = 20

OUTILS = [
    {"type": "function", "function": {
        "name": "chercher_documents",
        "description": "Cherche dans les documents du cabinet que la personne a le droit de voir (dossiers clients, "
                       "contrats, conclusions, notes, charte du cabinet...). Renvoie des extraits numérotés.",
        "parameters": {"type": "object", "properties": {
            "requete": {"type": "string", "description": "Mots à chercher, en français"},
            "dossier": {"type": "string", "description": "Nom du dossier client si la question en cite un (facultatif)"}},
            "required": ["requete"]}}},
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


def _quand(evenement):
    jour = consignes.date_longue(evenement.debut.date())
    if evenement.journee:
        return f"{jour} (journée entière)"
    fin = f" à {consignes.heure(evenement.fin)}" if evenement.fin else ""
    return f"{jour}, de {consignes.heure(evenement.debut)}{fin}"


class Outils:
    """Exécute les outils choisis par le modèle, avec les droits de la personne. Numérote les sources."""

    def __init__(self, session, index, moteur):
        self.session, self.index, self.moteur = session, index, moteur
        self.sources, self.etapes, self.actions = [], [], []
        self._visibles = None
        self._fichiers = []
        self._contacts = None

    def _source(self, source, etiquette, texte):
        numero = len(self.sources) + 1
        self.sources.append({"numero": numero, **source})
        return f"[{numero}] {etiquette}\n{texte.strip()}"

    def visibles(self):
        if self._visibles is None:
            self._fichiers = self.session.client.fichiers()
            if self.index.a_indexer(self._fichiers):
                self.index.mettre_a_jour(self.session.client, self._fichiers)
            self._visibles = {f.fileid: f for f in self._fichiers if f.fileid in self.index.fichiers}
        return self._visibles

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

    def _outil_chercher_documents(self, requete, dossier=""):
        self.etapes.append(f"Recherche dans vos documents : « {requete} »")
        visibles = self.visibles()
        fileids = set(visibles)
        if dossier:
            cles = set(jetons(dossier))
            fileids = {i for i, f in visibles.items() if cles & set(jetons(f.dossier or ""))} or fileids
        indices = rechercher(self.index, self.moteur, f"{dossier} {requete}", fileids, config.EXTRAITS, 3)
        if not indices:
            return "Aucun document accessible ne correspond."
        blocs = []
        for i in indices:
            morceau = self.index.morceaux[i]
            fichier = visibles[morceau.fileid]
            ancre = f"#page={morceau.page}" if morceau.page else ""
            blocs.append(self._source(
                {"type": "document", "titre": fichier.nom, "dossier": fichier.dossier, "page": morceau.page,
                 "section": morceau.section, "extrait": morceau.texte[:300],
                 "lien": f"/api/document/{fichier.fileid}{ancre}",
                 "lien_nextcloud": f"https://cloud.{config.BOX_DOMAIN}/f/{fichier.fileid}"},
                _etiquette_document(morceau, fichier), morceau.texte))
        return "\n\n".join(blocs)

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


def repondre(session: Session, question: str, index, moteur, historique=()):
    debut = time.monotonic()
    maintenant = datetime.now(PARIS)
    question = " ".join(question.split())[:1000]
    outils = Outils(session, index, moteur)

    messages = [{"role": "system", "content": consignes.agent(maintenant, session.nom)}]
    for q, r in historique:
        messages += [{"role": "user", "content": q}, {"role": "assistant", "content": r}]
    messages.append({"role": "user", "content": question})

    reponse, mesures, utilises = "", {}, []
    yield {"type": "etape", "texte": "Le modèle local lit votre question"}
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
                mesures = valeur
        reponse += texte_tour
        if not appels:
            break
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

    citees = sorted({int(n) for n in re.findall(r"\[(\d+)\]", reponse)} & {s["numero"] for s in outils.sources})
    for source in outils.sources:
        source["citee"] = source["numero"] in citees
    journal.ecrire("question", session.login, {
        "question": question, "outils": utilises, "modele": moteur.modele,
        "sources": [s["titre"] + (f" p. {s['page']}" if s.get("page") else "") for s in outils.sources if s["citee"]],
        "duree_s": round(time.monotonic() - debut, 1), **mesures})
    yield {"type": "fin", "sources": outils.sources, "duree_s": round(time.monotonic() - debut, 1),
           "modele": moteur.modele, "citees": citees, "mesures": mesures, "generale": not utilises}


def lien_document(fileid: str) -> str:
    return f"/api/document/{urllib.parse.quote(fileid)}"
