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
| Aucun extrait pertinent | « Je ne trouve pas cette information dans les documents auxquels vous avez accès. » |

Ensuite, le modèle reçoit une consigne stricte ([`assistant/consignes.py`](assistant/consignes.py)) : répondre seulement avec les extraits fournis, citer chaque phrase par son numéro d'extrait, recopier les dates et montants, dire « je ne trouve pas » sinon. Température 0,1 : les réponses varient très peu d'un essai à l'autre.

## Recherche

- Documents découpés en extraits d'environ 130 mots, **en suivant les articles** (« Article 12 - Clause de non-concurrence », sous-clauses 12.1 à 12.5) pour citer un article et sa page. Un article coupé en plusieurs extraits est donné en entier au modèle.
- Recherche par mots (BM25, sans dépendance) et, si un modèle d'embeddings est disponible, par le sens ; fusion des deux classements.
- Un dossier cité dans la question (« dossier Garnier », « 2026-014 ») limite la recherche à ce dossier.
- Pour un résumé : une pièce par document, en priorité les pièces de synthèse (notes, conclusions, assignations, décomptes) et leurs sections de faits, plus les 5 prochaines échéances de l'agenda pour ce dossier.
- Formats lus : PDF (avec les pages), DOCX (avec les titres de section), texte.

## Journal d'audit

Chaque connexion et chaque question sont inscrites dans `plateforme/sortie/journal/assistant.jsonl` : date, personne, question, sources citées, durée, refus éventuel. Chacun peut voir ce qui a été tracé pour son compte (« Ce qui a été tracé » dans l'interface). Le journal contient le texte des questions : il reste sur la box.

## API, pour le tableau de bord (DEV-3)

| Route | Rôle |
|---|---|
| `GET /` | Interface de conversation (une page, aucune ressource externe) |
| `GET /api/etat` | Modèle, nombre de documents indexés, prêt ou non (sans connexion) |
| `POST /api/connexion` `{login, mot_de_passe}` | Ouvre une session (cookie `session`, HttpOnly) |
| `POST /api/question` `{question}` | Réponse au fil de l'eau (`text/event-stream`) : événements `etape`, `texte`, `fin` (sources, durée, mesures), `erreur` |
| `GET /api/document/<fileid>` | Document cité, relu avec les droits de la personne ; ajouter `#page=N` |
| `GET /api/journal` | Entrées du journal pour la personne connectée |
| `POST /api/deconnexion` | Ferme la session et révoque le mot de passe d'application |

Les scripts peuvent aussi s'authentifier en `Basic` avec un compte Nextcloud.

## Mesures

Banc de mesure : [`mesures/mesurer_modeles.py`](mesures/mesurer_modeles.py), 5 questions types sur le jeu de données fictif ([`mesures/questions.json`](mesures/questions.json)) : résumé de dossier, recherche de clause, raisonnement sur un délai, question sans réponse dans les extraits, échéances. La qualité est mesurée : part des faits attendus présents dans la réponse, 0 si la réponse contient un fait interdit (un montant inventé par exemple). Résultats dans [`docs/prototype.md`](../../docs/prototype.md), section 5.

## Autre moteur : Colibri

`IA_MOTEUR=openai` et `IA_MOTEUR_URL` permettent d'utiliser un serveur compatible OpenAI, comme [Colibri](https://github.com/JustVugg/colibri), qui fait tourner de gros modèles « à experts » (Qwen3.6-35B-A3B) en lisant une partie du modèle sur le disque. Mesuré le 3 novembre sur le portable de démo (16 Go) : **inutilisable pour la démo** (voir la section 5 de `docs/prototype.md`). À réessayer sur une box avec au moins 32 Go de mémoire.

## Limites connues

- La recherche par le sens demande le modèle d'embeddings ; sans lui, la recherche se fait par mots, ce qui suffit pour les questions de la démo.
- L'index contient le texte de tous les documents consultés par au moins une personne : il est protégé comme les données (disque de la box), et filtré à chaque question.
- Le coffre-fort est sur le même réseau Docker interne que l'assistant : l'isolement repose sur l'absence de code et d'identifiants. DEV-4 peut le placer sur un réseau séparé pour le rendre impossible par construction.
- Pack métier (textes de loi en données ouvertes) : dans la roadmap, voir `docs/prototype.md`, section 3.
