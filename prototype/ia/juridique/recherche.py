"""Choix des textes de loi et des décisions de justice donnés au modèle pour une question.

Dans l'ordre :
1. les références explicites de la question (« article 1240 du Code civil », « pourvoi n° 24-17.384 ») ;
2. les articles cités dans les pièces du dossier retenues pour la réponse (conclusions, assignation...) ;
3. une recherche plein texte (BM25) dans les articles en vigueur à la date applicable, reclassée par le sens
   quand un modèle d'embeddings est actif ;
4. les décisions qui appliquent les articles retenus (liens officiels, sommaires, visas), les publiées
   d'abord, puis une recherche plein texte dans les décisions ;
5. en option, la recherche en ligne (Légifrance, Judilibre) par la passerelle, si rien n'est trouvé sur la
   box ou si la question demande ce qui est récent.

La date applicable est aujourd'hui, ou la date que donne la question (« en vigueur au 1er janvier 2015 »,
« applicable en 2014 »). Chaque extrait dit quelle version de l'article il donne.
"""
import re
import sqlite3
import threading
from array import array
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

from . import en_ligne, references
from .base import Base
from .references import normaliser

MOTS_VIDES = set("""a au aux avec ce ces cet cette dans de des du elle en et eux il ils je la le les leur lui ma
mais me meme mes moi mon ne nos notre nous on ou par pas pour qu que qui sa se ses son sur ta te tes toi ton tu
un une vos votre vous y est sont ete etre avoir ont fait faire plus tout tous aussi comme si sans entre quel
quelle quels quelles quoi dit dire prevoit peut peuvent doit doivent selon cas article articles art code loi
jurisprudence arret arrets decision decisions cour droit francais quand comment combien est-ce recent recente
recents recentes dernier derniere derniers dernieres nouveau nouvelle actuel actuelle actuellement ligne""".split())

JURIDIQUE = re.compile(
    r"(?i)\b(articles?|art\.|codes?|lois?|d[ée]crets?|ordonnances?|r[èe]glements?|jurisprudences?|arr[êe]ts?|"
    r"cassation|cour d'appel|conseil d'[ée]tat|conseil constitutionnel|d[ée]cisions? de justice|juges?|tribunal|"
    r"l[ée]gal\w*|l[ée]gislation|texte|dispositions?|r[ée]gime|fondement|prescri\w+|forclusion|nullit[ée]|"
    r"responsabilit[ée]|pr[ée]judices?|indemni\w+|dommages?|obligations?|r[ée]siliation|r[ée]solution|"
    r"que (dit|pr[ée]voit|pr[ée]voient|disent)|a-t-on le droit|peut-on|est-il possible|conditions?|d[ée]lais?|"
    r"contrats?|baux|bail|salari[ée]s?|licenci\w+|pr[ée]avis|validit[ée]|r[ée]tractation|appel|garantie|"
    r"consommateur|employeur|locataire|bailleur|succession|divorce|pension|caution)\b")
RECENT = re.compile(r"(?i)\b(r[ée]cent\w*|derni[èe]re?s?|nouvelle?s?|en ligne|actuel\w*|ce mois|cette ann[ée]e)\b")
JURISPRUDENCE = re.compile(r"(?i)\b(jurisprudences?|arr[êe]ts?|d[ée]cisions?|cassation|cour d'appel|conseil d'[ée]tat|"
                           r"juges?|tribunal|interpr[ée]t\w+|appliqu\w+)\b")

MOIS = {m: i + 1 for i, m in enumerate(["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout",
                                        "septembre", "octobre", "novembre", "decembre"])}
_DATE = re.compile(r"(?:(\d{1,2})(?:er)?\s+(" + "|".join(MOIS) + r")\s+)?((?:19|20)\d{2})\b")
_CONTEXTE_DATE = re.compile(r"(?i)\b(en vigueur|applicable|version|r[ée]daction|[àa] l'[ée]poque|[àa] la date|"
                            r"au moment|avant la r[ée]forme|alors)\b")

# Mots à majuscule qui ne sont pas des noms de personnes (pour la requête envoyée en ligne).
MAJUSCULES_JURIDIQUES = {"code", "civil", "cour", "cassation", "conseil", "etat", "constitutionnel", "republique",
                         "france", "tribunal", "loi", "europeenne", "cedh", "cjue", "urssaf", "carpa", "rpva", "bulletin"}

