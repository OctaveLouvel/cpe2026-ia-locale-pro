# Assistant IA du cabinet (DEV-2)

Un assistant qui répond aux questions sur les dossiers, l'agenda et les contacts du cabinet, **à partir des seuls documents que la personne connectée a le droit de voir**, en **citant ses sources** (document, page, article), sans jamais accéder au coffre-fort de mots de passe, et sans qu'aucune donnée ne sorte de la box.

Il fonctionne avec la plateforme de DEV-1 ([`../plateforme/`](../plateforme/)) : deux services Docker sur le réseau interne, sans accès à internet.

| Service | Rôle |
|---|---|
| `assistant` | Service maison (ce dossier) : connexion, recherche avec les droits, citations, journal, interface web |
| `ia-moteur` | Moteur d'inférence local Ollama : rédaction des réponses et recherche par le sens |
| `ia-telechargeur` | Téléchargement des modèles, seul conteneur IA relié à internet |

## Lancer

```bash
cd prototype/plateforme
./box.sh installer --demo   # toute la box, assistant compris, avec le cabinet fictif
# puis choisir et installer le modèle sur https://ia.cabinet.localhost/modeles
```

Puis ouvrir https://ia.cabinet.localhost et se connecter avec un compte du cabinet fictif (mot de passe : `DEMO_MOT_DE_PASSE` dans `plateforme/.env`).

Aucun modèle n'est imposé : on le choisit sur la page « Modèles d'IA » (section suivante). Le choix pour la démo dépend des mesures de la section « Mesures ».

## Choisir et installer un modèle

**Par l'interface** : https://ia.cabinet.localhost/modeles (lien « Modèles d'IA » dans l'assistant, bouton « Choisir le modèle » sur le portail), réservée aux administrateurs du cabinet (groupes Nextcloud `admin` et `associes`). Pour chaque modèle du catalogue : taille, mémoire estimée par rapport à celle de la machine, état (installé, actif) et boutons « Installer » (barre de progression), « Activer », « Supprimer ». Le changement de modèle se fait à chaud, sans redémarrer la box.

**En ligne de commande**, même fonctionnement :

```bash
./box.sh ia                       # menu : taper le numéro du modèle voulu
./box.sh ia liste | installer <id> | activer <id> | supprimer <id>
```

Le catalogue est [`modeles.json`](modeles.json) : ajouter une ligne suffit pour proposer un autre modèle de la bibliothèque Ollama.

**Conteneurisation** :

| Conteneur | Rôle | Réseaux |
|---|---|---|
| `ia-moteur` (Ollama) | fait tourner le modèle actif | interne seulement : aucun accès à internet |
| `ia-telechargeur` (Ollama) | télécharge et supprime les modèles dans le volume partagé, sur ordre d'un administrateur ; chaque téléchargement est inscrit au journal | interne et `sortie` (internet) |
| `assistant` | recherche, droits, citations, interfaces | interne seulement |

Seul Colibri tourne hors conteneur (`./box.sh moteur-ia demarrer`), en écoute sur le réseau interne uniquement ; une fois démarré, il apparaît comme installé sur la page et s'active comme les autres. Le choix courant est enregistré dans `plateforme/sortie/ia/moteur.json`.

## Comment l'assistant respecte les droits

L'assistant n'a **aucun compte privilégié**. Tout passe par les droits de la personne connectée :

1. À la connexion, son mot de passe est vérifié par Nextcloud puis échangé contre un **mot de passe d'application** révocable (visible dans ses réglages Nextcloud, « Appareils et sessions », révoqué à la déconnexion). Le mot de passe de la personne n'est pas conservé.
2. À chaque question, l'assistant demande à Nextcloud la liste des fichiers que cette personne voit (WebDAV), ses agendas (CalDAV) et ses carnets d'adresses (CardDAV). **Seuls ces éléments peuvent entrer dans la réponse.**
3. L'index de recherche (texte des documents) reste sur la box ; il n'est jamais utilisé sans ce filtre.
4. Un document cité s'ouvre par l'assistant, qui le relit avec les droits de la personne : si son accès a été retiré entre-temps, Nextcloud refuse.
5. Le coffre-fort de mots de passe n'est jamais contacté : l'assistant n'a ni code ni identifiant pour le faire.

## Garde-fous

