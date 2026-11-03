"""Clients des moteurs d'inférence locaux, sur le réseau interne de la box.

- Rédaction des réponses : un serveur compatible OpenAI (Colibri, par défaut) ou Ollama.
- Recherche par le sens (embeddings) : Ollama, en option. Sans lui, la recherche se fait par mots (BM25).
"""
import json
import time
import urllib.error
import urllib.request

from . import config


class MoteurIndisponible(Exception):
    pass


def _appeler(base, chemin, corps=None, delai=900, entetes=None):
    donnees = json.dumps(corps).encode() if corps is not None else None
    requete = urllib.request.Request(base + chemin, data=donnees, method="POST" if donnees else "GET",
                                     headers={"Content-Type": "application/json", **(entetes or {})})
    try:
        return urllib.request.urlopen(requete, timeout=delai)
    except urllib.error.HTTPError as erreur:
        raise MoteurIndisponible(f"HTTP {erreur.code} : {erreur.read()[:200]!r}") from None
    except (urllib.error.URLError, TimeoutError, ConnectionError) as erreur:
        raise MoteurIndisponible(str(erreur)) from None


class Moteur:
    def __init__(self):
        self.type = config.MOTEUR  # "openai" (Colibri) ou "ollama"
        self.url = config.MOTEUR_URL
        self.modele = config.MODELE
        self.modele_embeddings = config.MODELE_EMBEDDINGS if config.EMBEDDINGS_URL else None
        self._entetes = {"Authorization": f"Bearer {config.MOTEUR_CLE}"} if config.MOTEUR_CLE else {}
        self._reflexion = None

    def pret(self):
        try:
            if self.type == "openai":
                with _appeler(self.url, "/v1/models", delai=5, entetes=self._entetes) as r:
                    return any(m.get("id") == self.modele for m in json.load(r).get("data", []))
            with _appeler(self.url, "/api/tags", delai=5) as r:
                noms = {m["name"] for m in json.load(r).get("models", [])}
            return self.modele in noms or f"{self.modele}:latest" in noms
        except (MoteurIndisponible, ValueError):
            return False

    def prechauffer(self):
        """Première génération et premier embedding : la première question de la démo ne paie pas le chargement."""
        for _ in self.repondre("Réponds en un mot.", "Bonjour"):
            pass
        if self.modele_embeddings:
            try:
                self.vecteurs(["préchauffage"], requete=True)
            except MoteurIndisponible:
                self.modele_embeddings = None  # recherche par mots seulement

    # ------------------------------------------------------------ recherche sémantique (Ollama, en option)

    def vecteurs(self, textes, requete=False, lot=16):
        if not self.modele_embeddings:
            raise MoteurIndisponible("pas de modèle d'embeddings configuré")
        if "embeddinggemma" in self.modele_embeddings:  # ce modèle attend une consigne de tâche
            prefixe = "task: search result | query: " if requete else "title: none | text: "
            textes = [prefixe + t for t in textes]
        resultat = []
        for debut in range(0, len(textes), lot):
            with _appeler(config.EMBEDDINGS_URL, "/api/embed", {"model": self.modele_embeddings,
                                                                "input": textes[debut:debut + lot],
                                                                "keep_alive": "24h"}) as r:
                resultat += json.load(r)["embeddings"]
        return resultat

    # ------------------------------------------------------------ rédaction

    def repondre(self, systeme, message):
        """Génère la réponse au fil de l'eau. Produit des morceaux de texte, puis un dictionnaire de mesures."""
        messages = [{"role": "system", "content": systeme}, {"role": "user", "content": message}]
        debut, premier, usage = time.monotonic(), None, {}
        for morceau, fin in (self._openai(messages) if self.type == "openai" else self._ollama(messages)):
            if morceau:
                if premier is None:
                    premier = time.monotonic() - debut
                yield morceau
            if fin:
                usage = fin
        total = time.monotonic() - debut
        generation = max(total - (premier or total), 1e-3)
        yield {"premier_mot_s": round(premier or total, 1), "tokens_contexte": usage.get("contexte", 0),
               "tokens_generes": usage.get("generes", 0),
               "generation_tokens_s": round(usage.get("generes", 0) / generation, 1)}

    def _openai(self, messages):
        corps = {"model": self.modele, "messages": messages, "stream": True, "stream_options": {"include_usage": True},
                 "enable_thinking": False, "temperature": 0.1, "max_tokens": config.GENERATION_MAX}
        with _appeler(self.url, "/v1/chat/completions", corps, entetes=self._entetes) as reponse:
            for ligne in reponse:
                ligne = ligne.decode("utf-8").strip()
                if not ligne.startswith("data: ") or ligne == "data: [DONE]":
                    continue
                donnee = json.loads(ligne[6:])
                if "error" in donnee:
                    raise MoteurIndisponible(str(donnee["error"]))
                for choix in donnee.get("choices") or []:
                    yield (choix.get("delta") or {}).get("content") or "", None
                if donnee.get("usage"):
                    yield "", {"contexte": donnee["usage"].get("prompt_tokens", 0),
                               "generes": donnee["usage"].get("completion_tokens", 0)}

    def _ollama(self, messages):
        corps = {"model": self.modele, "messages": messages, "stream": True, "keep_alive": "24h",
                 "options": {"temperature": 0.1, "seed": 42, "num_ctx": config.CONTEXTE,
                             "num_predict": config.GENERATION_MAX}}
        if self._reflexion is None:
            with _appeler(self.url, "/api/show", {"model": self.modele}) as r:
                self._reflexion = "thinking" in json.load(r).get("capabilities", [])
        if self._reflexion:
            corps["think"] = False
        with _appeler(self.url, "/api/chat", corps) as reponse:
            for ligne in reponse:
                if not ligne.strip():
                    continue
                donnee = json.loads(ligne)
                if "error" in donnee:
                    raise MoteurIndisponible(donnee["error"])
                yield donnee.get("message", {}).get("content", ""), (
                    {"contexte": donnee.get("prompt_eval_count", 0), "generes": donnee.get("eval_count", 0)}
                    if donnee.get("done") else None)
