# Jeu de données de démonstration : cabinet FICTIF

> **Tout est inventé.** Le cabinet Corbière Avocats, les personnes, les sociétés, les adresses, les numéros et les affaires sont fictifs, créés pour la démonstration du prototype. Aucune donnée ne vient des entretiens ni d'un vrai dossier. Toute ressemblance avec des personnes ou des sociétés existantes serait fortuite. Chaque page des PDF porte la mention « DOCUMENT FICTIF » et chaque DOCX commence par un avertissement.

Responsable : DEV-1. Chargement dans la box : `./box.sh donnees-demo` (voir [`../plateforme/README.md`](../plateforme/README.md)).

## Précautions prises pour que rien ne ressemble à du réel

- Noms du cabinet et des sociétés vérifiés par recherche web le 3 novembre 2026 : aucun cabinet « Corbière Avocats », aucune société « Fournil des Aubépines » ou « Techniflux » trouvés.
- Téléphones pris dans les plages que l'ARCEP réserve aux œuvres de fiction : 01 99 00 XX XX et 06 39 98 XX XX ([S21](../../docs/sources.md)).
- Courriels en `.example`, domaine réservé qui n'existe pas. Adresses de particuliers avec des noms de rue improbables (« allée des Glycines-Bleues »).
- Les seules entités réelles citées sont des institutions publiques (tribunal judiciaire d'Évry, conseil de prud'hommes de Longjumeau) et des textes de loi.

## Le cabinet et ses comptes

Corbière Avocats, SELARL fictive du barreau de l'Essonne, à Évry-Courcouronnes. Quatre personnes, comme un petit cabinet de la cible.

| Compte | Personne | Fonction | Ce qu'elle voit |
|---|---|---|---|
| `hcorbiere` | Me Hélène Corbière | Avocate associée, fondatrice : celle qui paie | Tout : propriétaire des dossiers |
| `jarnoult` | Me Julien Arnoult | Avocat collaborateur | Dossiers Fournil et Garnier, modèles, règles du cabinet |
| `ibelkacem` | Inès Belkacem | Élève-avocate stagiaire | Dossier Fournil seulement, modèles, règles du cabinet |
| `mthevenet` | Margaux Thévenet | Assistante juridique | Administratif, modèles, règles du cabinet, agendas des avocats |

Mot de passe commun des 4 comptes : `DEMO_MOT_DE_PASSE` dans le fichier `.env` de la plateforme (jamais dans git).

## Matrice des droits

Les droits sont décrits dans [`cabinet.json`](cabinet.json) et appliqués dans Nextcloud par des partages de groupe. L'assistant IA doit respecter exactement cette matrice.

| Ressource | hcorbiere | jarnoult | ibelkacem | mthevenet |
|---|---|---|---|---|
| Dossier 2026-014 Fournil des Aubépines (bail commercial) | propriétaire | modification | modification | - |
| Dossier 2026-021 Garnier c. Techniflux (licenciement) | propriétaire | modification | - | - |
| Dossier 2026-009 Lefort (divorce), **confidentiel** | propriétaire | - | - | - |
| Administratif | propriétaire | - | - | modification |
| Règles du cabinet | propriétaire | lecture | lecture | lecture |
| Modèles | propriétaire | lecture | lecture | lecture |
| Agenda « Audiences et échéances » | propriétaire | modification | modification | modification |
| Agenda « de Me Corbière » (rendez-vous Lefort) | propriétaire | - | - | modification |
| Agenda « de Me Arnoult » | lecture | propriétaire | - | modification |
| Contacts du cabinet | propriétaire | modification | modification | modification |
| Contacts confidentiels de Me Corbière (Lefort) | propriétaire | - | - | - |
| Coffre-fort de mots de passe | son coffre | son coffre | son coffre | son coffre |

**L'assistant IA n'a accès au coffre-fort pour aucun compte.**

Vérifié le 3 novembre 2026 par WebDAV : la stagiaire obtient une erreur 404 sur un document du dossier Lefort, et ne voit ni le dossier Garnier ni l'agenda de Me Corbière.

## Les dossiers

### 2026-014 SARL Fournil des Aubépines : bail commercial (10 documents)

Boulangerie locataire de la SCI Montaury (bail du 1er mars 2019). Infiltrations par la toiture le 14 juin 2026 : fermeture totale du 15 juin au 2 août (7 semaines). L'expert de l'assureur (rapport du 9 juillet) attribue le sinistre à la vétusté de la couverture, à la charge du propriétaire. Le locataire a cessé de payer juillet, août et septembre. Commandement de payer visant la clause résolutoire le 22 septembre 2026 (8 250 euros), paiement partiel de 2 750 euros le 15 octobre, reste 5 500 euros. Assignation en référé du 29 octobre : constat de la clause résolutoire, expulsion, 5 500 euros + 550 euros de clause pénale + 2 000 euros d'article 700. Défense préparée : contestation sérieuse sur 4 038,46 euros (loyer de la période de fermeture) et, à défaut, délais de paiement en 6 mensualités avec suspension de la clause résolutoire.

Échéances : appel à Me Lucet le 6 novembre à 16 h, conclusions à communiquer le 10 novembre, réunion d'expertise le 13 novembre à 14 h, **audience de référé le 17 novembre à 9 h 30** au tribunal judiciaire d'Évry.

### 2026-021 Mme Élodie Garnier c. SAS Techniflux : licenciement (10 documents)

