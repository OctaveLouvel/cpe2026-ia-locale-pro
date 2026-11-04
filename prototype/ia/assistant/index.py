"""Index de recherche local : extraits des documents, recherche par mots (BM25) et par sens (embeddings).

L'index ne sert jamais tel quel : à chaque question, on ne garde que les extraits des fichiers que
Nextcloud montre à la personne connectée (voir recherche.py). Il est rempli au fil des connexions, avec
les droits de chaque personne, et conservé sur le disque de la box (chiffré avec lui).
"""
import json
import math
import os
import re
import threading
import unicodedata
from collections import Counter
from dataclasses import asdict, dataclass

import numpy as np

from . import config, extraction
from .moteur import MoteurIndisponible

MOTS_VIDES = set("""a au aux avec ce ces cet cette dans de des du elle en et eux il ils je la le les leur lui ma
mais me meme mes moi mon ne nos notre nous on ou par pas pour qu que qui sa se ses son sur ta te tes toi ton tu
un une vos votre vous y est sont ete etre avoir ont fait faire plus tout tous aussi comme si sans entre""".split())


def jetons(texte: str) -> list[str]:
    """Mots normalisés : minuscules, sans accents, sans mots vides, pluriels simples retirés."""
    texte = unicodedata.normalize("NFKD", texte.lower())
    texte = "".join(c for c in texte if not unicodedata.combining(c))
    return [m[:-1] if len(m) > 4 and m[-1] in "sx" else m
            for m in re.findall(r"[a-z0-9]+", texte) if len(m) > 1 and m not in MOTS_VIDES]


@dataclass
class Morceau:
    fileid: str
    titre: str  # nom du document, sans extension
    texte: str
    page: int | None
    section: str | None

    def pour_recherche(self):
        return f"{self.titre}. {self.section or ''}. {self.texte}"