Avant d'appeler le modèle, trois cas reçoivent une réponse fixe, **sans appel au modèle**, donc sans risque de réponse inventée :

| Cas | Réponse |
|---|---|
| Question sur un mot de passe, le coffre-fort, un code d'accès | « Je n'ai pas accès au coffre-fort de mots de passe… » |
| Un nom propre de la question n'apparaît dans aucun document, agenda ou contact visible | « Je ne trouve aucun élément mentionnant « X » parmi les documents… » Le message ne dit pas si ce nom existe ailleurs dans le cabinet |
| Question sur le cabinet (dossiers, documents, agendas, contacts) et nom propre introuvable | Même réponse fixe ; c'est le refus d'accès de la démo |

Ensuite, le modèle reçoit une consigne stricte ([`assistant/consignes.py`](assistant/consignes.py)) : répondre seulement avec les extraits fournis, citer chaque phrase par son numéro d'extrait, recopier les dates et montants, dire « je ne trouve pas » sinon. Température 0,1 : les réponses varient très peu d'un essai à l'autre.

## Le modèle choisit ses outils (5 novembre, soir)

Plus rien n'est décidé par le code (ni mots-clés, ni réponse toute faite) : le modèle reçoit la question, les trois derniers échanges et cinq outils, appelle ceux qu'il veut, lit les résultats et répond ([`assistant/reponse.py`](assistant/reponse.py), consigne `AGENT` de [`assistant/consignes.py`](assistant/consignes.py)).

| Outil | Ce qu'il fait |
|---|---|
| `chercher_documents` | Recherche dans les documents que la personne voit dans Nextcloud (option : un dossier) |
| `lire_agenda` | Événements de ses agendas entre deux dates |
| `chercher_contacts` | Recherche dans ses carnets d'adresses |
| `proposer_rendez_vous` | Prépare un rendez-vous ; la page affiche la proposition, rien n'est fait avant « Confirmer » |
| `proposer_dossier` | Prépare un dossier dans « Dossiers clients », même principe |

Ce qui reste dans le code est ce qu'on ne peut pas confier au modèle : les **droits** (chaque outil ne voit que ce que Nextcloud montre à la personne), l'**accord** de la personne avant une action, et l'absence de tout outil vers le **coffre-fort**. Les résultats d'outils sont numérotés : le modèle cite ses sources par ces numéros. Sans outil appelé, la page signale « Réponse générale du modèle, sans document source ».

Évaluation du 5 novembre au soir (`evaluation/evaluer_demo.py --essais 1`, `qwen3:4b-instruct`, portable de démo) : **refus Lefort et coffre-fort réussis** (rédigés par le modèle) ; clause Garnier juste, un détail manquant (délai de 15 jours) ; résumé Fournil et charte sur l'IA ratés (le modèle n'a pas cité les documents, ou n'a pas appelé la recherche). Premier mot de 28 s à 197 s : plusieurs tours d'outils sur processeur. Un modèle plus gros ferait mieux ; c'est un prototype.

## Recherche

- Documents découpés en extraits d'environ 130 mots, **en suivant les articles** (« Article 12 - Clause de non-concurrence », sous-clauses 12.1 à 12.5) pour citer un article et sa page. Un article coupé en plusieurs extraits est donné en entier au modèle.
- Recherche par mots (BM25, sans dépendance) et, si un modèle d'embeddings est disponible, par le sens ; fusion des deux classements.
- Un dossier cité dans la question (« dossier Garnier », « 2026-014 »), ou choisi dans la liste de l'interface, limite la recherche à ce dossier. Sans dossier, la réponse le signale : « Recherche dans tous vos documents ».
- Pour un résumé de dossier : la **fiche de chaque pièce** (section suivante), donc toutes les pièces, plus les 5 prochaines échéances de l'agenda pour ce dossier. Une pièce dont la fiche n'est pas encore prête est représentée par son meilleur extrait.
- **Budget de contexte** : si la consigne, les extraits et la réponse attendue (`IA_GENERATION_MAX`) dépassent le contexte du modèle (`IA_CONTEXTE`), les extraits les moins pertinents sont retirés, et la réponse le dit (« 2 extraits écartés faute de place »).
- **Réponse coupée** : si le modèle s'arrête sur la limite de longueur, la réponse l'indique au lieu de paraître complète.

