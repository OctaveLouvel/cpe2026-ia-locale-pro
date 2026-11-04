# Logo asoterIA

Dessiné par l'équipe le 4 novembre 2026, en SVG, sans outil en ligne. Il dit ce que fait la box :

- **un cube**, vu de trois quarts : la box posée dans le cabinet ;
- **un petit réseau de neurones en son centre**, en bleu : l'assistant IA qui tourne dans la box ;
- le réseau **ne touche pas les bords** du cube : l'IA travaille à l'intérieur, rien ne sort.

Le nom suit : « asoter » en bleu marine, « IA » en bleu et en gras.

| Fichier | Usage |
|---|---|
| `asoteria-logo.svg` / `.png` | Sur fond clair : slides, executive summary, documents |
| `asoteria-logo-sombre.svg` / `.png` | Sur fond sombre (en-têtes du tableau de bord et de la landing page) |
| `asoteria-icone.svg` / `.png` | Cube seul : favicon, avatar, petits formats |
| `asoteria-icone-sombre.svg` | Cube seul sur fond sombre |
| `generer_logo.py` | Script qui produit tous les SVG : modifier les couleurs ou les proportions ici, puis relancer |

Régénérer : `python3 generer_logo.py .` (demande `fonttools`), puis les PNG avec `rsvg-convert -w 2000 asoteria-logo.svg -o asoteria-logo.png`.

Règles d'usage :
- Écrire le nom **asoterIA** : « asoter » en minuscules, « IA » en majuscules, en un seul mot.
- Ne pas déformer le logo, laisser autour au moins la moitié de la hauteur du cube.
- Couleurs : bleu marine `#14274e` (cube, « asoter »), bleu `#2f74d0` (réseau, « IA ») ; sur fond sombre, `#e8edf4` et `#6aa8f0`.
- Police du nom : Adwaita Sans (licence SIL Open Font License 1.1, dérivée d'Inter), convertie en tracés : le SVG s'affiche pareil partout, sans police installée.

Les propositions faites sur Canva le même jour (non retenues) restent dans le compte Canva de l'équipe.
