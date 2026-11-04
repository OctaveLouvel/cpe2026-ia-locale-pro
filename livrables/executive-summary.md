# Executive summary : mode d'emploi et vérifications

**Dépôt sur Moodle avant le jeudi 5 novembre à 9h00. Objectif : version finale déposée le mercredi 4 novembre au soir.**

Contraintes : **2 pages maximum**, noms et écoles, numéro d'équipe, nom du projet, résumé problème / solution / business model. Responsable : BIZ. Relecture : toute l'équipe au point de 17h30 le mercredi.

## Où est le texte

- **Le texte est dans [`executive-summary.html`](executive-summary.html)**. C'est la source du PDF déposé sur Moodle.
- **Pour régénérer le PDF** : `./livrables/generer-pdf.sh`. Le script utilise Chromium, sans réseau. Il produit `livrables/executive-summary.pdf` et affiche le nombre de pages.

La structure s'inspire du guide [Propulse by CA sur l'executive summary](https://propulsebyca.fr/business-plan/executive-summary) :
- un encadré d'identité (activité, cible, stade, équipe) avec la proposition de valeur ;
- l'avancement : réalisé, d'ici vendredi, objectifs 2027 ;
- l'équipe par rôle ;
- un plan de financement en deux colonnes ;
- une conclusion qui dit ce que nous cherchons.

Ce guide demande aussi les dates de naissance et la répartition du capital. Ces éléments sont volontairement absents : le jury considère que travailler sur les statuts pendant la semaine est une perte de temps.

Le texte suit les règles de [`AGENTS.md`](../AGENTS.md) :

- **Passages surlignés en jaune** (`class="todo"`) : à remplacer par un humain de l'équipe. Ce sont les noms, les nombres d'entretiens, les mesures et les prix validés.
- **Prix et prévisions** : ce sont les HYPOTHÈSES de [`docs/business-model.md`](../docs/business-model.md) et [`docs/roadmap-5-ans.md`](../docs/roadmap-5-ans.md). Le PDF les présente comme des « estimations ».
- **Sources numérotées en bas du PDF** : elles renvoient à [`docs/sources.md`](../docs/sources.md) (1 = S1, 2 = S2, 3 = S9, 4 = S10, 5 = S15, 6 = S17). Si un chiffre est ajouté, ajouter aussi sa source dans ce fichier.
- **Échanges cités dans « Le problème »** : ce sont des résumés des comptes rendus de Louka (étudiant en droit) et de Thibaud (cabinet de 8 avocats). Il n'y a pas de citation mot pour mot, faute d'accord.

## Avant le dépôt (liste de vérification)

- [ ] Nom du projet, numéro d'équipe, noms et écoles des 5 membres.
- [ ] Nombres réels d'entretiens, de marques d'intérêt et d'inscrits, recopiés depuis [`entretiens/suivi.md`](../entretiens/suivi.md), qui doit d'abord être rempli.
- [ ] Une citation seulement si la personne a donné son accord.
- [ ] Prix validés au point de 17h30 et tableau des offres complet (offre Solo).
- [ ] État réel de l'assistant IA ce soir : ne rien annoncer qui ne tourne pas.
- [ ] Mesure au wattmètre, ou remplacer par « mesure en cours ».
- [ ] SAM avec le nombre de cabinets sourcé, ou retirer la case.
- [ ] Concurrence indirecte (IA intégrée aux logiciels de cabinet) sourcée, ou retirer la ligne.
- [ ] Coût d'acquisition chiffré, ou retirer la case.
- [ ] Plan de financement (besoins et ressources), marge brute et seuil de rentabilité, tirés du modèle financier v1, ou retirer les cases.
- [ ] Tableau de l'équipe : un nom et une école par rôle.
- [ ] Jalons 2027 (pilotes en mars et juin, 20 clients en fin d'année 1) toujours alignés avec [`docs/roadmap-5-ans.md`](../docs/roadmap-5-ans.md).
- [ ] Les deux échanges cités ont été relus par Louka et Thibaud.
- [ ] Prix des concurrents revérifiés.
- [ ] Plus aucun surlignage jaune, et toujours 2 pages (le script l'affiche).
- [ ] Déposé sur Moodle **ce soir**, puis dépôt vérifié avant jeudi 9h00.
