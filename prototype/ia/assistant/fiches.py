"""Fiches préparées à l'avance par le modèle local, en tâche de fond (DEV-2).

- Fiche d'une pièce : 3 à 6 points factuels (nature, date, auteur, objet, montants, délais), rédigés à partir
  du texte complet du document déjà indexé. Un résumé de dossier part des fiches de *toutes* ses pièces, au
  lieu de 5 extraits choisis par la recherche : aucune pièce n'est oubliée sans qu'on le sache.
- Fiche d'un dossier : objet, parties, faits, procédure et montants, rédigée à partir des fiches de ses pièces.
  Elle s'affiche tout de suite quand on choisit le dossier, sans attendre le modèle.

Préparation à la demande : rien n'est préparé à l'avance. Un dossier devient « suivi » la première fois que
quelqu'un le choisit dans la liste ou pose une question qui le concerne ; seules les fiches des dossiers suivis
sont préparées, puis tenues à jour. La réponse en cours utilise les extraits ; les suivantes, les fiches.

Droits : une fiche n'est montrée qu'à une personne qui voit la pièce. Une fiche de dossier n'est montrée que
si la personne voit exactement les pièces dont elle a été tirée (sinon elle pourrait révéler une pièce cachée).
Les fiches sont refaites quand un document change (etag). Elles sont conservées sur le disque de la box.

Le moteur ne traite qu'une génération à la fois : la préparation ne commence une fiche que si aucune
question n'a été posée depuis PAUSE_APRES_QUESTION secondes, et l'abandonne dès qu'une question arrive.
"""
import json
import os
import threading
import time
from datetime import datetime

from . import config, journal
from .moteur import MoteurIndisponible
from .nextcloud import PARIS

PAUSE_APRES_QUESTION = 20
MOTS_MAX_PIECE = 2500  # au-delà (manuels, longues notices), pas de fiche : le texte ne tient pas dans le contexte

SYSTEME_PIECE = """Tu prépares la fiche d'une pièce d'un dossier de cabinet d'avocats, à partir de son seul texte.

Règles impératives :
1. Utilise uniquement le texte fourni. N'ajoute aucune connaissance générale.
2. Recopie exactement les dates, montants, noms, références et numéros d'articles. Ne fais aucun calcul.
3. Désigne toujours chaque personne par son nom et son rôle (par exemple « Me Corbière, avocate de M. Lefort »), jamais seulement par « le client », « la cliente » ou « l'avocat ». Ne prête à une personne que ce que le texte lui attribue.
4. Emploie les mots du texte. N'invente pas de synonymes.
5. Écris exactement ces cinq puces, dans cet ordre, en français :
- **Pièce** : nature et date du document.
- **Auteur et destinataire** : qui l'a rédigé, pour qui.
- **Objet** : en une phrase.
- **Points clés** : faits, montants et demandes importants.
- **Dates et délais** : ceux que la pièce mentionne, ou « aucun ».
6. 140 mots au maximum. Pas de phrase d'introduction ni de conclusion."""

SYSTEME_DOSSIER = """Tu prépares la fiche de synthèse d'un dossier de cabinet d'avocats, à partir des fiches numérotées de ses pièces.

Règles impératives :
1. Utilise uniquement les fiches fournies. N'ajoute aucune connaissance générale.
2. Après chaque phrase qui donne une information, indique entre crochets le numéro de la fiche utilisée, par exemple [2].
3. Recopie exactement les dates, montants, noms et références. Ne fais aucun calcul qui n'est pas dans les fiches.
4. Désigne chaque personne par son nom et son rôle. Ne prête à une personne que ce que les fiches lui attribuent.
5. Présente, en puces courtes et en français, sous ces titres en gras : **Objet et parties**, **Faits essentiels**, **Procédure**, **Montants en jeu**. Ne liste pas les rendez-vous de l'agenda : ils sont affichés à part.
6. 220 mots au maximum."""


class Interrompue(Exception):
    pass


