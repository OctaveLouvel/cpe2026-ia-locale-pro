# Code de la démo

La spécification complète est dans [`docs/prototype.md`](../docs/prototype.md). À lire avant d'écrire du code.

## Organisation proposée

```
prototype/
  plateforme/   DEV-1 : installation du système, fichier de déploiement des conteneurs, installeur, sauvegarde
  ia/           DEV-2 : moteur d'inférence, service d'indexation et de recherche, citations, pack métier
  interface/    DEV-3 : tableau de bord unifié ; la landing page peut aller dans interface/landing/
  securite/     DEV-4 : chiffrement, journal d'audit, accès distant, scripts de mesure
  donnees-demo/ Jeu de données FICTIF du faux cabinet (marqué comme tel)
```

Chaque dossier contient un `README.md` qui explique en quelques lignes comment lancer sa partie.

## Rappels

- Tout doit fonctionner **câble réseau débranché** : aucune ressource chargée depuis internet à l'exécution.
- **Aucun secret dans git** : utiliser des fichiers `.env` (ignorés) et fournir un `.env.example`.
- **Pas de modèles d'IA ni de gros fichiers dans git** : documenter comment les télécharger.
- **Données fictives uniquement** dans `donnees-demo/`.
- Une branche par développeur (`dev1-plateforme`, `dev2-ia`, `dev3-interface`, `dev4-securite`), fusion dans `main` par pull request relue.
- **Gel de la démo le jeudi 5 novembre à 16h00.**
