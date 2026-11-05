"""Logo asoterIA : une box (hexagone vu en cube) dont les arêtes intérieures sont un petit réseau
de neurones qui ne touche pas les bords : l'IA travaille dans la box, rien n'en sort."""
import math, sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

POLICE = "/usr/share/fonts/Adwaita/AdwaitaSans-Regular.ttf"
MARINE, BLEU, CLAIR = "#14274e", "#2f74d0", "#e8edf4"

def chemin_texte(texte, graisse, x0, ligne, corps, approche=0):
    f = instantiateVariableFont(TTFont(POLICE), {"wght": graisse})
    gs, cmap, hmtx = f.getGlyphSet(), f.getBestCmap(), f["hmtx"]
    echelle = corps / f["head"].unitsPerEm
    pen = SVGPathPen(gs); x = x0
    for c in texte:
        g = cmap[ord(c)]
        gs[g].draw(TransformPen(pen, (echelle, 0, 0, -echelle, x, ligne)))
        x += hmtx[g][0] * echelle + approche
    return pen.getCommands(), x

def symbole(cx, cy, r, trait, couleur_box, couleur_ia):
    sommet = lambda a: (cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a)))
    hexa = " ".join(f"{x:.2f},{y:.2f}" for x, y in map(sommet, (-90, -30, 30, 90, 150, 210)))
    branches, noeuds, aretes = [], [], []
    for a in (210, -30, 90):            # les trois arêtes intérieures du cube
        x, y = sommet(a); k = 0.5
        aretes.append(f'<line x1="{cx}" y1="{cy}" x2="{x:.2f}" y2="{y:.2f}"/>')
        bx, by = cx + (x - cx) * k, cy + (y - cy) * k
        branches.append(f'<line x1="{cx}" y1="{cy}" x2="{bx:.2f}" y2="{by:.2f}"/>')
        noeuds.append(f'<circle cx="{bx:.2f}" cy="{by:.2f}" r="{trait*0.78:.2f}"/>')
    return (f'<polygon points="{hexa}" fill="none" stroke="{couleur_box}" stroke-width="{trait}" stroke-linejoin="round"/>'
            f'<g stroke="{couleur_box}" stroke-width="{trait*0.5:.2f}" stroke-linecap="round">{"".join(aretes)}</g>'
            f'<g stroke="{couleur_ia}" stroke-width="{trait*0.7:.2f}" stroke-linecap="round">{"".join(branches)}</g>'
            f'<g fill="{couleur_ia}">{"".join(noeuds)}<circle cx="{cx}" cy="{cy}" r="{trait*1.15:.2f}"/></g>')

def logo(fond_sombre=False):
    nom = CLAIR if fond_sombre else MARINE
    ia = "#6aa8f0" if fond_sombre else BLEU
    sym = symbole(50, 50, 40, 7, nom, ia)
    a, x = chemin_texte("asoter", 500, 106, 69, 54, -0.4)
    b, x = chemin_texte("IA", 700, x + 1, 69, 54, 0.6)
    largeur = math.ceil(x + 6)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largeur} 100" width="{largeur*4}" height="400" role="img" aria-label="asoterIA">'
            f'<title>asoterIA</title>{sym}<path fill="{nom}" d="{a}"/><path fill="{ia}" d="{b}"/></svg>')

def icone(fond_sombre=False):
    nom = CLAIR if fond_sombre else MARINE
    ia = "#6aa8f0" if fond_sombre else BLEU
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="512" height="512" role="img" aria-label="asoterIA">'
            f'<title>asoterIA</title>{symbole(50, 50, 42, 8, nom, ia)}</svg>')

sortie = sys.argv[1]
for nom, contenu in (("asoteria-logo.svg", logo()), ("asoteria-logo-sombre.svg", logo(True)),
                     ("asoteria-icone.svg", icone()), ("asoteria-icone-sombre.svg", icone(True))):
    open(f"{sortie}/{nom}", "w").write(contenu)
