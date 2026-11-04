# Code de la démo

La spécification complète est dans [`docs/prototype.md`](../docs/prototype.md). À lire avant d'écrire du code.

## Organisation proposée

```
prototype/
  plateforme/   DEV-1 : installation du système, fichier de déploiement des conteneurs, installeur, sauvegarde
  ia/           DEV-2 : moteur d'inférence, service d'indexation et de recherche, citations, pack métier
  interface/    DEV-3 : tableau de bord de la box (tableau-de-bord/) et landing page avec liste d'attente (landing/)
  securite/     DEV-4 : chiffrement, journal d'audit, accès distant, scripts de mesure
  donnees-demo/ Jeu de données FICTIF du faux cabinet (marqué comme tel)
```

Chaque dossier contient un `README.md` qui explique en quelques lignes comment lancer sa partie.

## État au 3 novembre

- **Plateforme (DEV-1), prête** : [`plateforme/README.md`](plateforme/README.md). Deux commandes, `./box.sh installer` puis `./box.sh donnees-demo`, donnent une box complète avec le cabinet fictif. Sauvegarde chiffrée avec restauration testée, assistant d'installation, vérification hors ligne.
- **Données de démo, prêtes** : [`donnees-demo/README.md`](donnees-demo/README.md). Les PDF et DOCX sont utilisables tout de suite par DEV-2 pour le premier prototype de recherche, avec la liste des comptes qui peuvent lire chaque document (`index.json`).
- **Interface (DEV-3), 4 novembre** : [`interface/README.md`](interface/README.md). Tableau de bord sur https://cabinet.localhost, lancé par `./box.sh installer`. Landing page et liste d'attente prêtes en local, à publier après validation du texte par BIZ.
- IA (DEV-2), sécurité (DEV-4) : à brancher sur le réseau `interne` de la plateforme, voir la section « Pour les autres équipes » du README de la plateforme.

## Rappels

- Tout doit fonctionner **câble réseau débranché** : aucune ressource chargée depuis internet à l'exécution.
- **Aucun secret dans git** : utiliser des fichiers `.env` (ignorés) et fournir un `.env.example`.
- **Pas de modèles d'IA ni de gros fichiers dans git** : documenter comment les télécharger.
- **Données fictives uniquement** dans `donnees-demo/`.
- Une branche par développeur (`dev1-plateforme`, `dev2-ia`, `dev3-interface`, `dev4-securite`), fusion dans `main` par pull request relue.
- **Gel de la démo le jeudi 5 novembre à 16h00.**
