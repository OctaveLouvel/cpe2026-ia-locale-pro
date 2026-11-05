"""Clients des moteurs d'inférence locaux, sur le réseau interne de la box.

- Rédaction : Ollama (conteneur ia-moteur) ou un serveur compatible OpenAI (Colibri).
- Recherche par le sens (embeddings) : Ollama, en option. Sans lui, la recherche se fait par mots.

Le modèle actif se choisit à chaud (page « Modèles d'IA » ou ./box.sh ia) et est enregistré dans
<IA_DONNEES>/moteur.json ; les variables d'environnement ne donnent que le choix de départ.
"""
import json
import os
import threading
import time
import urllib.error
import urllib.request

from . import config


class MoteurIndisponible(Exception):
    pass


def appeler(base, chemin, corps=None, delai=900, entetes=None, methode=None):
    donnees = json.dumps(corps).encode() if corps is not None else None
    requete = urllib.request.Request(base + chemin, data=donnees, method=methode or ("POST" if donnees else "GET"),
                                     headers={"Content-Type": "application/json", **(entetes or {})})
    try:
        return urllib.request.urlopen(requete, timeout=delai)
    except urllib.error.HTTPError as erreur:
        raise MoteurIndisponible(f"HTTP {erreur.code} : {erreur.read()[:200]!r}") from None
    except (urllib.error.URLError, TimeoutError, ConnectionError, ValueError) as erreur:
        raise MoteurIndisponible(str(erreur)) from None