## Fiches préparées à l'avance

Pour qu'un résumé ne laisse pas de pièce de côté, l'assistant prépare en tâche de fond ([`assistant/fiches.py`](assistant/fiches.py)), **seulement pour les dossiers dont on a besoin** :

- la **fiche de chaque pièce** des dossiers clients (répertoire `Dossiers clients`, réglable avec `IA_FICHES_RACINES`) : 3 à 6 points (nature et date, auteur, objet, montants, délais), rédigés par le modèle local à partir du texte complet du document ;
- la **fiche de chaque dossier** : objet et parties, faits, procédure, montants, rédigée à partir des fiches de ses pièces, avec les numéros des pièces citées. Elle s'affiche **tout de suite** quand on choisit le dossier dans la liste, sans attendre le modèle. Les échéances affichées à côté sont lues dans l'agenda de la personne à ce moment-là, sans passer par le modèle.

Droits : une fiche de pièce n'entre dans une réponse que si la personne voit la pièce. Une fiche de dossier n'est montrée que si la personne voit **exactement** les pièces dont elle a été tirée : sinon elle pourrait révéler une pièce cachée. **Mise à jour** : quand quelqu'un ouvre l'assistant (chargement de la liste des dossiers) ou pose une question, l'assistant compare ce que Nextcloud lui montre avec l'index. Une pièce ajoutée ou modifiée est indexée, puis sa fiche est préparée et celle du dossier refaite. Une pièce supprimée sort de l'index, et la fiche du dossier est refaite sans elle. L'assistant n'a pas de compte qui surveille Nextcloud (aucun compte privilégié) : une pièce ajoutée la nuit est prise en compte à la première ouverture du matin. Testé le 5 novembre (ajout puis suppression d'un fichier fictif dans le dossier Fournil) et par `tests/test_fiches.py`. Les fiches sont dans `plateforme/sortie/ia/fiches.json`, sur la box.

**À la demande** : rien n'est préparé à l'avance. Un dossier devient « suivi » la première fois que quelqu'un le choisit dans la liste ou pose une question qui le concerne. Ses fiches se préparent alors en tâche de fond, puis restent à jour. La réponse du moment utilise les extraits, comme avant ; les suivantes utilisent les fiches. Un dossier jamais ouvert ne coûte rien. **Pour la démo** : ouvrir une fois chaque dossier montré, la veille, puis `./box.sh fiches-ia` pour attendre la fin. Choix fait le 5 novembre : préparer tout le cabinet à l'avance coûtait environ une minute par pièce, y compris pour des dossiers que personne n'ouvre.

Le moteur ne traite qu'une génération à la fois : une fiche ne commence que si personne n'a posé de question depuis 20 s, et elle est abandonnée dès qu'une question arrive (la question attend au plus la fin de la lecture en cours, environ 5 s). Durée mesurée le 5 novembre avec Colibri : environ une minute par pièce, une dizaine de minutes pour un dossier de 10 pièces. Suivre la préparation des dossiers suivis : `./box.sh fiches-ia`. Vérifier qu'aucune fiche n'invente un chiffre : `python3 prototype/ia/evaluation/verifier_fiches.py` (chaque date, montant et nombre d'une fiche doit se trouver dans sa source).
- Formats lus : PDF (avec les pages), DOCX (avec les titres de section), texte.
- **PDF aux mots collés** : dans certains PDF (souvent ceux avec des tableaux), les mots ne sont séparés que par leur position, et pypdf rend « Restedûcumulé » ou « 340000euros ». La recherche par mots ne les trouve plus. Constaté le 5 novembre sur 3 pièces de démo, dont le décompte locatif du dossier Fournil : c'est pourquoi le reste dû de 5 500 euros n'apparaissait jamais dans le résumé. Une page dont plus de 2 % des mots font 18 caractères ou plus est relue avec pdfminer.six, qui retrouve les espaces (mais lit les tableaux colonne par colonne). Changer `extraction.VERSION` fait relire tous les documents et refaire leurs fiches.

## Journal d'audit

