# Code de la démo

**Pour lancer la box en une commande : [`DEMARRAGE.md`](DEMARRAGE.md).**

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

## État au 4 novembre

**Pour lancer la box : [`DEMARRAGE.md`](DEMARRAGE.md)**, une commande : `./box.sh installer --demo`.

- **Plateforme (DEV-1)** : [`plateforme/README.md`](plateforme/README.md). Services conteneurisés, installeur, sauvegarde chiffrée avec restauration testée, vérification hors ligne.
- **IA (DEV-2)** : [`ia/README.md`](ia/README.md). Assistant avec les droits Nextcloud, citations et refus ; choix et installation du modèle sur la page Modèles d'IA.
- **Interface (DEV-3)** : [`interface/README.md`](interface/README.md). Tableau de bord sur https://cabinet.localhost ; landing page et liste d'attente, à publier après validation du texte par BIZ.
- **Sécurité et mesures (DEV-4)** : [`../docs/securite.md`](../docs/securite.md). Coffre-fort sur un réseau séparé, journal d'audit, mesure de consommation dans [`securite/`](securite/).
- **Données de démo** : [`donnees-demo/README.md`](donnees-demo/README.md). Cabinet fictif : documents, agendas, contacts, droits.

## Rappels

- Tout doit fonctionner **câble réseau débranché** : aucune ressource chargée depuis internet à l'exécution.
- **Aucun secret dans git** : utiliser des fichiers `.env` (ignorés) et fournir un `.env.example`.
- **Pas de modèles d'IA ni de gros fichiers dans git** : documenter comment les télécharger.
- **Données fictives uniquement** dans `donnees-demo/`.
- Une branche par développeur (`dev1-plateforme`, `dev2-ia`, `dev3-interface`, `dev4-securite`), fusion dans `main` par pull request relue.
- **Gel de la démo le jeudi 5 novembre à 16h00.**