# Codes les plus utiles à un petit cabinet : léger avantage au classement d'une recherche par mots, pour qu'une
# question générale ne remonte pas d'abord un article d'un code sans rapport (rural, minier...).
CODES_PREFERES = {"code civil", "code de procedure civile", "code de commerce", "code du travail",
                  "code de la consommation", "code penal", "code de procedure penale", "code de la securite sociale",
                  "code des procedures civiles d'execution", "code de l'organisation judiciaire",
                  "code de la construction et de l'habitation", "code des assurances", "code monetaire et financier",
                  "code de la propriete intellectuelle", "code general des impots", "code de justice administrative"}
BONUS_CODE_PREFERE = 1.5

MOTS_ARTICLE = 220
MOTS_DECISION = 180


def mots(texte: str) -> list[str]:
    """Mots utiles à une recherche plein texte (FTS5 ignore les accents, pas les pluriels : préfixes)."""
    sortie = []
    for m in re.findall(r"[a-z0-9]+", normaliser(texte)):
        if len(m) > 2 and m not in MOTS_VIDES and not m.isdigit():
            sortie.append(m[:-1] if len(m) > 5 and m[-1] in "sx" else m)
    return sortie


def est_juridique(question: str) -> bool:
    return bool(JURIDIQUE.search(question) or references.decisions(question))


def date_applicable(question: str, aujourdhui: date) -> tuple[date, bool]:
    """(date, explicite). Une date de la question ne compte que près d'un mot comme « en vigueur » ou « applicable »."""
    texte = normaliser(question)
    if not _CONTEXTE_DATE.search(question):
        return aujourdhui, False
    m = None
    for m in _DATE.finditer(texte):
        pass
    if not m:
        return aujourdhui, False
    annee = int(m.group(3))
    jour = date(annee, MOIS[m.group(2)], int(m.group(1))) if m.group(2) else date(annee, 12, 31)
    if not m.group(2) and annee == aujourdhui.year:
        jour = aujourdhui
    return jour, True


def requete_publique(question: str) -> str:
    """Requête envoyée en ligne : les références juridiques et les mots du droit, sans nom propre, sans
    numéro de dossier, sans adresse ni téléphone. Ce texte est inscrit tel quel au journal d'audit."""
    texte = re.sub(r"\S+@\S+|\+?\d[\d .-]{7,}\d|\b\d{4}-\d{3}\b", " ", question)
    gardes = []
    # Tout mot à majuscule après le premier est écarté, même en début de phrase (« M. Garnier ») : un client,
    # une partie, un confrère. Les mots du droit à majuscule (« Cour de cassation ») sont gardés.
    for i, mot in enumerate(re.findall(r"[\wÀ-ÿ'-]+", texte)):
        mot = mot.split("'")[-1]
        if i > 0 and mot[:1].isupper() and normaliser(mot) not in MAJUSCULES_JURIDIQUES and not re.match(r"^[LRDA]\d", mot):
            continue
        gardes.append(mot)
    refs = " ".join(f"article {a.num} {a.code}" for a in references.articles(question) if a.code)
    reste = " ".join(m for m in gardes if normaliser(m) not in MOTS_VIDES and len(m) > 2 and not m.isdigit())
    return " ".join(f"{refs} {reste}".split())[:en_ligne.LONGUEUR_MAX]


def date_longue(jour: str) -> str:
    try:
        d = date.fromisoformat(jour[:10])
    except ValueError:
        return jour
    nom_mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre",
                "novembre", "décembre"][d.month - 1]
    return f"{'1er' if d.day == 1 else d.day} {nom_mois} {d.year}"


def couper(texte: str, nombre: int) -> str:
    liste = texte.split()
    return texte if len(liste) <= nombre else " ".join(liste[:nombre]) + " […]"


def meilleur_passage(texte: str, cles: list[str], nombre: int) -> str:
    """Passage d'une décision le plus proche de la question, de préférence dans la motivation."""
    paragraphes = [p for p in texte.split("\n") if len(p.split()) > 6]
    if not paragraphes:
        return couper(texte, nombre)
    cles = set(cles)

    def score(i):
        fenetre = " ".join(paragraphes[i:i + 3])
        communs = len(cles & set(mots(fenetre)))
        motivation = 2 if re.search(r"(?i)r[ée]ponse de la cour|motifs|par ces motifs|consid[ée]rant|vu l", fenetre) else 0
        return communs * 3 + motivation

    meilleur = max(range(len(paragraphes)), key=score)
    return couper(" ".join(paragraphes[meilleur:meilleur + 3]), nombre)