class Index:
    def __init__(self, moteur):
        self.moteur = moteur
        self.verrou = threading.RLock()
        self.fichiers: dict[str, dict] = {}
        self.morceaux: list[Morceau] = []
        self.vecteurs: np.ndarray | None = None
        self._charger()

    # ------------------------------------------------------------ persistance

    @property
    def _chemin(self):
        return config.DONNEES / "index.json"

    @property
    def _chemin_vecteurs(self):
        return config.DONNEES / "vecteurs.npy"

    def _charger(self):
        if self._chemin.exists():
            donnees = json.loads(self._chemin.read_text(encoding="utf-8"))
            self.fichiers = donnees["fichiers"]
            self.morceaux = [Morceau(**m) for m in donnees["morceaux"]]
            if donnees.get("modele_embeddings") == self.moteur.modele_embeddings and self._chemin_vecteurs.exists():
                self.vecteurs = np.load(self._chemin_vecteurs)
                if len(self.vecteurs) != len(self.morceaux):
                    self.vecteurs = None
        self._preparer_bm25()

    def _enregistrer(self):
        config.DONNEES.mkdir(parents=True, exist_ok=True)
        temporaire = self._chemin.with_suffix(".tmp")
        temporaire.write_text(json.dumps({
            "modele_embeddings": self.moteur.modele_embeddings if self.vecteurs is not None else None,
            "fichiers": self.fichiers, "morceaux": [asdict(m) for m in self.morceaux]},
            ensure_ascii=False), encoding="utf-8")
        os.replace(temporaire, self._chemin)
        if self.vecteurs is not None:
            with open(self._chemin_vecteurs.with_suffix(".tmp"), "wb") as f:
                np.save(f, self.vecteurs)
            os.replace(self._chemin_vecteurs.with_suffix(".tmp"), self._chemin_vecteurs)

    # ------------------------------------------------------------ mise à jour

    def a_indexer(self, fichiers):
        return [f for f in fichiers if f.type_mime in extraction.TYPES_PRIS_EN_CHARGE
                and self.fichiers.get(f.fileid, {}).get("etag") != f.etag]

    def mettre_a_jour(self, client, fichiers) -> int:
        """Indexe les fichiers nouveaux ou modifiés, lus avec les droits du client. Renvoie leur nombre."""
        with self.verrou:
            a_faire = self.a_indexer(fichiers)
            for fichier in a_faire:
                extraits = extraction.decouper(extraction.extraire(client.telecharger(fichier), fichier.type_mime),
                                               config.MOTS_PAR_EXTRAIT)
                titre = fichier.nom.rsplit(".", 1)[0]
                self._remplacer(fichier.fileid, [Morceau(fichier.fileid, titre, e.texte, e.page, e.section)
                                                 for e in extraits])
                self.fichiers[fichier.fileid] = {"etag": fichier.etag, "nom": fichier.nom}
            if a_faire:
                self._preparer_bm25()
                self._enregistrer()
            return len(a_faire)

    def _remplacer(self, fileid, nouveaux):
        garder = [i for i, m in enumerate(self.morceaux) if m.fileid != fileid]
        anciens_vecteurs = self.vecteurs[garder] if self.vecteurs is not None else None
        self.morceaux = [self.morceaux[i] for i in garder] + nouveaux
        if self.moteur.modele_embeddings and (anciens_vecteurs is not None or not garder):
            try:
                ajout = self._vectoriser(nouveaux)
                base = anciens_vecteurs if anciens_vecteurs is not None else np.zeros((0, ajout.shape[1]), np.float32)
                self.vecteurs = np.vstack([base, ajout]) if len(ajout) else base
            except MoteurIndisponible:
                self.vecteurs = None  # la recherche par mots reste disponible

    def _vectoriser(self, morceaux):
        if not morceaux:
            return np.zeros((0, 1), np.float32)
        vecteurs = np.asarray(self.moteur.vecteurs([m.pour_recherche() for m in morceaux]), dtype=np.float32)
        return vecteurs / np.maximum(np.linalg.norm(vecteurs, axis=1, keepdims=True), 1e-9)

    def revectoriser(self):
        """Calcule les embeddings manquants (premier démarrage, ou changement de modèle). Sans modèle
        d'embeddings, la recherche reste par mots : ce n'est pas une erreur."""
        with self.verrou:
            if self.vecteurs is None and self.morceaux and self.moteur.modele_embeddings:
                try:
                    self.vecteurs = self._vectoriser(self.morceaux)
                    self._enregistrer()
                except MoteurIndisponible:
                    self.vecteurs = None

    # ------------------------------------------------------------ recherche

    def _preparer_bm25(self):
        self._tf = [Counter(jetons(m.pour_recherche())) for m in self.morceaux]
        self._longueurs = [sum(tf.values()) for tf in self._tf]
        self._longueur_moyenne = (sum(self._longueurs) / len(self._longueurs)) if self._longueurs else 1
        df = Counter(j for tf in self._tf for j in tf)
        n = len(self._tf)
        self._idf = {j: math.log(1 + (n - d + 0.5) / (d + 0.5)) for j, d in df.items()}
        self.vocabulaire = set(df)

    def bm25(self, mots, indices, k1=1.4, b=0.75):
        mots = set(mots)
        scores = {}
        for i in indices:
            tf, longueur = self._tf[i], self._longueurs[i]
            scores[i] = sum(self._idf[m] * tf[m] * (k1 + 1) / (tf[m] + k1 * (1 - b + b * longueur / self._longueur_moyenne))
                            for m in mots if m in tf)
        return scores

    def similarites(self, vecteur, indices):
        if self.vecteurs is None or not indices:
            return {}
        v = np.asarray(vecteur, dtype=np.float32)
        v /= max(float(np.linalg.norm(v)), 1e-9)
        produits = self.vecteurs[indices] @ v
        return dict(zip(indices, produits.tolist()))

    def mots_des_fichiers(self, fileids):
        return {m for i, morceau in enumerate(self.morceaux) if morceau.fileid in fileids for m in self._tf[i]}
