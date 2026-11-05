"""Tests du pack juridique : python -m unittest juridique.tests (depuis prototype/ia).

L'archive de test reprend la structure des archives de la DILA. Les deux versions de l'article 1240 et de
l'ancien article 1382 du Code civil sont les textes officiels ; la décision est FICTIVE (numéro 99-99.999).
"""
import io
import tarfile
import tempfile
import unittest
from datetime import date
from pathlib import Path

from . import dila, references
from .base import Base
from .recherche import Juridique, date_applicable, est_juridique, requete_publique

TEXTE_1240 = ("Tout fait quelconque de l'homme, qui cause à autrui un dommage, oblige celui par la faute duquel "
              "il est arrivé à le réparer.")


def article(identifiant, num, etat, debut, fin, texte):
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<ARTICLE><META><META_COMMUN><ID>{identifiant}</ID><NATURE>Article</NATURE></META_COMMUN>
<META_SPEC><META_ARTICLE><NUM>{num}</NUM><ETAT>{etat}</ETAT><DATE_DEBUT>{debut}</DATE_DEBUT><DATE_FIN>{fin}</DATE_FIN>
</META_ARTICLE></META_SPEC></META>
<CONTEXTE><TEXTE cid="LEGITEXT000006070721" nature="CODE">
<TITRE_TXT c_titre_court="Code civil" debut="1804-03-21" fin="2999-01-01" id_txt="LEGITEXT000006070721">Code civil</TITRE_TXT>
<TM><TITRE_TM debut="1804-03-21" fin="2999-01-01" id="S1">Livre III : Des différentes manières dont on acquiert la propriété</TITRE_TM>
<TM><TITRE_TM debut="2016-10-01" fin="2999-01-01" id="S2">Titre III : Des sources d'obligations</TITRE_TM></TM></TM>
</TEXTE></CONTEXTE>
<BLOC_TEXTUEL><CONTENU><p>{texte}</p></CONTENU></BLOC_TEXTUEL><NOTA><CONTENU/></NOTA></ARTICLE>""".encode()


DECISION = """<?xml version="1.0" encoding="UTF-8"?>
<TEXTE_JURI_JUDI><META><META_COMMUN><ID>JURITEXT999999999999</ID><NATURE>ARRET</NATURE></META_COMMUN>
<META_SPEC><META_JURI><TITRE>Cour de cassation, 2e chambre civile, 1 janvier 2026, 99-99.999, Publié au bulletin (DÉCISION FICTIVE)</TITRE>
<DATE_DEC>2026-01-01</DATE_DEC><JURIDICTION>Cour de cassation</JURIDICTION><NUMERO>X</NUMERO><SOLUTION>Rejet</SOLUTION></META_JURI>
<META_JURI_JUDI><NUMEROS_AFFAIRES><NUMERO_AFFAIRE>99-99999</NUMERO_AFFAIRE></NUMEROS_AFFAIRES><PUBLI_BULL publie="oui"/>
<FORMATION>CHAMBRE_CIVILE_2</FORMATION><ECLI>ECLI:FR:CCASS:2026:C299999</ECLI></META_JURI_JUDI></META_SPEC></META>
<TEXTE><BLOC_TEXTUEL><CONTENU>Décision fictive pour les tests.<br/>Vu l'article 1240 du code civil ;<br/>
Réponse de la Cour. La faute d'imprudence engage la responsabilité de son auteur envers la victime du dommage.</CONTENU></BLOC_TEXTUEL>
<SOMMAIRE><ANA ID="1">Sommaire fictif : la faute d'imprudence suffit à engager la responsabilité délictuelle.</ANA></SOMMAIRE></TEXTE>
<LIENS><LIEN typelien="CITATION">Article 1240 du code civil.</LIEN></LIENS></TEXTE_JURI_JUDI>""".encode()


def archive(dossier: Path, nom: str, fichiers: dict) -> Path:
    chemin = dossier / nom
    with tarfile.open(chemin, "w:gz") as tar:
        for nom_fichier, contenu in fichiers.items():
            info = tarfile.TarInfo(nom_fichier)
            info.size = len(contenu)
            tar.addfile(info, io.BytesIO(contenu))
    return chemin


class TestReferences(unittest.TestCase):
    def test_articles(self):
        titres = {"code civil", "code du travail"}
        self.assertEqual([(a.num, a.code) for a in references.articles("Que dit l'article 1240 du Code civil ?", titres)],
                         [("1240", "code civil")])
        self.assertEqual([a.num for a in references.articles("art. L. 1234-9 et L. 1234-11 C. trav.")], ["L1234-9", "L1234-11"])
        self.assertEqual([(a.num, a.code) for a in references.articles(
            "l'article 2052 du code civil ... l'article 2234 du même code", titres)], [("2052", "code civil"), ("2234", "code civil")])
        self.assertEqual(references.articles("l'article 12 du contrat de bail", titres), [])

    def test_decisions(self):
        trouves = references.decisions("pourvoi n° S 24-17.384, ECLI:FR:CCASS:2026:MI00299 ; dossier 2026-014")
        self.assertEqual([d.numero for d in trouves if d.numero], ["24-17384"])
        self.assertEqual([d.ecli for d in trouves if d.ecli], ["ECLI:FR:CCASS:2026:MI00299"])


class TestBase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dossier = Path(tempfile.mkdtemp())
        racine = "legi/global/code_et_TNC_en_vigueur/code_en_vigueur/LEGI/TEXT/LEGITEXT000006070721/article/LEGI/ARTI/"
        legi = archive(cls.dossier, "LEGI_20260101-000000.tar.gz", {
            racine + "LEGIARTI000032041571.xml": article("LEGIARTI000032041571", "1240", "VIGUEUR", "2016-10-01", "2999-01-01", TEXTE_1240),
            racine + "LEGIARTI000006438819.xml": article("LEGIARTI000006438819", "1382", "MODIFIE", "1804-02-19", "2016-10-01", TEXTE_1240),
            racine + "LEGIARTI000000000001.xml": article("LEGIARTI000000000001", "9999", "VIGUEUR", "2020-01-01", "2999-01-01", "À supprimer."),
            "liste_suppression_legi.dat": (racine + "LEGIARTI000000000001\n").encode(),
        })
        cass = archive(cls.dossier, "CASS_20260102-000000.tar.gz", {"juri/cass/global/JURI/TEXT/JURITEXT999999999999.xml": DECISION})
        cls.base = Base(cls.dossier / "base.sqlite", ecriture=True)
        cls.compte_legi = dila.importer(legi, cls.base, progression=lambda *_: None)
        dila.importer(cass, cls.base, progression=lambda *_: None)

    def test_import(self):
        self.assertEqual(self.compte_legi["articles"], 3)
        self.assertEqual(self.compte_legi["suppressions"], 1)
        self.assertIsNone(self.base.article_par_id("LEGIARTI000000000001"))
        self.assertEqual(self.base.titres(), {"code civil"})
        a = self.base.article_par_id("LEGIARTI000032041571")
        self.assertEqual(a["chemin"], "Livre III : Des différentes manières dont on acquiert la propriété > Titre III : Des sources d'obligations")

    def test_version_par_date(self):
        cids = self.base.cids("code civil")
        self.assertEqual(self.base.article(cids, "1240", date(2026, 11, 5))["id"], "LEGIARTI000032041571")
        self.assertTrue(self.base.article(cids, "1382", date(2010, 1, 1))["applicable"])
        self.assertFalse(self.base.article(cids, "1382", date(2026, 11, 5))["applicable"])

    def test_citations_et_recherche(self):
        self.assertEqual([d["id"] for d in self.base.decisions_citant("code civil", "1240")], ["JURITEXT999999999999"])
        self.assertEqual(self.base.decisions_par_numero("99-99999")[0]["formation"], "2e chambre civile")
        self.assertTrue(self.base.rechercher_articles(["dommage", "faute"], date(2026, 11, 5)))
        self.assertTrue(self.base.rechercher_decisions(["imprudence"]))

    def test_extraits_pour_une_question(self):
        juridique = Juridique(self.dossier / "base.sqlite")
        r = juridique.extraits("Que dit l'article 1240 du Code civil ?", [], date(2026, 11, 5))
        types = [e["source"]["type"] for e in r.extraits]
        self.assertEqual(types, ["loi", "jurisprudence"])
        self.assertIn("version en vigueur depuis le 1er octobre 2016", r.extraits[0]["etiquette"])
        self.assertIn("sommaire officiel", r.extraits[1]["etiquette"])
        # Une pièce du dossier qui cite un article : il est donné au modèle.
        r = juridique.extraits("Quel est le fondement de la demande ?", ["Sur le fondement de l'article 1240 du code civil"],
                               date(2026, 11, 5))
        self.assertEqual(r.extraits[0]["source"]["origine"], "cité dans une pièce du dossier")
        # Question sans rapport avec le droit : rien.
        self.assertEqual(juridique.extraits("Quelles sont mes prochaines audiences ?", [], date(2026, 11, 5)).extraits, [])

    def test_ancienne_version(self):
        juridique = Juridique(self.dossier / "base.sqlite")
        r = juridique.extraits("Que disait l'article 1382 du code civil, version en vigueur en 2010 ?", [], date(2026, 11, 5))
        self.assertIn("version applicable au 31 décembre 2010", r.extraits[0]["etiquette"])


class TestRequetes(unittest.TestCase):
    def test_requete_publique_sans_nom(self):
        requete = requete_publique("Quelle prescription pour l'action de M. Garnier contre la SCI Lefort, dossier 2026-014 ?")
        self.assertNotIn("Garnier", requete)
        self.assertNotIn("Lefort", requete)
        self.assertNotIn("2026-014", requete)
        self.assertIn("prescription", requete)

    def test_date_applicable(self):
        self.assertEqual(date_applicable("article 1382 applicable au 1er janvier 2015", date(2026, 11, 5)), (date(2015, 1, 1), True))
        self.assertEqual(date_applicable("audience du 12 mars 2027", date(2026, 11, 5)), (date(2026, 11, 5), False))

    def test_est_juridique(self):
        self.assertTrue(est_juridique("Quel est le délai de prescription en matière de bail ?"))
        self.assertFalse(est_juridique("Quel est le téléphone de Maître Dubois ?"))


class FauxPiste(__import__("http.server").server.BaseHTTPRequestHandler):
    """Réponses au format documenté des API (structure seulement, contenu fictif)."""
    vus = []

    def log_message(self, *args):
        pass

    def _json(self, corps):
        donnees = __import__("json").dumps(corps).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(donnees)))
        self.end_headers()
        self.wfile.write(donnees)

    def do_POST(self):
        self.rfile.read(int(self.headers.get("Content-Length", 0)))
        FauxPiste.vus.append((self.path, self.headers.get("Authorization"), self.headers.get("KeyId")))
        if self.path.endswith("/token"):
            return self._json({"access_token": "jeton-fictif", "expires_in": 3600})
        if self.path.endswith("/search"):
            return self._json({"results": [{"titles": [{"id": "LEGITEXT000006070721"}],
                                            "sections": [{"extracts": [{"id": "LEGIARTI000032041571", "num": "1240"}]}]}]})
        if self.path.endswith("/consult/getArticle"):
            return self._json({"article": {"id": "LEGIARTI000032041571", "num": "1240", "etat": "VIGUEUR",
                                           "dateDebut": 1475280000000, "texteHtml": f"<p>{TEXTE_1240}</p>",
                                           "context": {"titreTxt": [{"titre": "Code civil"}]}}})

    def do_GET(self):
        FauxPiste.vus.append((self.path.split("?")[0], self.headers.get("Authorization"), self.headers.get("KeyId")))
        self._json({"results": [{"id": "fictif", "jurisdiction": "cc", "chamber": "civ2", "number": "99-99.999",
                                 "decision_date": "2026-01-01", "solution": "rejet", "summary": "Sommaire fictif.",
                                 "publication": ["b"], "highlights": {"text": ["la <em>faute</em> fictive"]}}]})


class TestEnLigne(unittest.TestCase):
    def test_client_piste(self):
        import os
        import threading
        from http.server import ThreadingHTTPServer
        from . import en_ligne, journal
        serveur = ThreadingHTTPServer(("127.0.0.1", 0), FauxPiste)
        threading.Thread(target=serveur.serve_forever, daemon=True).start()
        base_url = f"http://127.0.0.1:{serveur.server_port}"
        en_ligne.ENVIRONNEMENTS["essai"] = (base_url + "/api/oauth/token", base_url)
        os.environ["PISTE_CLE_API"] = "cle-fictive"
        try:
            piste = en_ligne.Piste("id", "secret", "essai")
            articles = piste.articles("responsabilite faute")
            self.assertEqual((articles[0]["titre"], articles[0]["num"], articles[0]["debut"]), ("Code civil", "1240", "2016-10-01"))
            self.assertEqual(articles[0]["texte"], TEXTE_1240)
            decisions = piste.decisions("faute")
            self.assertEqual(decisions[0]["extraits"], ["la faute fictive"])
            judilibre = [v for v in FauxPiste.vus if v[0].startswith(en_ligne.JUDILIBRE)]
            self.assertEqual(judilibre[0][2], "cle-fictive")
            # Passerelle : refuse sans identifiants, et journalise chaque appel.
            journal.CHEMIN = Path(tempfile.mkdtemp()) / "juridique.jsonl"
            en_ligne.piste = en_ligne.Piste("", "", "essai")
            passerelle = ThreadingHTTPServer(("127.0.0.1", 0), en_ligne.Passerelle)
            threading.Thread(target=passerelle.serve_forever, daemon=True).start()
            adresse = f"http://127.0.0.1:{passerelle.server_port}"
            with self.assertRaises(en_ligne.Indisponible):
                en_ligne.rechercher(adresse, "faute", "hcorbiere")
            en_ligne.piste = piste
            reponse = en_ligne.rechercher(adresse, "faute", "hcorbiere")
            self.assertEqual(len(reponse["articles"]), 1)
            lignes = journal.CHEMIN.read_text(encoding="utf-8").splitlines()
            self.assertEqual(len(lignes), 2)
            self.assertIn('"requete": "faute"', lignes[0])
            passerelle.shutdown()
        finally:
            serveur.shutdown()
            os.environ.pop("PISTE_CLE_API", None)


if __name__ == "__main__":
    unittest.main()