@dataclass
class Resultat:
    extraits: list[dict] = field(default_factory=list)  # {"etiquette", "texte", "source"}
    etapes: list[str] = field(default_factory=list)


class CacheVecteurs:
    """Vecteurs des articles et décisions déjà vus, gardés par l'assistant (la base juridique est en lecture seule)."""

    def __init__(self, chemin: Path):
        self.chemin = chemin
        self._local = threading.local()

    def _c(self):
        c = getattr(self._local, "c", None)
        if c is None:
            self.chemin.parent.mkdir(parents=True, exist_ok=True)
            c = sqlite3.connect(self.chemin)
            c.execute("CREATE TABLE IF NOT EXISTS vecteurs(cle TEXT, modele TEXT, vecteur BLOB, PRIMARY KEY(cle, modele))")
            self._local.c = c
        return c

    def lire(self, cles, modele):
        if not cles:
            return {}
        lignes = self._c().execute(f"SELECT cle, vecteur FROM vecteurs WHERE modele = ? AND cle IN ({','.join('?' * len(cles))})",
                                   (modele, *cles))
        return {cle: array("f", blob) for cle, blob in lignes}

    def ecrire(self, valeurs: dict, modele):
        with self._c() as c:
            c.executemany("INSERT OR REPLACE INTO vecteurs(cle, modele, vecteur) VALUES (?, ?, ?)",
                          [(cle, modele, array("f", v).tobytes()) for cle, v in valeurs.items()])


def _cosinus(a, b):
    produit = sum(x * y for x, y in zip(a, b))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(y * y for y in b) ** 0.5
    return produit / (na * nb) if na and nb else 0.0


