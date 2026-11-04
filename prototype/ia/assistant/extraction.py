"""Texte des documents, avec la page (PDF) ou la section (DOCX) d'origine, puis découpage en extraits.

Le découpage suit la structure des actes : une ligne « Article 12 - ... » ou « 12.1 » ouvre un nouveau
bloc, pour que l'assistant puisse citer un article précis et sa page.
"""
import io
import re
from dataclasses import dataclass

import docx
from pypdf import PdfReader

TYPES_PRIS_EN_CHARGE = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "texte",
    "text/markdown": "texte",
}

# Bandeau « DOCUMENT FICTIF » des données de démonstration et pied de page : du bruit pour la recherche.
BRUIT = re.compile(r"^(DOCUMENT FICTIF - données de démonstration.*|Page \d+ sur \d+)$")
TITRE = re.compile(r"^(Article \d+|ARTICLE \d+|TITRE [IVX]+|[IVX]+\. |\d+\. [A-ZÉ])")


@dataclass
class Passage:
    texte: str
    page: int | None = None
    section: str | None = None


@dataclass
class Extrait:
    texte: str
    page: int | None
    section: str | None


def extraire(contenu: bytes, type_mime: str) -> list[Passage]:
    genre = TYPES_PRIS_EN_CHARGE.get(type_mime)
    if genre == "pdf":
        return _pdf(contenu)
    if genre == "docx":
        return _docx(contenu)
    if genre == "texte":
        return [Passage(contenu.decode("utf-8", errors="replace"))]
    return []


def _nettoyer(texte: str) -> str:
    lignes = [l.rstrip() for l in texte.replace(" ", " ").replace(" ", " ").split("\n")]
    return "\n".join(l for l in lignes if l.strip() and not BRUIT.match(l.strip()))


def _pdf(contenu: bytes) -> list[Passage]:
    lecteur = PdfReader(io.BytesIO(contenu))
    return [Passage(_nettoyer(page.extract_text() or ""), page=numero)
            for numero, page in enumerate(lecteur.pages, start=1)]


def _docx(contenu: bytes) -> list[Passage]:
    document = docx.Document(io.BytesIO(contenu))
    passages, section, tampon = [], None, []

    def vider():
        if tampon:
            passages.append(Passage(_nettoyer("\n".join(tampon)), section=section))
            tampon.clear()

    blocs = document.iter_inner_content() if hasattr(document, "iter_inner_content") else document.paragraphs
    for bloc in blocs:
        if hasattr(bloc, "rows"):  # tableau
            for rangee in bloc.rows:
                cellules = [c.text.strip() for c in rangee.cells if c.text.strip()]
                if cellules:
                    tampon.append(" | ".join(dict.fromkeys(cellules)))
            continue
        texte = bloc.text.strip()
        if not texte:
            continue
        style = (bloc.style.name if bloc.style is not None else "") or ""
        if style.startswith(("Heading", "Title", "Titre")):
            vider()
            section = texte
        tampon.append(texte)
    vider()
    return passages


def decouper(passages: list[Passage], mots_max: int) -> list[Extrait]:
    """Extraits d'environ mots_max mots. On coupe d'abord aux articles (« Article 12 - ... »), puis aux
    sous-clauses (« 12.4 ») si l'article est long ; les articles courts sont regroupés. Chaque extrait
    garde le titre de son article, pour citer « article 12, page 2 »."""
    extraits = []
    for passage in passages:
        for titre, lignes in _blocs(passage.texte.split("\n"), TITRE):
            mots = " ".join(lignes).split()
            etiquette = titre or passage.section
            if len(mots) <= mots_max:
                _ajouter(extraits, mots, passage.page, etiquette, mots_max)
                continue
            # Article long : on le découpe à ses sous-clauses, en rappelant son titre.
            paquet = []
            for _, sous_lignes in _blocs(lignes, SOUS_TITRE):
                sous_mots = " ".join(sous_lignes).split()
                if paquet and len(paquet) + len(sous_mots) > mots_max:
                    extraits.append(Extrait(_avec_titre(paquet, titre), passage.page, etiquette))
                    paquet = []
                paquet += sous_mots
                while len(paquet) > mots_max:  # sous-clause encore trop longue : fenêtres
                    extraits.append(Extrait(_avec_titre(paquet[:mots_max], titre), passage.page, etiquette))
                    paquet = paquet[mots_max - mots_max // 5:]
            if paquet:
                extraits.append(Extrait(_avec_titre(paquet, titre), passage.page, etiquette))
    return [e for e in extraits if len(e.texte.split()) >= 4]


SOUS_TITRE = re.compile(r"^(\d+\.\d+ |[A-D]\. )")


def _blocs(lignes, motif):
    """Coupe une liste de lignes avant chaque ligne qui correspond au motif. Renvoie (titre, lignes)."""
    blocs, courant, titre = [], [], None
    for ligne in (l.strip() for l in lignes):
        if not ligne:
            continue
        if motif.match(ligne) and courant:
            blocs.append((titre, courant))
            courant, titre = [], None
        if motif.match(ligne) and not courant:
            titre = ligne[:90]
        courant.append(ligne)
    if courant:
        blocs.append((titre, courant))
    return blocs


def _avec_titre(mots, titre):
    texte = " ".join(mots)
    return texte if not titre or texte.startswith(titre[:20]) else f"({titre}) {texte}"


def _ajouter(extraits, mots, page, etiquette, mots_max):
    """Regroupe un article court avec l'extrait précédent de la même page s'il reste de la place."""
    precedent = extraits[-1] if extraits else None
    if precedent and precedent.page == page and len(precedent.texte.split()) + len(mots) <= mots_max:
        precedent.texte += " " + " ".join(mots)
        if etiquette and etiquette != precedent.section:
            precedent.section = f"{precedent.section} ; {etiquette}" if precedent.section else etiquette
    else:
        extraits.append(Extrait(" ".join(mots), page, etiquette))
