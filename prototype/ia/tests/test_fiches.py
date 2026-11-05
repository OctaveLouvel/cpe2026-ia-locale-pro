"""Tests des fiches préparées à l'avance, sans moteur ni Nextcloud (faux moteur, faux index).

    docker compose exec -T assistant python -m unittest discover -s /app/tests -v
ou, depuis prototype/ia avec les dépendances installées : python3 -m unittest discover -s tests -v
"""
import os
import sys
import tempfile
import unittest
from pathlib import Path

os.environ.setdefault("IA_DONNEES", tempfile.mkdtemp())
os.environ.setdefault("IA_JOURNAL", str(Path(os.environ["IA_DONNEES"]) / "journal.jsonl"))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from assistant import fiches as module_fiches  # noqa: E402
from assistant.fiches import Fiches, Interrompue  # noqa: E402


class FauxMoteur:
    modele = "faux"

    def __init__(self):
        self.question_en_cours = False
        self.derniere_question = 0.0
        self.appels = 0

    def repondre(self, systeme, message, longueur=None):
        self.appels += 1
        yield "- **Pièce** : fiche de test"
        yield {"coupee": False}


class FauxIndex:
    def __init__(self):
        self.fichiers = {
            "a": {"etag": "e1", "nom": "01 A.pdf", "dossier": "D1", "piece_dossier": True, "extraction": 2},
            "b": {"etag": "e2", "nom": "02 B.pdf", "dossier": "D1", "piece_dossier": True, "extraction": 2},
            "c": {"etag": "e3", "nom": "Charte.pdf", "dossier": "Règles", "piece_dossier": False, "extraction": 2},
        }

    def texte_document(self, fileid, mots_max=None):
        return f"texte de {fileid}"

    def nombre_de_mots(self, fileid):
        return 100


class TestFiches(unittest.TestCase):
    def setUp(self):
        for f in Path(os.environ["IA_DONNEES"]).glob("fiches.json"):
            f.unlink()
        self.moteur, self.index = FauxMoteur(), FauxIndex()
        self.fiches = Fiches(self.index, self.moteur)
        self.fiches.demander({"D1"})

    def test_rien_sans_demande(self):
        autres = Fiches(self.index, self.moteur)
        autres.suivis = set()
        self.assertIsNone(autres._prochaine_tache())

    def tout_preparer(self):
        for _ in range(10):
            tache = self.fiches._prochaine_tache()
            if tache is None:
                return
            genre, cle = tache
            (self.fiches._faire_piece if genre == "piece" else self.fiches._faire_dossier)(cle)
        self.fail("la préparation ne se termine pas (une fiche refaite en boucle ?)")

    def test_chaque_piece_une_seule_fois_puis_le_dossier(self):
        self.tout_preparer()
        self.assertEqual(self.moteur.appels, 3)  # 2 pièces + 1 dossier, la charte n'est pas une pièce
        self.assertIsNotNone(self.fiches.piece("a"))
        self.assertIsNone(self.fiches.piece("c"))
        p = self.fiches.progression()
        self.assertEqual((p["pieces_faites"], p["pieces"], p["dossiers_faits"], p["dossiers"]), (2, 2, 1, 1))

    def test_document_modifie_ou_extraction_changee(self):
        self.tout_preparer()
        self.index.fichiers["a"]["etag"] = "e1bis"
        self.assertIsNone(self.fiches.piece("a"))
        self.assertIsNone(self.fiches.dossier("D1", {"a", "b"}))
        self.tout_preparer()
        self.index.fichiers["b"]["extraction"] = 3
        self.assertIsNone(self.fiches.piece("b"))

    def test_fiche_de_dossier_seulement_si_memes_pieces_visibles(self):
        self.tout_preparer()
        self.assertIsNotNone(self.fiches.dossier("D1", {"a", "b"}))
        self.assertIsNone(self.fiches.dossier("D1", {"a"}))  # une pièce cachée à cette personne
        self.assertIsNone(self.fiches.dossier("D1", {"a", "b", "x"}))

    def test_question_interrompt_la_preparation(self):
        self.moteur.question_en_cours = True
        with self.assertRaises(Interrompue):
            self.fiches._faire_piece("a")
        self.assertIsNone(self.fiches.piece("a"))

    def test_rechargement_depuis_le_disque(self):
        self.tout_preparer()
        autres = Fiches(self.index, self.moteur)
        self.assertIsNotNone(autres.piece("b"))
        self.assertIsNotNone(autres.dossier("D1", {"a", "b"}))


class TestPiecesSupprimees(unittest.TestCase):
    def setUp(self):
        from assistant.index import Index, Morceau
        from assistant.nextcloud import Fichier
        for f in Path(os.environ["IA_DONNEES"]).glob("index.json"):
            f.unlink()
        moteur = FauxMoteur()
        moteur.modele_embeddings = None
        self.index, self.Fichier = Index(moteur), Fichier
        for fid, dossier in [("a", "D1"), ("b", "D1"), ("z", "D2")]:
            self.index.fichiers[fid] = {"etag": "e", "nom": f"{fid}.pdf", "dossier": dossier, "piece_dossier": True,
                                        "extraction": 2}
            self.index.morceaux.append(Morceau(fid, fid, f"texte {fid}", 1, None))
        self.index._preparer_bm25()

    def vus(self, *ids):
        return [self.Fichier(i, f"Dossiers clients/{self.index.fichiers[i]['dossier']}/{i}.pdf", "e",
                             "application/pdf", 1) for i in ids]

    def test_piece_supprimee_retiree(self):
        self.assertEqual(self.index.retirer_pieces_absentes(self.vus("a")), ["b"])
        self.assertNotIn("b", self.index.fichiers)
        self.assertFalse(any(m.fileid == "b" for m in self.index.morceaux))

    def test_dossier_non_vu_garde_ses_pieces(self):
        # La personne ne voit pas D2 : ses pièces ne sont pas « supprimées » pour autant.
        self.assertEqual(self.index.retirer_pieces_absentes(self.vus("a", "b")), [])
        self.assertIn("z", self.index.fichiers)


if __name__ == "__main__":
    unittest.main()