class Juridique:
    def __init__(self, chemin_base: Path, adresse_en_ligne: str = "", cache: Path | None = None,
                 articles_max: int = 3, decisions_max: int = 2, total_max: int = 4):
        self.base = Base(chemin_base)
        self.adresse_en_ligne = adresse_en_ligne
        self.cache = CacheVecteurs(cache) if cache else None
        self.articles_max, self.decisions_max, self.total_max = articles_max, decisions_max, total_max

    @property
    def disponible(self):
        return self.base.disponible

    def etat(self) -> dict:
        return {**self.base.statistiques(), "en_ligne": bool(self.adresse_en_ligne)}

    def connu(self, nom: str) -> bool:
        """Un mot à majuscule de la question figure-t-il dans les textes juridiques (nom de code, de juridiction) ?"""
        if normaliser(nom) in MAJUSCULES_JURIDIQUES:
            return True
        if not self.disponible:
            return False
        motif = re.sub(r"[^a-z0-9]", "", normaliser(nom))
        if not motif:
            return False
        c = self.base.connexion()
        return bool(c.execute("SELECT 1 FROM articles_fts WHERE articles_fts MATCH ? LIMIT 1", (f'titre:"{motif}"',)).fetchone()
                    or c.execute("SELECT 1 FROM decisions_fts WHERE decisions_fts MATCH ? LIMIT 1", (f'titre:"{motif}"',)).fetchone())

    # ------------------------------------------------------------ mise en forme

    @staticmethod
    def _version(a: dict, quand: date, explicite: bool) -> str:
        debut, fin = date_longue(a["debut"]), date_longue(a["fin"])
        ouverte = a["fin"].startswith("2999")
        if not a.get("applicable", True):
            return (f"attention : aucune version applicable au {date_longue(quand.isoformat())} ; dernière version connue, "
                    f"du {debut}" + ("" if ouverte else f" au {fin}") + f", état {a['etat'].lower()}")
        if explicite:
            return f"version applicable au {date_longue(quand.isoformat())} : en vigueur du {debut}" + \
                   (" à aujourd'hui" if ouverte else f" au {fin}")
        return f"version en vigueur depuis le {debut}" + ("" if ouverte else f", jusqu'au {fin}")

    def _extrait_article(self, a, quand, explicite, origine, en_ligne_=False):
        version = self._version(a, quand, explicite) if not en_ligne_ else \
            f"version en vigueur depuis le {date_longue(a['debut'])}, lue en ligne sur Légifrance"
        titre = f"{a['titre']}, article {a['num']}"
        lien_public = a.get("lien") or (f"https://www.legifrance.gouv.fr/{'codes' if a['titre'].lower().startswith('code') else 'loda'}"
                                        f"/article_lc/{a['id']}")
        return {"etiquette": f"Texte de loi : {titre} ({version})" + (f", dans : {a['chemin']}" if a.get("chemin") else ""),
                "texte": couper(a["texte"], MOTS_ARTICLE),
                "source": {"type": "loi", "titre": titre, "version": version, "plan": a.get("chemin", ""),
                           "origine": origine, "extrait": a["texte"][:300], "identifiant": a["id"],
                           "lien": None if en_ligne_ else f"/api/juridique/article/{a['id']}",
                           "lien_public": lien_public}}

    def _extrait_decision(self, d, cles, origine, en_ligne_=False):
        if en_ligne_:
            titre = ", ".join(x for x in [d["juridiction"], d["formation"], date_longue(d["date"]), d["numeros"]] if x)
            corps = d["sommaire"] or " […] ".join(d["extraits"])
            lien_public = d["lien"]
        else:
            titre = d["titre"] or ", ".join(x for x in [d["juridiction"], d["formation"], date_longue(d["date"])] if x)
            corps = d["sommaire"] or meilleur_passage(d["texte"], cles, MOTS_DECISION)
            dossier = "ceta" if d["id"].startswith("CETATEXT") else "juri"
            lien_public = f"https://www.legifrance.gouv.fr/{dossier}/id/{d['id']}"
        nature = "sommaire officiel" if d["sommaire"] else "extrait de la décision"
        return {"etiquette": f"Décision de justice : {titre}" + (f", solution : {d['solution']}" if d.get("solution") else "")
                             + f" ({nature})",
                "texte": couper(corps, MOTS_DECISION),
                "source": {"type": "jurisprudence", "titre": titre, "solution": d.get("solution", ""),
                           "publie": bool(d.get("publie")), "origine": origine, "extrait": corps[:300],
                           "identifiant": d["id"], "lien": None if en_ligne_ else f"/api/juridique/decision/{d['id']}",
                           "lien_public": lien_public}}

    # ------------------------------------------------------------ reclassement par le sens

    def _reclasser(self, candidats, question, moteur, prefixe):
        """Fusion des rangs BM25 et des similarités d'embeddings ; sans modèle d'embeddings, BM25 seul."""
        if not candidats or moteur is None or not getattr(moteur, "modele_embeddings", None) or self.cache is None:
            return candidats
        modele = moteur.modele_embeddings
        cles = [f"{prefixe}:{c['id']}" for c in candidats]
        try:
            connus = self.cache.lire(cles, modele)
            manquants = [(cle, c) for cle, c in zip(cles, candidats) if cle not in connus]
            if manquants:
                textes = [f"{c.get('titre', '')}. {c.get('chemin', '')}. {couper(c.get('sommaire') or c['texte'], 200)}"
                          for _, c in manquants]
                nouveaux = dict(zip([cle for cle, _ in manquants], moteur.vecteurs(textes)))
                self.cache.ecrire(nouveaux, modele)
                connus.update({k: array("f", v) for k, v in nouveaux.items()})
            vq = moteur.vecteurs([question], requete=True)[0]
        except Exception:  # moteur indisponible : le classement par mots reste valable
            return candidats
        sens = {cle: _cosinus(connus[cle], vq) for cle in cles}
        rang_sens = {cle: r for r, cle in enumerate(sorted(cles, key=lambda k: -sens[k]))}
        score = {cle: 1 / (60 + i) + 1 / (60 + rang_sens[cle]) for i, cle in enumerate(cles)}
        ordre = sorted(range(len(candidats)), key=lambda i: -score[cles[i]])
        return [candidats[i] for i in ordre]

    # ------------------------------------------------------------ point d'entrée

    def extraits(self, question: str, textes_dossier: list[str], aujourdhui: date, utilisateur: str | None = None,
                 moteur=None) -> Resultat:
        resultat = Resultat()
        juridique = est_juridique(question)
        refs_question = references.articles(question, self.base.titres() if self.disponible else frozenset())
        decisions_question = references.decisions(question)
        if not (juridique or refs_question or decisions_question):
            return resultat
        quand, explicite = date_applicable(question, aujourdhui)
        cles = mots(question)
        articles, decisions, vus = [], [], set()

        if self.disponible:
            resultat.etapes.append("Recherche dans les textes de loi et la jurisprudence de la box")
            titres = self.base.titres()
            refs_dossier = references.articles("\n".join(textes_dossier), titres)[:3] if textes_dossier else []
            for ref, origine in [*((r, "cité dans la question") for r in refs_question),
                                 *((r, "cité dans une pièce du dossier") for r in refs_dossier)]:
                a = self.base.article(self.base.cids(ref.code, ref.texte), ref.num, quand)
                if a and a["id"] not in vus and len(articles) < self.articles_max:
                    articles.append((a, origine, ref))
                    vus.add(a["id"])
            for ref in decisions_question:
                for d in self.base.decisions_par_numero(ref.numero, ref.ecli)[:1]:
                    if d["id"] not in vus:
                        decisions.append((d, "citée dans la question"))
                        vus.add(d["id"])
            if juridique and len(articles) < self.articles_max and cles:
                candidats = [a for a in self.base.rechercher_articles(cles, quand, 60) if a["id"] not in vus]
                # score BM25 de FTS5 : plus il est négatif, meilleur il est
                candidats.sort(key=lambda a: a["score"] - (BONUS_CODE_PREFERE if normaliser(a["titre"]) in CODES_PREFERES else 0))
                candidats = candidats[:20]
                for a in self._reclasser(candidats, question, moteur, "article")[:self.articles_max - len(articles)]:
                    articles.append(({**a, "applicable": True}, "recherche dans les codes", None))
                    vus.add(a["id"])
            # Décisions qui appliquent les articles cités explicitement.
            for a, origine, ref in articles:
                if ref is None or ref.code is None or len(decisions) >= self.decisions_max:
                    continue
                for d in self.base.decisions_citant(ref.code, ref.num, 2):
                    if d["id"] not in vus and len(decisions) < self.decisions_max:
                        decisions.append((d, f"applique l'article {a['num']}"))
                        vus.add(d["id"])
            if juridique and len(decisions) < self.decisions_max and cles and (JURISPRUDENCE.search(question) or not articles):
                candidats = [d for d in self.base.rechercher_decisions(cles, 20) if d["id"] not in vus]
                for d in self._reclasser(candidats, question, moteur, "decision")[:self.decisions_max - len(decisions)]:
                    decisions.append((d, "recherche dans la jurisprudence"))
                    vus.add(d["id"])

        # Recherche en ligne : rien sur la box, ou question sur ce qui est récent.
        if self.adresse_en_ligne and juridique and (not (articles or decisions) or RECENT.search(question)):
            requete = requete_publique(question)
            if requete:
                resultat.etapes.append(f"Recherche en ligne (Légifrance, Judilibre) : « {requete} »")
                try:
                    reponse = en_ligne.rechercher(self.adresse_en_ligne, requete, utilisateur, bool(RECENT.search(question)))
                    for a in reponse.get("articles", [])[:2]:
                        if a["id"] not in vus and a.get("texte"):
                            articles.append(({**a, "applicable": True, "en_ligne": True}, "recherche en ligne", None))
                            vus.add(a["id"])
                    for d in reponse.get("decisions", [])[:2]:
                        if d["id"] not in vus:
                            decisions.append(({**d, "en_ligne": True}, "recherche en ligne"))
                            vus.add(d["id"])
                except en_ligne.Indisponible as erreur:
                    resultat.etapes.append(f"Recherche en ligne impossible : {erreur}")

        # Au plus total_max extraits : les articles d'abord (la règle), puis les décisions (son application).
        places_decisions = min(len(decisions), self.decisions_max, max(1, self.total_max - len(articles)))
        choisis_articles = articles[:self.total_max - places_decisions] if decisions else articles[:self.total_max]
        for a, origine, _ in choisis_articles:
            resultat.extraits.append(self._extrait_article(a, quand, explicite, origine, a.get("en_ligne", False)))
        for d, origine in decisions[:self.total_max - len(choisis_articles)]:
            resultat.extraits.append(self._extrait_decision(d, cles, origine, d.get("en_ligne", False)))
        return resultat
