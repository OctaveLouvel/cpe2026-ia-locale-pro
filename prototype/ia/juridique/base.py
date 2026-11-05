"""Base juridique de la box : un fichier SQLite (par défaut sortie/juridique/base.sqlite).

- `articles` : chaque version de chaque article (LEGI), avec ses dates de vigueur. La version applicable à
  une date est celle dont debut <= date < fin : on peut donc répondre pour la date des faits, pas seulement
  pour aujourd'hui.
- `decisions` : décisions de justice (Cour de cassation, cours d'appel, juridictions administratives),
  avec leur sommaire officiel quand il existe.
- `citations` : articles cités par chaque décision (liens officiels, sommaire, visas), pour retrouver les
  décisions qui appliquent un article.
- index plein texte FTS5 sur les articles et les décisions (sans accents, classement BM25).

Base en lecture seule pour l'assistant ; seuls l'import et la mise à jour l'écrivent.
"""
import sqlite3
import threading
from datetime import date
from pathlib import Path

from .references import normaliser

SCHEMA = """
CREATE TABLE IF NOT EXISTS textes(
    cid TEXT PRIMARY KEY, titre TEXT, titre_court TEXT, titre_norm TEXT, nature TEXT);
CREATE INDEX IF NOT EXISTS textes_norm ON textes(titre_norm);

CREATE TABLE IF NOT EXISTS articles(
    rowid INTEGER PRIMARY KEY, id TEXT UNIQUE, cid TEXT, titre TEXT, num TEXT, num_norm TEXT, etat TEXT,
    debut TEXT, fin TEXT, chemin TEXT, texte TEXT, nota TEXT);
CREATE INDEX IF NOT EXISTS articles_ref ON articles(cid, num_norm);
CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
    num, titre, chemin, texte, content='articles', content_rowid='rowid', tokenize='unicode61 remove_diacritics 2');

CREATE TABLE IF NOT EXISTS decisions(
    rowid INTEGER PRIMARY KEY, id TEXT UNIQUE, fonds TEXT, juridiction TEXT, formation TEXT, date TEXT,
    numeros TEXT, ecli TEXT, solution TEXT, publie INTEGER, titre TEXT, sommaire TEXT, texte TEXT, liens TEXT);
CREATE INDEX IF NOT EXISTS decisions_ecli ON decisions(ecli);
CREATE VIRTUAL TABLE IF NOT EXISTS decisions_fts USING fts5(
    titre, sommaire, texte, content='decisions', content_rowid='rowid', tokenize='unicode61 remove_diacritics 2');
CREATE TABLE IF NOT EXISTS numeros(numero TEXT, decision TEXT, PRIMARY KEY(numero, decision));
CREATE TABLE IF NOT EXISTS citations(decision TEXT, code TEXT, num TEXT, PRIMARY KEY(decision, code, num));
CREATE INDEX IF NOT EXISTS citations_article ON citations(code, num);

CREATE TABLE IF NOT EXISTS archives(nom TEXT PRIMARY KEY, fonds TEXT, importee_le TEXT, elements INTEGER);
"""

DECLENCHEURS = """
CREATE TRIGGER IF NOT EXISTS articles_ai AFTER INSERT ON articles BEGIN
  INSERT INTO articles_fts(rowid, num, titre, chemin, texte) VALUES (new.rowid, new.num, new.titre, new.chemin, new.texte);
END;
CREATE TRIGGER IF NOT EXISTS articles_ad AFTER DELETE ON articles BEGIN
  INSERT INTO articles_fts(articles_fts, rowid, num, titre, chemin, texte) VALUES ('delete', old.rowid, old.num, old.titre, old.chemin, old.texte);
END;
CREATE TRIGGER IF NOT EXISTS articles_au AFTER UPDATE ON articles BEGIN
  INSERT INTO articles_fts(articles_fts, rowid, num, titre, chemin, texte) VALUES ('delete', old.rowid, old.num, old.titre, old.chemin, old.texte);
  INSERT INTO articles_fts(rowid, num, titre, chemin, texte) VALUES (new.rowid, new.num, new.titre, new.chemin, new.texte);
END;
CREATE TRIGGER IF NOT EXISTS decisions_ai AFTER INSERT ON decisions BEGIN
  INSERT INTO decisions_fts(rowid, titre, sommaire, texte) VALUES (new.rowid, new.titre, new.sommaire, new.texte);
END;
CREATE TRIGGER IF NOT EXISTS decisions_ad AFTER DELETE ON decisions BEGIN
  INSERT INTO decisions_fts(decisions_fts, rowid, titre, sommaire, texte) VALUES ('delete', old.rowid, old.titre, old.sommaire, old.texte);
END;
CREATE TRIGGER IF NOT EXISTS decisions_au AFTER UPDATE ON decisions BEGIN
  INSERT INTO decisions_fts(decisions_fts, rowid, titre, sommaire, texte) VALUES ('delete', old.rowid, old.titre, old.sommaire, old.texte);
  INSERT INTO decisions_fts(rowid, titre, sommaire, texte) VALUES (new.rowid, new.titre, new.sommaire, new.texte);
END;
"""
NOMS_DECLENCHEURS = ["articles_ai", "articles_ad", "articles_au", "decisions_ai", "decisions_ad", "decisions_au"]