class Moteur:
    def __init__(self):
        self._verrou = threading.Lock()
        # Questions en cours : la préparation des fiches en tâche de fond s'efface devant elles (un moteur
        # comme Colibri ne traite qu'une génération à la fois).
        self._questions = 0
        self.derniere_question = 0.0
        self._reflexion = {}
        choix = {}
        if config.ACTIF.exists():
            try:
                choix = json.loads(config.ACTIF.read_text(encoding="utf-8"))
            except ValueError:
                choix = {}
        self.type = choix.get("moteur", config.MOTEUR)  # « ollama » ou « openai » (Colibri)
        self.modele = choix.get("modele", config.MODELE)
        self.modele_embeddings = choix.get("embeddings",
                                           config.MODELE_EMBEDDINGS if config.EMBEDDINGS_URL else None)

    # ------------------------------------------------------------ choix du modèle

    @property
    def url(self):
        return config.OLLAMA_URL if self.type == "ollama" else config.COLIBRI_URL

    @property
    def _entetes(self):
        return {"Authorization": f"Bearer {config.COLIBRI_CLE}"} if self.type == "openai" and config.COLIBRI_CLE else {}

    def choisir(self, moteur=None, modele=None, embeddings="inchangé"):
        with self._verrou:
            if modele is not None:
                self.type, self.modele = moteur, modele
            if embeddings != "inchangé":
                self.modele_embeddings = embeddings
            config.DONNEES.mkdir(parents=True, exist_ok=True)
            temporaire = config.ACTIF.with_suffix(".tmp")
            temporaire.write_text(json.dumps({"moteur": self.type, "modele": self.modele,
                                              "embeddings": self.modele_embeddings}, ensure_ascii=False))
            os.replace(temporaire, config.ACTIF)

    def pret(self):
        if not self.modele or (self.type == "openai" and not config.COLIBRI_URL):
            return False
        try:
            if self.type == "openai":
                with appeler(self.url, "/v1/models", delai=5, entetes=self._entetes) as r:
                    return any(m.get("id") == self.modele for m in json.load(r).get("data", []))
            return self.modele in modeles_ollama()
        except (MoteurIndisponible, ValueError):
            return False

    def prechauffer(self):
        """Première génération et premier embedding : la première question ne paie pas le chargement."""
        for _ in self.repondre("Réponds en un mot.", "Bonjour"):
            pass
        if self.modele_embeddings:
            try:
                self.vecteurs(["préchauffage"], requete=True)
            except MoteurIndisponible:
                pass

    # ------------------------------------------------------------ recherche sémantique (Ollama, en option)

    def vecteurs(self, textes, requete=False, lot=16):
        if not self.modele_embeddings:
            raise MoteurIndisponible("pas de modèle d'embeddings choisi")
        if "embeddinggemma" in self.modele_embeddings:  # ce modèle attend une consigne de tâche
            prefixe = "task: search result | query: " if requete else "title: none | text: "
            textes = [prefixe + t for t in textes]
        resultat = []
        for debut in range(0, len(textes), lot):
            with appeler(config.OLLAMA_URL, "/api/embed", {"model": self.modele_embeddings,
                                                           "input": textes[debut:debut + lot], "keep_alive": "24h"}) as r:
                resultat += json.load(r)["embeddings"]
        return resultat

    # ------------------------------------------------------------ rédaction

    def question_commencee(self):
        with self._verrou:
            self._questions += 1
            self.derniere_question = time.monotonic()

    def question_terminee(self):
        with self._verrou:
            self._questions = max(0, self._questions - 1)
            self.derniere_question = time.monotonic()

    @property
    def question_en_cours(self):
        return self._questions > 0

    def repondre(self, systeme, message, longueur_max=None):
        """Génère la réponse au fil de l'eau. Produit des morceaux de texte, puis un dictionnaire de mesures.
        « coupee » vaut True quand le moteur s'est arrêté sur la limite de longueur, pas en fin de réponse."""
        messages = [{"role": "system", "content": systeme}, {"role": "user", "content": message}]
        longueur_max = longueur_max or config.GENERATION_MAX
        debut, premier, usage = time.monotonic(), None, {}
        flux = self._openai(messages, longueur_max) if self.type == "openai" else self._ollama(messages, longueur_max)
        for morceau, fin in flux:
            if morceau:
                if premier is None:
                    premier = time.monotonic() - debut
                yield morceau
            if fin:
                usage.update(fin)
        total = time.monotonic() - debut
        generation = max(total - (premier or total), 1e-3)
        yield {"premier_mot_s": round(premier or total, 1), "tokens_contexte": usage.get("contexte", 0),
               "tokens_generes": usage.get("generes", 0),
               "generation_tokens_s": round(usage.get("generes", 0) / generation, 1),
               "coupee": usage.get("raison") == "length", "longueur_max": longueur_max}

    def _openai(self, messages, longueur_max):
        corps = {"model": self.modele, "messages": messages, "stream": True, "stream_options": {"include_usage": True},
                 "enable_thinking": False, "temperature": 0.1, "max_tokens": longueur_max}
        with appeler(self.url, "/v1/chat/completions", corps, entetes=self._entetes) as reponse:
            for ligne in reponse:
                ligne = ligne.decode("utf-8").strip()
                if not ligne.startswith("data: ") or ligne == "data: [DONE]":
                    continue
                donnee = json.loads(ligne[6:])
                if "error" in donnee:
                    raise MoteurIndisponible(str(donnee["error"]))
                for choix in donnee.get("choices") or []:
                    yield ((choix.get("delta") or {}).get("content") or "",
                           {"raison": choix["finish_reason"]} if choix.get("finish_reason") else None)
                if donnee.get("usage"):
                    yield "", {"contexte": donnee["usage"].get("prompt_tokens", 0),
                               "generes": donnee["usage"].get("completion_tokens", 0)}

    def _ollama(self, messages, longueur_max):
        corps = {"model": self.modele, "messages": messages, "stream": True, "keep_alive": "24h",
                 "options": {"temperature": 0.1, "seed": 42, "num_ctx": config.CONTEXTE,
                             "num_predict": longueur_max}}
        if self.modele not in self._reflexion:
            with appeler(config.OLLAMA_URL, "/api/show", {"model": self.modele}) as r:
                self._reflexion[self.modele] = "thinking" in json.load(r).get("capabilities", [])
        if self._reflexion[self.modele]:
            corps["think"] = False
        with appeler(config.OLLAMA_URL, "/api/chat", corps) as reponse:
            for ligne in reponse:
                if not ligne.strip():
                    continue
                donnee = json.loads(ligne)
                if "error" in donnee:
                    raise MoteurIndisponible(donnee["error"])
                yield donnee.get("message", {}).get("content", ""), (
                    {"contexte": donnee.get("prompt_eval_count", 0), "generes": donnee.get("eval_count", 0),
                     "raison": donnee.get("done_reason")}
                    if donnee.get("done") else None)


def modeles_ollama():
    """Modèles présents dans le volume, vus par le moteur."""
    with appeler(config.OLLAMA_URL, "/api/tags", delai=5) as r:
        return {m["name"] for m in json.load(r).get("models", [])}


def colibri_disponible():
    if not config.COLIBRI_URL:
        return False
    try:
        entetes = {"Authorization": f"Bearer {config.COLIBRI_CLE}"} if config.COLIBRI_CLE else {}
        with appeler(config.COLIBRI_URL, "/v1/models", delai=3, entetes=entetes) as r:
            return bool(json.load(r).get("data"))
    except (MoteurIndisponible, ValueError):
        return False
