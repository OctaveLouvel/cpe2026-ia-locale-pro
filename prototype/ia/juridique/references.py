"""Repérage des références juridiques dans un texte : questions des avocats, pièces des dossiers, liens des
décisions de justice.

    « l'article 1240 du Code civil »            -> article 1240, code civil
    « art. L. 1234-9 et L. 1234-11 C. trav. »   -> articles L1234-9 et L1234-11, code du travail
    « l'article 2234 du même code »             -> article 2234, code de la référence précédente
    « article 37 de la loi n° 91-647 »          -> article 37, loi n° 91-647
    « pourvoi n° 24-17.384 », « ECLI:FR:… »     -> décision

Les noms de codes sont reconnus contre la liste des codes présents dans la base (le plus long nom qui
convient), sinon par les abréviations courantes ci-dessous. Une référence sans code reconnu est ignorée :
mieux vaut ne rien citer que citer le mauvais article.
"""
import re
import unicodedata
from dataclasses import dataclass


def normaliser(texte: str) -> str:
    """Minuscules, sans accents, apostrophes droites, espaces simples."""
    texte = unicodedata.normalize("NFKD", texte.replace("’", "'").replace("‑", "-").replace("–", "-"))
    texte = "".join(c for c in texte if not unicodedata.combining(c)).lower()
    return " ".join(texte.split())


def numero(num: str) -> str:
    """Numéro d'article comparable : « L. 1234-9 » et « L1234-9 » donnent « L1234-9 »."""
    num = normaliser(num).upper().replace(" ", "").replace(".", "").replace("*", "")
    return num.rstrip(",;")


# Abréviations d'usage (doctrine, conclusions) -> nom du code tel qu'il figure dans LEGI, normalisé.
ABREVIATIONS = {
    "c. civ": "code civil", "c.civ": "code civil", "c civ": "code civil",
    "c. com": "code de commerce", "c.com": "code de commerce", "c com": "code de commerce",
    "c. trav": "code du travail", "c.trav": "code du travail", "c trav": "code du travail",
    "cpc": "code de procedure civile", "c. pr. civ": "code de procedure civile", "ncpc": "code de procedure civile",
    "cpp": "code de procedure penale", "c. pr. pen": "code de procedure penale",
    "c. pen": "code penal", "c.pen": "code penal",
    "c. consom": "code de la consommation", "c. conso": "code de la consommation",
    "css": "code de la securite sociale", "c. secu. soc": "code de la securite sociale",
    "cgi": "code general des impots",
    "cch": "code de la construction et de l'habitation",
    "cpce": "code des procedures civiles d'execution",
    "cpi": "code de la propriete intellectuelle",
    "cmf": "code monetaire et financier", "c. mon. fin": "code monetaire et financier",
    "c. assur": "code des assurances",
    "cja": "code de justice administrative",
    "coj": "code de l'organisation judiciaire",
    "cgct": "code general des collectivites territoriales",
    "c. urb": "code de l'urbanisme",
    "c. env": "code de l'environnement",
    "csp": "code de la sante publique",
    "ceseda": "code de l'entree et du sejour des etrangers et du droit d'asile",
    "c. rur": "code rural et de la peche maritime",
}
_ABREV = "|".join(sorted((re.escape(a) for a in ABREVIATIONS), key=len, reverse=True))

_SUFFIXE = r"(?:\s?(?:bis|ter|quater|quinquies|sexies|septies|octies|nonies|decies))?"
NUM = r"(?:(?:LO|L|R|D|A)\s?\.?\s?\*?\s?)?\d+(?:\s?[-.]\s?\d+)*" + _SUFFIXE
_LISTE = rf"{NUM}(?:(?:\s*,\s*(?:et\s+|ou\s+)?|\s+(?:et|à|a|ou)\s+){NUM})*"
# « article 1240 », « articles L. 1234-9 et L. 1234-11 », « art. 700 »
ARTICLE = re.compile(rf"(?i)\b(?:articles?|art\.?)\s+(?P<nums>{_LISTE})"
                     rf"(?P<alinea>(?:\s*,?\s*(?:alin[ée]as?|al\.)\s*\d+(?:er)?)?)"
                     rf"(?=(?P<suite>.{{0,140}}))", re.S)
# « C. civ., art. 1240 »
ABREV_AVANT = re.compile(rf"(?i)\b(?P<abrev>{_ABREV})\.?\s*,?\s*art\.?\s+(?P<nums>{_LISTE})")
_NUM_SEUL = re.compile(rf"(?i){NUM}")