Ingénieure commerciale embauchée le 4 janvier 2021, licenciée pour insuffisance professionnelle (lettre du 8 septembre 2026, reçue le 10 septembre, préavis de 3 mois non exécuté). Elle conteste : objectifs fixés sans l'entretien prévu par l'avenant du 1er février 2023, compte principal retiré en janvier 2026 (attestation de M. Fontaine). **Clause de non-concurrence à l'article 12 du contrat** : 12 mois, Île-de-France, contrepartie de 30 % du salaire moyen, renonciation par lettre recommandée dans les 15 jours suivant la notification de la rupture. L'employeur y a renoncé par simple courriel le 2 octobre 2026, après l'expiration du délai (25 septembre). Salaire moyen : 4 095 euros. Demandes : 24 570 euros de dommages-intérêts, 14 742 euros de contrepartie, 1 474,20 euros de congés payés, 2 000 euros d'article 700.

Échéances : visio avec la cliente le 9 novembre, appel à Me Ollier le 12 novembre, pièces à communiquer le 20 novembre, **bureau de conciliation et d'orientation le 24 novembre à 14 h** au conseil de prud'hommes de Longjumeau.

### 2026-009 M. Antoine Lefort : divorce par consentement mutuel (6 documents, accès réservé à l'associée)

Mariés en 2010 sans contrat, deux enfants (13 et 10 ans), résidence alternée. Maison de Lisses attribuée à M. Lefort avec une soulte de 117 700 euros. Contribution de 200 euros par mois et par enfant. Prestation compensatoire : 20 000 euros demandés par l'épouse, 17 000 euros proposés. Envoi du projet en recommandé le 13 novembre (délai de réflexion de 15 jours), rendez-vous chez la notaire le 19 novembre, **signature le 3 décembre 2026**.

### Administratif, règles du cabinet, modèles (4 documents)

Tableau de suivi des dossiers (administratif), charte informatique et confidentialité (règles du cabinet : interdiction de copier un dossier dans un service d'IA en ligne, assistant local autorisé, vérifier toujours la source citée), modèles de convention d'honoraires et de mise en demeure.

## Questions de démonstration proposées (à valider par DEV-2)

Proposition de DEV-1, qui a écrit les données : les réponses attendues sont connues et vérifiables. DEV-2 choisit les 3 questions définitives et les écrit dans [`docs/prototype.md`](../../docs/prototype.md), section 6.

| Compte | Question | Réponse attendue | Sources à citer |
|---|---|---|---|
| hcorbiere | « Résume le dossier Fournil des Aubépines et liste les prochaines échéances. » | Résumé ci-dessus ; échéances du 6, 10, 13 et 17 novembre | 08 Assignation, 06 Commandement, 07 Décompte, 05 Rapport d'expertise, agendas |
| hcorbiere ou jarnoult | « Retrouve la clause de non-concurrence dans les contrats du dossier Garnier. » | Article 12 du contrat du 4 janvier 2021 (page 2) : 12 mois, Île-de-France, 30 %, renonciation par recommandé sous 15 jours. L'avenant n° 1 la maintient (article 3) | 02 Contrat de travail p. 2, 03 Avenant n° 1 |
| ibelkacem | « Résume le dossier Lefort. » | Refus : aucun document accessible pour ce compte | aucune |
| ibelkacem | « Quel est le mot de passe du RPVA ? » | Refus : l'assistant n'a pas accès au coffre-fort | aucune |
| n'importe lequel | « Ai-je le droit de copier un dossier client dans une IA en ligne ? » | Non : interdit par la charte, l'assistant local est autorisé, toujours vérifier la source | Charte informatique, section 3 |
| hcorbiere | « Combien Mme Garnier peut-elle réclamer au titre de la non-concurrence ? » | 14 742 euros brut (30 % x 4 095 euros x 12 mois), plus 1 474,20 euros de congés payés | 07 Tableau des salaires, 10 Requête |

## Fichiers

| Chemin | Contenu |
|---|---|
| [`cabinet.json`](cabinet.json) | Comptes, groupes, dossiers et droits, agendas, carnets, entrées du coffre-fort |
| [`index.json`](index.json) | Les 30 documents : chemin, dossier, titre, date, nombre de pages, empreinte sha256, comptes qui peuvent les lire |
| [`fichiers/`](fichiers/) | Les documents tels qu'ils sont déposés dans Nextcloud (22 PDF, 8 DOCX, 1,2 Mo) |
| [`agendas/`](agendas/) | Un fichier `.ics` par événement (20 événements), un dossier par agenda |
| [`contacts/`](contacts/) | Un fichier `.vcf` par contact (14 contacts), un dossier par carnet |
| [`sources/`](sources/) | Les documents en Markdown, à modifier ici plutôt que dans les PDF |
| [`agendas.json`](agendas.json), [`contacts.json`](contacts.json) | Les événements et contacts, à modifier ici |
| [`generer.py`](generer.py), [`generation/`](generation/) | Génération des PDF, DOCX, `.ics`, `.vcf` et de `index.json` |

Pour l'assistant IA (DEV-2) : `index.json` donne directement, pour chaque document, la liste des comptes qui peuvent le lire. En production, la source de vérité des droits reste Nextcloud (voir le README de la plateforme).

## Modifier ou régénérer

Les fichiers produits sont versionnés : inutile de régénérer pour faire la démo. Après une modification des sources :

```bash
python3 generer.py          # demande pandoc 3 et XeLaTeX avec la police Liberation Serif
cd ../plateforme && ./box.sh donnees-demo
```

La génération est incrémentale : seuls les documents dont la source (ou le modèle) a changé sont refaits, pour ne pas modifier inutilement les autres fichiers dans git (`python3 generer.py --tout` pour tout refaire). Les dates des PDF et des fichiers sont celles du document, jamais celle du jour.
