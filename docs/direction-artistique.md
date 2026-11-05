# Direction artistique asoterIA

Responsable : DEV-3 (interface et vitrine). Rédigée le 4 novembre 2026. S'applique au tableau de bord, à l'assistant, à la landing page, à l'installeur, à l'executive summary et aux slides.

## 1. Idée

Le logo est un cube, la box, avec un petit réseau de neurones en son centre. Tout part de là :

- **deux couleurs** : le marine du cube et le bleu du réseau. Le marine structure, le bleu signale l'IA et reste rare ;
- **beaucoup de blanc**, des filets fins, aucune ombre, aucun dégradé ;
- **des pages calmes** : un titre, ce qu'on peut faire, l'état réel. Pas de bandeau coloré en haut des pages.

La sécurité se montre, elle ne se proclame pas. Le journal d'audit, les sources citées, l'état des sauvegardes la prouvent. Inutile de l'écrire sur chaque écran.

## 2. Couleurs

| Rôle | Clair | Sombre | Usage |
|---|---|---|---|
| Marine (`--accent`) | `#14274e` | `#c9d8f0` | Titres, boutons principaux, liens, cube du logo |
| Bleu IA (`--bleu`) | `#2f74d0` | `#6aa8f0` | Ce qui vient de l'assistant (sources, réseau du logo, « IA »), focus. Une touche par écran au plus |
| Fond (`--fond`) | `#f6f7f9` | `#0c1220` | Fond des pages |
| Surface (`--carte`) | `#ffffff` | `#131b2b` | Cartes, en-têtes |
| Filet (`--bord`) | `#e3e7ed` | `#243048` | Bordures de 1 px |
| Texte (`--texte`) | `#1b2333` | `#e8edf4` | Texte courant |
| Texte secondaire (`--doux`) | `#5f6879` | `#9aa5b8` | Légendes, aides |
| Teinte (`--accent-doux`) | `#eef2f8` | `#1a2438` | Boutons secondaires, bulles de question |
| En service (`--ok`) | `#2e7d57` | `#6cc59a` | États |
| À surveiller (`--attente`) | `#9a6b12` | `#e0b552` | États |
| Hors service (`--ko`) | `#b0414e` | `#ee909b` | États, erreurs |

Les couleurs d'état ne servent qu'aux états, jamais à la décoration.

## 3. Typographie

- Une seule famille, sans empattement : `Inter, "Adwaita Sans", system-ui, sans-serif`. Le nom du logo est en Adwaita Sans, dérivée d'Inter. Aucune police n'est chargée depuis internet : la box fonctionne hors ligne.
- Titres en graisse 600, approche légèrement resserrée (`-0.015em`). Pas de capitales sauf pour les petites étiquettes (0,75 rem, espacées de `0.08em`, texte secondaire).
- Chiffres alignés (`font-variant-numeric: tabular-nums`) dans les tableaux, les heures, les tailles.

## 4. Formes

- Rayons : 10 px pour les cartes, 8 px pour les boutons et les champs, pastilles arrondies.
- Bordures de 1 px en couleur de filet. Au survol, la bordure passe en marine. Pas d'ombre, pas d'effet de soulèvement.
- Icônes au trait (1,8 px), en marine, dans un carré teinté de 40 px.
- En-tête de chaque page : fond surface, filet en bas, logo à gauche (version claire ou sombre selon le thème).

## 5. Logo

Fichiers et règles : [`livrables/logo/`](../livrables/logo/). Il apparaît en tête du tableau de bord, de l'assistant (et de ses pages Modèles et Journal), de l'installeur, de la landing page, de Nextcloud (en-tête, page de connexion), de l'executive summary, et en icône d'onglet partout.

Les pages l'intègrent en `data:` (la box fonctionne hors ligne) et Nextcloud en garde une copie dans `prototype/plateforme/nextcloud/theming/`. Si le logo change, mettre à jour toutes ces copies, puis reconstruire les images de l'assistant et de Nextcloud : un conteneur construit avant le changement garde l'ancien logo.

## 6. Ton

Phrases courtes qui disent **ce que fait l'écran** ou **ce qui s'est passé**.

| Éviter | Préférer |
|---|---|
| « Vos données sont sécurisées », « Aucune donnée ne quitte le cabinet » sur chaque page | Le dire **une fois**, là où c'est la question : la landing page et le pitch |
| « Ce que garantit la box » | Montrer l'état : dernière sauvegarde, connexions sortantes, vérification hors ligne |
| « Sauvegardes chiffrées » comme titre | « Sauvegardes », avec la date de la dernière |
| « Fonctionne sans internet » sous chaque titre | Rien, ou ce que la page permet de faire |
| Superlatifs, « révolutionnaire », « en toute sécurité » | Le fait, avec un chiffre mesuré si on en a un |

Les termes techniques restent dans les pages techniques (installeur, journal), où ils sont utiles.