class Fiches:
    def __init__(self, index, moteur):
        self.index, self.moteur = index, moteur
        self.verrou = threading.RLock()
        self.pieces: dict[str, dict] = {}    # fileid -> {etag, texte, modele, date}
        self.dossiers: dict[str, dict] = {}  # nom du dossier -> {pieces: {fileid: etag}, ordre, texte, modele, date}
        self.suivis: set[str] = set()        # dossiers dont les fiches sont préparées et tenues à jour
        self.en_cours = None                 # ce que la tâche de fond prépare, pour /api/etat
        self._charger()

    # ------------------------------------------------------------ persistance

    @property
    def _chemin(self):
        return config.DONNEES / "fiches.json"

    def _charger(self):
        if self._chemin.exists():
            try:
                donnees = json.loads(self._chemin.read_text(encoding="utf-8"))
                self.pieces, self.dossiers = donnees.get("pieces", {}), donnees.get("dossiers", {})
                self.suivis = set(donnees.get("suivis", []))
            except ValueError:
                pass

    def _enregistrer(self):
        config.DONNEES.mkdir(parents=True, exist_ok=True)
        temporaire = self._chemin.with_suffix(".tmp")
        with self.verrou:
            temporaire.write_text(json.dumps({"pieces": self.pieces, "dossiers": self.dossiers,
                                              "suivis": sorted(self.suivis)}, ensure_ascii=False), encoding="utf-8")
        os.replace(temporaire, self._chemin)

    def demander(self, noms):
        """Un dossier a été ouvert ou cité dans une question : ses fiches seront préparées en tâche de fond."""
        nouveaux = set(noms) - self.suivis
        if nouveaux:
            with self.verrou:
                self.suivis |= nouveaux
            self._enregistrer()

    def avancement(self, fileids):
        """Pièces de cette liste qui ont déjà leur fiche."""
        return sum(1 for f in fileids if self.piece(f))

    # ------------------------------------------------------------ lecture (avec les droits de la personne)

    def _etag(self, fileid):
        """Version du texte de la pièce : son etag Nextcloud et la version de l'extraction."""
        entree = self.index.fichiers.get(fileid, {})
        return f"{entree.get('etag')}:{entree.get('extraction', 1)}" if entree else None

    def piece(self, fileid) -> str | None:
        fiche = self.pieces.get(fileid)
        return fiche["texte"] if fiche and fiche["etag"] == self._etag(fileid) else None

    def dossier(self, nom: str, fileids_visibles: set[str]) -> dict | None:
        """Fiche du dossier, seulement si la personne voit exactement les pièces dont elle est tirée."""
        fiche = self.dossiers.get(nom)
        if not fiche or set(fiche["pieces"]) != fileids_visibles:
            return None
        if any(self._etag(f) != etag for f, etag in fiche["pieces"].items()):
            return None
        return fiche

    def progression(self):
        a_faire = self._pieces_attendues()
        faites = sum(1 for f in a_faire if self._piece_traitee(f))
        return {"pieces_faites": faites, "pieces": len(a_faire),
                "dossiers_faits": sum(1 for nom, ids in self._dossiers_attendus().items()
                                      if self.dossier(nom, set(ids))),
                "dossiers": len(self._dossiers_attendus()), "en_cours": self.en_cours}

    # ------------------------------------------------------------ ce qu'il reste à préparer

    def _pieces_attendues(self):
        entrees = list(self.index.fichiers.items())
        return [f for f, e in sorted(entrees, key=lambda x: (x[1].get("dossier", ""), x[1].get("nom", "")))
                if e.get("piece_dossier") and e.get("dossier") in self.suivis]

    def _dossiers_attendus(self):
        groupes = {}
        for f in self._pieces_attendues():
            groupes.setdefault(self.index.fichiers[f].get("dossier", ""), []).append(f)
        return groupes

    def _piece_traitee(self, fileid):
        """Fiche faite, pièce trop longue pour en avoir une, ou échec pour cette version du document."""
        return bool(self.piece(fileid)) or self.index.nombre_de_mots(fileid) > MOTS_MAX_PIECE \
            or self.pieces.get(fileid, {}).get("echec_etag") == self._etag(fileid)

    def _prochaine_tache(self):
        for f in self._pieces_attendues():
            if self.piece(f) is None and self.index.nombre_de_mots(f) <= MOTS_MAX_PIECE \
                    and self.pieces.get(f, {}).get("echec_etag") != self._etag(f):
                return ("piece", f)
        for nom, ids in self._dossiers_attendus().items():
            if all(self._piece_traitee(f) for f in ids) and any(self.piece(f) for f in ids) \
                    and self.dossier(nom, set(ids)) is None and self.dossiers.get(nom, {}).get("echec") != ids:
                return ("dossier", nom)
        return None

    # ------------------------------------------------------------ préparation

    def _generer(self, systeme, message, longueur):
        if self.moteur.question_en_cours:
            raise Interrompue()
        flux = self.moteur.repondre(systeme, message, longueur)
        morceaux = []
        try:
            for morceau in flux:
                if self.moteur.question_en_cours:
                    raise Interrompue()
                if isinstance(morceau, dict):
                    if morceau.get("coupee"):
                        morceaux.append(" […]")
                else:
                    morceaux.append(morceau)
        finally:
            flux.close()  # ferme la connexion : le moteur abandonne la génération
        return "".join(morceaux).strip()

    def _faire_piece(self, fileid):
        entree = self.index.fichiers[fileid]
        texte = self.index.texte_document(fileid, MOTS_MAX_PIECE)
        message = (f"Pièce « {entree['nom']} », dossier « {entree.get('dossier', '')} ».\n\n"
                   f"Texte de la pièce :\n\n{texte}")
        etag = self._etag(fileid)  # même forme que celle que piece() compare
        fiche = self._generer(SYSTEME_PIECE, message, 450)
        with self.verrou:
            if fiche:
                self.pieces[fileid] = {"etag": etag, "texte": fiche, "modele": self.moteur.modele,
                                       "date": datetime.now(PARIS).isoformat(timespec="seconds")}
            else:
                self.pieces[fileid] = {"etag": None, "echec_etag": etag, "texte": ""}
        self._enregistrer()

    def _faire_dossier(self, nom):
        ids = [f for f in self._dossiers_attendus()[nom] if self.piece(f)]
        blocs = [f"[{n}] Pièce « {self.index.fichiers[f]['nom']} »\n{self.piece(f)}" for n, f in enumerate(ids, 1)]
        message = f"Dossier « {nom} ».\n\nFiches des pièces :\n\n" + "\n\n".join(blocs)
        fiche = self._generer(SYSTEME_DOSSIER, message, 500)
        tous = self._dossiers_attendus()[nom]
        with self.verrou:
            if fiche:
                self.dossiers[nom] = {"pieces": {f: self._etag(f) for f in tous}, "ordre": ids, "texte": fiche,
                                      "modele": self.moteur.modele,
                                      "date": datetime.now(PARIS).isoformat(timespec="seconds")}
            else:
                self.dossiers[nom] = {"pieces": {}, "echec": tous}
        self._enregistrer()

    def travailler(self, pret):
        """Boucle de la tâche de fond. pret() dit si le moteur est chargé."""
        prepares = 0
        while True:
            time.sleep(3)
            if not pret() or self.moteur.question_en_cours \
                    or time.monotonic() - self.moteur.derniere_question < PAUSE_APRES_QUESTION:
                continue
            tache = self._prochaine_tache()
            if tache is None:
                if prepares:
                    journal.ecrire("fiches_preparees", None, {"fiches": prepares, **self.progression()})
                    prepares = 0
                continue
            genre, cle = tache
            self.en_cours = (self.index.fichiers[cle]["nom"] if genre == "piece" else f"dossier {cle}")
            try:
                (self._faire_piece if genre == "piece" else self._faire_dossier)(cle)
                prepares += 1
            except Interrompue:
                pass  # reprise quand la question sera finie
            except (MoteurIndisponible, KeyError, OSError) as erreur:
                print(f"fiches : {genre} {cle} : {erreur}", flush=True)
                time.sleep(30)
            finally:
                self.en_cours = None
