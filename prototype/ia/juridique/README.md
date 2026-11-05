# Pack juridique (DEV-2)

Codes, lois et jurisprudence français sur la box, interrogés par l'assistant IA **câble débranché**. En option, recherche en ligne dans les API officielles Légifrance et Judilibre.

**Statut** : branche `dev2-juridique`, **pas dans la démo du 6 novembre**. La décision du 3 novembre (`docs/prototype.md`, section 3) tient tant que l'équipe ne l'a pas changée : voir la section 8 du README.

## Ce que l'assistant reçoit

Pour une question juridique, en plus des extraits des documents du cabinet, au plus 4 extraits (`IA_EXTRAITS_JURIDIQUES`), choisis dans cet ordre :

1. les **références de la question** : « article 1240 du Code civil », « art. L. 1234-9 C. trav. », « l'article 2234 du même code », « article 37 de la loi n° 91-647 », « pourvoi n° 24-17.384 », ECLI ;
2. les **articles cités dans les pièces du dossier** retenues pour la réponse (conclusions, assignation) ;
3. une **recherche plein texte** (FTS5, BM25) dans les articles en vigueur, reclassée par le sens si un modèle d'embeddings est actif (vecteurs gardés dans `sortie/ia/juridique-vecteurs.sqlite`) ;
4. les **décisions qui appliquent** ces articles (liens officiels, sommaires et visas des décisions), les publiées d'abord, puis une recherche plein texte dans la jurisprudence ;
5. en option, la **recherche en ligne**, si rien n'est trouvé sur la box ou si la question porte sur ce qui est récent.

Chaque extrait dit d'où il vient et quelle version il donne : « Texte de loi : Code civil, article 1240 (version en vigueur depuis le 1er octobre 2016) », ou « version applicable au 1er janvier 2015 » quand la question donne une date (« en vigueur au… », « applicable en… »). Toutes les versions des articles sont gardées : on peut répondre pour la date des faits, pas seulement pour aujourd'hui. Pour une décision : son intitulé officiel, sa solution, et son sommaire officiel, ou à défaut le passage de la motivation le plus proche de la question.

La consigne du modèle (`assistant/consignes.py`, règles 7 à 9) l'oblige à nommer le code et l'article, à reprendre la version indiquée, à présenter une décision comme l'application d'une règle à un cas, et à séparer les textes des documents du dossier. Dans l'interface, chaque source juridique a un lien « Lire le texte » (page servie par la box, hors ligne, avec toutes les versions de l'article) et un lien Légifrance.

## Données

Archives ouvertes de la DILA, licence ouverte Etalab ([`docs/sources.md`](../../../docs/sources.md), S23, S24, S26) :

| Fonds | Contenu | Archive complète (13 juillet 2025) |
|---|---|---|
| LEGI | Codes, lois et règlements consolidés, une version d'article par fichier | 1,1 Go |
| CASS | Cour de cassation, arrêts publiés au Bulletin | 248 Mo |
| INCA | Cour de cassation, arrêts non publiés | 655 Mo |
| CAPP | Cours d'appel (sélection) | 279 Mo |
| JADE | Conseil d'État, cours administratives d'appel, tribunaux administratifs | 1,2 Go |

Puis une archive de modifications par jour ouvré, avec la liste des éléments supprimés. Les archives sont lues en flux et supprimées une fois importées. Sont gardés : les articles des codes et des textes en vigueur, avec toutes leurs versions (`--non-vigueur` pour ajouter les codes abrogés).

## Commandes

```bash
cd prototype/plateforme
./box.sh juridique etat                        # contenu de la base
./box.sh juridique mettre-a-jour               # télécharge et importe (LEGI d'abord, puis CASS INCA CAPP JADE)
./box.sh juridique mettre-a-jour LEGI CASS     # seulement certains fonds
./box.sh juridique importer                    # archives copiées à la main dans sortie/juridique/archives/
./box.sh juridique en-ligne activer            # recherche en ligne (identifiants PISTE dans .env)
./box.sh juridique en-ligne desactiver
```

Sans la box, depuis `prototype/ia` : `JURIDIQUE_BASE=/chemin/base.sqlite python3 -m juridique chercher "Que dit l'article 1240 du Code civil ?"` affiche les extraits que recevrait le modèle. `python3 -m juridique article 1240 "code civil" 2015-01-01` affiche une version et la liste des versions.