Chaque connexion et chaque question sont inscrites dans `plateforme/sortie/journal/assistant.jsonl` : date, personne, question, sources citées, durée, refus éventuel. Chacun peut voir ce qui a été tracé pour son compte (« Ce qui a été tracé » dans l'interface). Le journal contient le texte des questions : il reste sur la box.

## API, pour le tableau de bord (DEV-3)

| Route | Rôle |
|---|---|
| `GET /` | Interface de conversation (une page, aucune ressource externe) |
| `GET /api/etat` | Modèle, nombre de documents indexés, prêt ou non, progression des fiches (sans connexion) |
| `POST /api/connexion` `{login, mot_de_passe}` | Ouvre une session (cookie `session`, HttpOnly) |
| `POST /api/question` `{question, dossier}` | Réponse au fil de l'eau (`text/event-stream`) : événements `etape`, `texte`, `fin` (sources, durée, mesures dont `coupee`, `couverture` : pièces du dossier lues, citées ou non lues, `perimetre`), `erreur`. `dossier` (facultatif) : nom d'un dossier de `/api/dossiers` |
| `GET /api/dossiers` | Dossiers clients visibles par la personne, nombre de pièces, fiche prête ou non |
| `GET /api/dossier?nom=…` | Fiche du dossier (si à jour et autorisée), échéances de l'agenda, pièces avec leur fiche. Aucun appel au modèle. Inscrit au journal |
| `GET /api/document/<fileid>` | Document cité, relu avec les droits de la personne ; ajouter `#page=N` |
| `GET /api/journal` | Entrées du journal pour la personne connectée |
| `POST /api/deconnexion` | Ferme la session et révoque le mot de passe d'application |

Les scripts peuvent aussi s'authentifier en `Basic` avec un compte Nextcloud.

## Mesures

Banc de mesure : [`mesures/mesurer_modeles.py`](mesures/mesurer_modeles.py), 5 questions types sur le jeu de données fictif ([`mesures/questions.json`](mesures/questions.json)) : résumé de dossier, recherche de clause, raisonnement sur un délai, question sans réponse dans les extraits, échéances. La qualité est mesurée : part des faits attendus présents dans la réponse, 0 si la réponse contient un fait interdit (un montant inventé par exemple). Résultats dans [`docs/prototype.md`](../../docs/prototype.md), section 5.

## Autre moteur : Colibri

`IA_MOTEUR=openai` et `IA_MOTEUR_URL` permettent d'utiliser un serveur compatible OpenAI, comme [Colibri](https://github.com/JustVugg/colibri), qui fait tourner de gros modèles « à experts » (Qwen3.6-35B-A3B) en lisant une partie du modèle sur le disque. Sur processeur seul, mesuré inutilisable sur le portable de démo (16 Go). Avec la carte graphique (Vulkan) et un contexte de 4 096 tokens, mesuré le 5 novembre : environ 35 s jusqu'au premier mot sur les questions de la démo (section 5 de `docs/prototype.md`).

Installation sur le portable de démo (Colibri 2.1.0, modèle de 23 Go, environ 26 Go de disque libre nécessaires) :

```bash
git clone --depth 1 --branch v2.1.0 https://github.com/JustVugg/colibri.git ~/colibri
hf download Kreuzzelg/qwen36-35b-a3b-colibri-i4-gs64 --local-dir ~/Models/qwen36_i4_gs64
# Moteur avec Vulkan, sans droits administrateur : en-têtes Vulkan et glslc extraits des paquets Debian.
mkdir -p ~/vkdev/deb && cd ~/vkdev/deb && apt-get download libvulkan-dev glslc libshaderc1
for f in *.deb; do dpkg-deb -x "$f" ~/vkdev/root; done
cd ~/colibri/c && LD_LIBRARY_PATH=~/vkdev/root/usr/lib/x86_64-linux-gnu C_INCLUDE_PATH=~/vkdev/root/usr/include \
    make qwen36 ARCH=native VK=1 GLSLC=~/vkdev/root/usr/bin/glslc
```

Puis dans `plateforme/.env` : `COLIBRI_DIR` et `COLIBRI_MODELE` (chemins complets, sans `~`), `COLIBRI_VULKAN=1`, `COLIBRI_CTX=4096`, `COLIBRI_STREAM_ROWS=2`, et `./box.sh moteur-ia demarrer`. L'archive précompilée de la version 2.1.0 demande glibc 2.43 et ne démarre pas sur Debian 13.

Ce que fait Colibri, et pourquoi ces réglages (journal `plateforme/sortie/ia/colibri.log`, 5 novembre) :

- **Seuls les experts utilisés sont chargés, et ça fonctionne sur le portable de démo.** Le modèle fait 23 Go. Le moteur occupe 2,9 Go de mémoire vive et 4,4 Go sur la carte graphique. Les 1 473 experts les plus utilisés (sur 10 240) restent sur la carte. Ils couvrent 87 à 88 % des appels aux experts sur une question complète. Les autres sont relus sur le SSD (environ 2,6 Go/s).
- **Ce qui coûtait du temps, c'est la lecture de la question (prefill).** Par défaut, un expert absent de la carte n'y est envoyé que s'il traite au moins 16 lignes du texte. Sinon le processeur le calcule, à environ 1,3 ms par ligne. Sur la question 1, une soixantaine d'experts par couche (460 à 780 lignes) restaient sur le processeur à chaque étape de lecture. Avec `COLIBRI_STREAM_ROWS=2` (variable `COLI_VK_TIER_STREAM_ROWS` de Colibri), il en reste 4 à 9 par couche : premier mot de la question 1 en 25 s au lieu de 67 s, réponse complète en 51 s au lieu de 114 s. Même résultat sur la grille d'évaluation.
- **Lancement en service utilisateur systemd** (`box-colibri`, voir `systemctl --user status box-colibri`). Lancé avec `setsid` depuis un terminal, Colibri restait dans le groupe de processus (cgroup) de la fenêtre. Le 5 novembre à 15h07, la fin de la session ouverte dans cette fenêtre l'a arrêté en pleine réponse, et l'assistant l'affichait toujours comme actif. Le service est relancé tout seul s'il s'arrête sur une erreur (`Restart=on-failure`), et le journal précédent est gardé dans `colibri.log.1`.
- **La carte graphique qui « cesse de répondre ».** Colibri considère la carte comme perdue dès qu'un calcul dépasse 10 s (délai fixé dans son code), puis continue sur le processeur seul (plusieurs minutes par question). C'est arrivé le 5 novembre après 4 ou 5 questions, sans erreur du pilote dans le journal du noyau. À ce moment-là, Colibri occupait 5,85 Go des 6,1 Go de la carte, et ses tampons grossissaient d'environ 20 Mo à chaque question. **HYPOTHÈSE** : la carte pleine, le pilote déplace de la mémoire vers la RAM et les calculs ralentissent au-delà de 10 s. Deux réponses : `COLIBRI_RESERVE_GO=1.5` laisse 1,5 Go libre au lieu de 1 (1 171 experts sur la carte au lieu de 1 473 ; 9 questions de suite sans incident ensuite, pic à 5,5 Go). Et une garde (`box-colibri-garde`) qui relance Colibri dès que le message apparaît dans le journal (testée : relancé et de nouveau prêt en moins d'une minute).