# Poids BM25 par colonne : le sommaire officiel d'une décision et l'intitulé d'un article comptent plus.
POIDS_ARTICLES = "bm25(articles_fts, 3.0, 2.0, 1.5, 1.0)"
POIDS_DECISIONS = "bm25(decisions_fts, 1.5, 4.0, 1.0)"


def requete_fts(mots: list[str]) -> str:
    """Requête FTS5 à partir de mots déjà normalisés : chacun en préfixe (pluriels, conjugaisons), en OU."""
    propres = [m for m in dict.fromkeys(mots) if m.isalnum()]
    return " OR ".join(f'"{m}"*' for m in propres)


class Base:
    def __init__(self, chemin: Path, ecriture: bool = False):
        self.chemin = Path(chemin)
        self.ecriture = ecriture
        self._local = threading.local()
        self._titres = None
        if ecriture:
            self.chemin.parent.mkdir(parents=True, exist_ok=True)
            with self.connexion() as c:
                c.executescript(SCHEMA + DECLENCHEURS)

    @property
    def disponible(self) -> bool:
        return self.chemin.exists()

    def connexion(self) -> sqlite3.Connection:
        """Une connexion par fil d'exécution (le serveur de l'assistant répond à plusieurs postes à la fois)."""
        c = getattr(self._local, "c", None)
        if c is None:
            if self.ecriture:
                # Journal classique (pas WAL) : l'assistant lit la base sur un montage en lecture seule.
                c = sqlite3.connect(self.chemin)
                c.execute("PRAGMA journal_mode=DELETE")
                c.execute("PRAGMA synchronous=NORMAL")
            else:
                c = sqlite3.connect(f"file:{self.chemin}?mode=ro", uri=True)
            c.row_factory = sqlite3.Row
            self._local.c = c
        return c

    # ------------------------------------------------------------ import en masse

    def suspendre_index(self):
        """Import d'une archive complète : l'index plein texte est reconstruit une fois à la fin."""
        with self.connexion() as c:
            for nom in NOMS_DECLENCHEURS:
                c.execute(f"DROP TRIGGER IF EXISTS {nom}")

    def reconstruire_index(self):
        with self.connexion() as c:
            c.execute("INSERT INTO articles_fts(articles_fts) VALUES ('rebuild')")
            c.execute("INSERT INTO decisions_fts(decisions_fts) VALUES ('rebuild')")
            c.executescript(DECLENCHEURS)
            c.execute("INSERT INTO articles_fts(articles_fts) VALUES ('optimize')")
            c.execute("INSERT INTO decisions_fts(decisions_fts) VALUES ('optimize')")

    # ------------------------------------------------------------ écriture

    def ecrire_texte(self, c, cid, titre, titre_court, nature):
        c.execute("INSERT INTO textes(cid, titre, titre_court, titre_norm, nature) VALUES (?,?,?,?,?) "
                  "ON CONFLICT(cid) DO UPDATE SET titre=excluded.titre, titre_court=excluded.titre_court, "
                  "titre_norm=excluded.titre_norm, nature=excluded.nature",
                  (cid, titre, titre_court, normaliser(titre_court or titre), nature))

    def ecrire_article(self, c, a: dict):
        c.execute("INSERT INTO articles(id, cid, titre, num, num_norm, etat, debut, fin, chemin, texte, nota) "
                  "VALUES (:id,:cid,:titre,:num,:num_norm,:etat,:debut,:fin,:chemin,:texte,:nota) "
                  "ON CONFLICT(id) DO UPDATE SET cid=excluded.cid, titre=excluded.titre, num=excluded.num, "
                  "num_norm=excluded.num_norm, etat=excluded.etat, debut=excluded.debut, fin=excluded.fin, "
                  "chemin=excluded.chemin, texte=excluded.texte, nota=excluded.nota", a)

    def ecrire_decision(self, c, d: dict, citations: list[tuple[str, str]]):
        c.execute("INSERT INTO decisions(id, fonds, juridiction, formation, date, numeros, ecli, solution, publie, "
                  "titre, sommaire, texte, liens) VALUES (:id,:fonds,:juridiction,:formation,:date,:numeros,:ecli,"
                  ":solution,:publie,:titre,:sommaire,:texte,:liens) ON CONFLICT(id) DO UPDATE SET "
                  "fonds=excluded.fonds, juridiction=excluded.juridiction, formation=excluded.formation, "
                  "date=excluded.date, numeros=excluded.numeros, ecli=excluded.ecli, solution=excluded.solution, "
                  "publie=excluded.publie, titre=excluded.titre, sommaire=excluded.sommaire, texte=excluded.texte, "
                  "liens=excluded.liens", d)
        c.execute("DELETE FROM numeros WHERE decision = ?", (d["id"],))
        c.executemany("INSERT OR IGNORE INTO numeros(numero, decision) VALUES (?, ?)",
                      [(n, d["id"]) for n in d["numeros"].split()])
        self.ecrire_citations(c, d["id"], citations)

    def ecrire_citations(self, c, decision, citations):
        c.execute("DELETE FROM citations WHERE decision = ?", (decision,))
        c.executemany("INSERT OR IGNORE INTO citations(decision, code, num) VALUES (?, ?, ?)",
                      [(decision, code, num) for code, num in citations])

    def supprimer(self, c, identifiant: str):
        if identifiant.startswith("LEGIARTI"):
            c.execute("DELETE FROM articles WHERE id = ?", (identifiant,))
        elif identifiant.startswith(("JURITEXT", "CETATEXT")):
            c.execute("DELETE FROM decisions WHERE id = ?", (identifiant,))
            c.execute("DELETE FROM numeros WHERE decision = ?", (identifiant,))
            c.execute("DELETE FROM citations WHERE decision = ?", (identifiant,))

    # ------------------------------------------------------------ lecture : textes

    def titres(self) -> set[str]:
        """Noms normalisés des codes présents (« code civil »), pour reconnaître les références."""
        if self._titres is None:
            if not self.disponible:
                return set()
            self._titres = {r[0] for r in self.connexion().execute(
                "SELECT titre_norm FROM textes WHERE nature = 'CODE' AND titre_norm != ''")}
        return self._titres

    def cids(self, code: str | None = None, loi: tuple | None = None) -> list[str]:
        c = self.connexion()
        if code:
            return [r[0] for r in c.execute("SELECT cid FROM textes WHERE titre_norm = ?", (code,))]
        if loi:
            nature, num, quand = loi
            if num:
                # « n° 91-647 » ou « n°2002-832 » selon les textes : on compare sans espaces.
                return [r[0] for r in c.execute("SELECT cid FROM textes WHERE replace(titre_norm, ' ', '') LIKE ? "
                                                "AND titre_norm LIKE ?", (f"%n°{num}%", f"{nature}%"))]
            if quand:
                lignes = [r[0] for r in c.execute("SELECT cid FROM textes WHERE titre_norm LIKE ?",
                                                  (f"{nature}% du {normaliser(quand)}%",))]
                return lignes if len(lignes) == 1 else []  # une date seule peut désigner plusieurs lois
        return []

    # ------------------------------------------------------------ lecture : articles

    def article(self, cids: list[str], num: str, quand: date) -> dict | None:
        """Version applicable à la date donnée ; à défaut, la dernière version connue (signalée par « applicable »)."""
        if not cids:
            return None
        marques = ",".join("?" * len(cids))
        c = self.connexion()
        jour = quand.isoformat()
        ligne = c.execute(f"SELECT * FROM articles WHERE cid IN ({marques}) AND num_norm = ? AND debut <= ? AND fin > ? "
                          "ORDER BY debut DESC LIMIT 1", (*cids, num, jour, jour)).fetchone()
        if ligne:
            return {**dict(ligne), "applicable": True}
        ligne = c.execute(f"SELECT * FROM articles WHERE cid IN ({marques}) AND num_norm = ? ORDER BY debut DESC LIMIT 1",
                          (*cids, num)).fetchone()
        return {**dict(ligne), "applicable": False} if ligne else None

    def article_par_id(self, identifiant: str) -> dict | None:
        ligne = self.connexion().execute("SELECT * FROM articles WHERE id = ?", (identifiant,)).fetchone()
        return dict(ligne) if ligne else None

    def versions(self, cid: str, num: str) -> list[dict]:
        return [dict(r) for r in self.connexion().execute(
            "SELECT id, etat, debut, fin FROM articles WHERE cid = ? AND num_norm = ? ORDER BY debut", (cid, num))]

    def rechercher_articles(self, mots: list[str], quand: date, nombre: int = 10, cids: list[str] | None = None):
        requete = requete_fts(mots)
        if not requete:
            return []
        jour = quand.isoformat()
        filtre, valeurs = "", []
        if cids:
            filtre = f" AND a.cid IN ({','.join('?' * len(cids))})"
            valeurs = cids
        return [dict(r) for r in self.connexion().execute(
            f"SELECT a.*, {POIDS_ARTICLES} AS score FROM articles_fts JOIN articles a ON a.rowid = articles_fts.rowid "
            f"WHERE articles_fts MATCH ? AND a.debut <= ? AND a.fin > ?{filtre} ORDER BY score LIMIT ?",
            (requete, jour, jour, *valeurs, nombre))]

    # ------------------------------------------------------------ lecture : décisions

    def decision(self, identifiant: str) -> dict | None:
        ligne = self.connexion().execute("SELECT * FROM decisions WHERE id = ?", (identifiant,)).fetchone()
        return dict(ligne) if ligne else None

    def decisions_par_numero(self, numero: str = None, ecli: str = None) -> list[dict]:
        c = self.connexion()
        if ecli:
            return [dict(r) for r in c.execute("SELECT * FROM decisions WHERE ecli = ?", (ecli,))]
        return [dict(r) for r in c.execute(
            "SELECT d.* FROM numeros n JOIN decisions d ON d.id = n.decision WHERE n.numero = ? ORDER BY d.date DESC",
            (numero,))]

    def decisions_citant(self, code: str, num: str, nombre: int = 5) -> list[dict]:
        """Décisions qui citent un article : les publiées d'abord, puis les plus récentes."""
        return [dict(r) for r in self.connexion().execute(
            "SELECT d.* FROM citations c JOIN decisions d ON d.id = c.decision WHERE c.code = ? AND c.num = ? "
            "ORDER BY d.publie DESC, d.date DESC LIMIT ?", (code, num, nombre))]

    def rechercher_decisions(self, mots: list[str], nombre: int = 10, fonds: list[str] | None = None):
        requete = requete_fts(mots)
        if not requete:
            return []
        filtre = f" AND d.fonds IN ({','.join('?' * len(fonds))})" if fonds else ""
        # Les décisions publiées (Bulletin, Lebon) font jurisprudence : léger avantage au classement.
        return [dict(r) for r in self.connexion().execute(
            f"SELECT d.*, {POIDS_DECISIONS} - 1.5 * d.publie AS score FROM decisions_fts "
            f"JOIN decisions d ON d.rowid = decisions_fts.rowid WHERE decisions_fts MATCH ?{filtre} "
            "ORDER BY score LIMIT ?", (requete, *(fonds or []), nombre))]

    # ------------------------------------------------------------ état

    def statistiques(self) -> dict:
        if not self.disponible:
            return {"disponible": False}
        c = self.connexion()
        compter = lambda sql: c.execute(sql).fetchone()[0]
        fonds = {r[0]: r[1] for r in c.execute("SELECT fonds, count(*) FROM decisions GROUP BY fonds")}
        derniere = c.execute("SELECT nom, importee_le FROM archives ORDER BY nom DESC LIMIT 1").fetchone()
        return {"disponible": True, "codes": compter("SELECT count(*) FROM textes WHERE nature = 'CODE'"),
                "textes": compter("SELECT count(*) FROM textes"),
                "articles": compter("SELECT count(*) FROM articles"), "decisions": fonds,
                "archives": compter("SELECT count(*) FROM archives"),
                "derniere_archive": dict(derniere) if derniere else None}