POURVOI = re.compile(r"(?<![\d/])(\d{2})\s?[-‑.]\s?(\d{2})\s?\.?\s?(\d{3})(?![\d])")
ECLI = re.compile(r"\bECLI:FR:[A-Z]+:\d{4}:[A-Z0-9.]+")
LOI = re.compile(r"(?i)^(?:,\s*)?(?:de la|du|de l')\s*(?P<nature>loi organique|loi|d[ée]cret|ordonnance)"
                 r"(?:\s*n\s?[°o]\s*(?P<num>\d{2,4}-\d+))?(?:\s*du\s+(?P<date>\d{1,2}(?:er)?\s+\w+\s+\d{4}))?")


@dataclass(frozen=True)
class Article:
    num: str                      # normalisé, voir numero()
    code: str | None = None       # nom normalisé du code (« code civil »)
    texte: tuple | None = None    # pour une loi : (nature, numéro, date), normalisés
    brut: str = ""                # passage du texte d'origine


@dataclass(frozen=True)
class Decision:
    numero: str | None = None     # pourvoi normalisé : « 24-17384 »
    ecli: str | None = None
    brut: str = ""


def _nums(liste: str) -> list[str]:
    return [numero(m.group(0)) for m in _NUM_SEUL.finditer(liste)]


def _code(suite: str, titres: set[str], precedent: str | None):
    """Nom du code qui suit la liste d'articles, ou (nature, numéro, date) pour une loi ou un décret."""
    s = normaliser(suite)
    s = re.sub(r"^[\s,]*(?:\((?:[^)]*)\)\s*)?", "", s)
    if re.match(r"^(?:du meme|de ce|dudit|meme)\s+code\b", s):
        return precedent
    m = re.match(r"^(?:du|de la|de l'|des)?\s*(code\b.*)", s)
    if m:
        reste = m.group(1)
        connus = [t for t in titres if reste.startswith(t) and (len(reste) == len(t) or not reste[len(t)].isalnum())]
        if connus:
            return max(connus, key=len)
        if not titres:  # pas de base : on prend le nom jusqu'à la ponctuation, borné
            nom = re.match(r"code(?: [a-z'-]+){1,7}?(?=[,.;:)]|$| (?:a|ont|et|qui|dans|en|est|sont|pour|issu|issue|modifie|relatif|applicable|selon|au|aux|le|la|les|prevoit|dispose|enonce|ne|n'|sur|concernant|quant|lorsque|si|lors|depuis|avant|apres|par|ou|que)\b)", reste)
            return nom.group(0) if nom else None
        return None
    m = re.match(rf"^(?:du\s+|,\s*)?({_ABREV})\b\.?", s)
    if m:
        return ABREVIATIONS[m.group(1)]
    m = LOI.match(s)
    if m and (m.group("num") or m.group("date")):
        nature = "loi" if m.group("nature").startswith("loi") else normaliser(m.group("nature"))
        return (nature, m.group("num"), m.group("date"))
    return None


def articles(texte: str, titres: set[str] = frozenset()) -> list[Article]:
    """Articles cités dans le texte, dans l'ordre, sans doublon. `titres` : noms normalisés des codes connus."""
    trouves, precedent = [], None
    for m in sorted([*ARTICLE.finditer(texte), *ABREV_AVANT.finditer(texte)], key=lambda m: m.start()):
        if "abrev" in m.groupdict() and m.groupdict().get("abrev"):
            code = ABREVIATIONS[normaliser(m.group("abrev")).rstrip(".")]
        else:
            code = _code(m.group("suite"), titres, precedent)
        if code is None:
            continue
        if isinstance(code, str):
            precedent = code
        for num in _nums(m.group("nums")):
            ref = Article(num, code if isinstance(code, str) else None, code if isinstance(code, tuple) else None,
                          m.group(0)[:160].strip())
            if all((r.num, r.code, r.texte) != (ref.num, ref.code, ref.texte) for r in trouves):
                trouves.append(ref)
    return trouves


def decisions(texte: str) -> list[Decision]:
    """Décisions citées : numéros de pourvoi (« 24-17.384 ») et identifiants ECLI."""
    trouves = []
    for m in ECLI.finditer(texte):
        trouves.append(Decision(ecli=m.group(0).rstrip("."), brut=m.group(0)))
    for m in POURVOI.finditer(texte):
        avant = texte[max(0, m.start() - 25):m.start()].lower()
        # Un numéro de pourvoi s'écrit « n° 24-17.384 » ou « pourvoi 24-17.384 » : sans ce contexte, on
        # risquerait de prendre une date ou un numéro de dossier du cabinet.
        if re.search(r"(n\s?[°o]|pourvoi|pourvois)\s*[a-z]?\s*$", avant) or "." in m.group(0):
            num = f"{m.group(1)}-{m.group(2)}{m.group(3)}"
            if all(d.numero != num for d in trouves):
                trouves.append(Decision(numero=num, brut=m.group(0)))
    return trouves