## Limites connues

- **Modèle** : `qwen3:4b` de la bibliothèque Ollama est la version « thinking » (juillet 2025) ; même avec `think: false`, il écrit son raisonnement en anglais dans la réponse. C'était la cause des réponses en boucle. La démo utilise `qwen3:4b-instruct`. Évaluation du 5 novembre avec ce modèle (`evaluation/evaluer_demo.py --essais 1`) : refus Q3a et Q3b réussis ; Q1, Q2 et Q4 justes sur le fond mais incomplets selon les critères (montant de 5 500 € absent, contrat de travail non cité, assistant interne non mentionné). Premier mot entre 19 et 47 s sur le portable de démo.
- Une réponse générale peut contenir une erreur (le modèle a cité une loi de 1956 pour la SCI) : elle est signalée comme telle, à vérifier.

- La recherche par le sens demande le modèle d'embeddings ; sans lui, la recherche se fait par mots, ce qui suffit pour les questions de la démo.
- L'index contient le texte de tous les documents consultés par au moins une personne : il est protégé comme les données (disque de la box), et filtré à chaque question.
- Le coffre-fort est sur le même réseau Docker interne que l'assistant : l'isolement repose sur l'absence de code et d'identifiants. DEV-4 peut le placer sur un réseau séparé pour le rendre impossible par construction.
- Pack métier (textes de loi en données ouvertes) : dans la roadmap, voir `docs/prototype.md`, section 3.