## Connexions sortantes

- **Mise à jour** (`juridique-maj`, outil ponctuel sur le réseau `sortie` seulement, il ne voit aucun service de la box) : HTTPS vers `echanges.dila.gouv.fr`, lancée par un administrateur, inscrite au journal (`sortie/journal/juridique.jsonl`) au début puis à la fin avec le nombre d'archives.
- **Recherche en ligne** (`juridique-en-ligne`, profil Compose du même nom, désactivé par défaut) : l'assistant reste sur le réseau interne et envoie à la passerelle une requête construite sans les noms propres, les numéros de dossier, les adresses et les téléphones (`recherche.requete_publique`). Jamais un document du cabinet. La passerelle inscrit chaque appel au journal, avec le texte exact envoyé et la personne. Identifiants : créer une application sur [PISTE](https://piste.gouv.fr), y souscrire aux API Légifrance et Judilibre, puis renseigner `PISTE_CLIENT_ID`, `PISTE_CLIENT_SECRET` et `PISTE_CLE_API` dans `.env` (`PISTE_ENVIRONNEMENT=bac_a_sable` pour essayer).

## Fichiers

| Fichier | Rôle |
|---|---|
| `dila.py` | Lecture des archives (XML LEGI, JURI judiciaire et administratif), import, suppressions |
| `base.py` | Base SQLite : articles et versions, décisions, numéros, citations, index plein texte |
| `references.py` | Repérage des références (articles, codes, abréviations, lois, pourvois, ECLI) |
| `recherche.py` | Choix des extraits pour une question, date applicable, requête publique, reclassement par le sens |
| `telechargement.py` | Mise à jour depuis la DILA (archives à importer, journal) |
| `en_ligne.py` | Client PISTE (Légifrance, Judilibre) et passerelle |
| `journal.py` | Journal d'audit du pack, même format que les autres |
| `tests.py` | `python3 -m unittest juridique.tests` (archive au format DILA ; décision de test fictive) |

## Mesures

Mesuré le 5 novembre 2026 sur le portable de démo (16 Go, sans GPU), hors de la box (Python 3, un cœur) :

| Mesure | Résultat |
|---|---|
| Import de l'archive complète LEGI (13 juillet 2025, 1,1 Go) | **15 min 30 s** ; 1 393 793 versions d'articles, 78 codes, 111 732 textes |
| Taille de la base après cet import | **3,3 Go** (index plein texte compris) |
| Recherche pour une question (sans modèle d'embeddings) | 0,35 s en moyenne, 0,9 s au plus |
| Article attendu donné au modèle ([`evaluation/questions_juridiques.json`](../evaluation/questions_juridiques.json)) | **7 sur 10** : 4 sur 4 quand la question cite l'article, 3 sur 6 quand elle est posée en langage courant |

Manqués en langage courant : la durée du bail commercial (L145-4 absent, articles voisins donnés), le délai de rétractation à distance (L221-20 et L221-21 donnés, pas L221-18), le délai d'appel (articles 906 et 916 donnés, pas 538). Pistes : reclassement par le sens (non mesuré, faute de temps), synonymes du vocabulaire juridique. Les questions de test ont été écrites par l'agent IA : à remplacer par les questions des pilotes.

Non mesuré à ce jour : import de la jurisprudence (archives CASS et CAPP téléchargées, import lancé le 5 novembre), archives quotidiennes depuis juillet 2025, qualité des réponses rédigées par le modèle.

## Limites connues

- **Client en ligne non testé avec un vrai compte PISTE** : écrit d'après les exemples officiels de l'API Légifrance et la spécification OpenAPI de Judilibre, et testé contre un faux serveur qui suit leur format. À valider sur le bac à sable avant la mise en service.
- Les noms de codes sont reconnus contre ceux de la base : une référence à un code absent, ou une abréviation inconnue, est ignorée plutôt que mal résolue.
- La recherche plein texte compare des mots (préfixes, sans accents), pas des notions : « rupture du contrat de travail » ne trouve pas « licenciement ». Le reclassement par le sens n'agit que sur les 20 premiers résultats.
- Le fonds CAPP ne contient qu'une partie des décisions des cours d'appel. Judilibre (en ligne) en publie aussi.
- La qualité de la réponse dépend du modèle : un petit modèle sur processeur peut mal résumer une décision longue. Évaluer avec des questions réelles des pilotes avant de le promettre.
