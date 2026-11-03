# Règles pour les agents IA

Ce fichier s'applique à tout agent IA (Claude, ou autre) qui travaille dans ce dépôt pour un membre de l'équipe. Il complète le [`README.md`](README.md), à lire en premier.

## Contexte minimal

- Projet étudiant pour le **Challenge Projets d'Entreprendre 2026**, du 2 au 6 novembre 2026. Oral devant le jury le **vendredi 6 novembre**. Executive summary à déposer le **jeudi 5 novembre à 9h00**.
- Produit : une box d'IA locale et de cloud privé pour petits cabinets soumis au secret professionnel (avocats ou experts-comptables, choix le mercredi 4 novembre à 12h00).
- Équipe : 4 développeurs (DEV-1 plateforme, DEV-2 IA, DEV-3 interface et vitrine, DEV-4 sécurité et mesures) et 1 profil business (BIZ). Voir le README, section 4.
- **Avant toute tâche, vérifier la date du jour** et relire la ligne correspondante de [`docs/planning-semaine.md`](docs/planning-semaine.md). Les échéances sont serrées.

## Règle n°1 : ne rien inventer

Le jury a écrit : « Travail basique réalisé via IA = mauvaise note ». Un faux élément découvert pendant les questions ruine toute la présentation. Donc :

- **Ne jamais inventer** un entretien, une citation, un nom de cabinet, un client, une marque d'intérêt, un chiffre de marché ou un prix.
- [`entretiens/suivi.md`](entretiens/suivi.md) et les comptes rendus d'entretien ne contiennent **que des informations fournies par un humain de l'équipe**. Un agent peut les mettre en forme ou les résumer, jamais les compléter.
- Chaque chiffre factuel doit avoir une source dans [`docs/sources.md`](docs/sources.md). Ajouter la source dans ce fichier en même temps que le chiffre.
- Ce qui n'est pas sourcé est écrit **HYPOTHÈSE** en clair, avec le raisonnement qui y mène.
- Les prix des concurrents changent : les revérifier avant de les utiliser dans un livrable final.
- Pas de faux témoignages, faux avis ou faux logos de clients, même « pour la démo ».

## Règle n°2 : respecter le périmètre

- Une seule profession de lancement dans le persona, la démo et le SOM. Le reste (autres professions, santé, B2C) n'apparaît que dans la vision à 5 ans.
- Ne pas réintroduire dans la démo les briques de l'idée initiale qui ne servent pas à un cabinet (Home Assistant, Immich, Wikipédia, cartes).
- **Ne jamais supprimer un piège** de la section 7 du README. On peut en ajouter, avec la date et la raison.
- Toute décision qui change le périmètre doit être notée dans la section 8 du README (Décisions ouvertes) et validée par l'équipe au point de 12h00 ou de 17h30.

## Règle n°3 : règles techniques du prototype

Voir [`docs/prototype.md`](docs/prototype.md). En résumé :

- **Tout doit fonctionner câble réseau débranché.** Pas de CDN, pas de polices distantes, pas de télémétrie, modèles téléchargés à l'avance.
- Toute connexion sortante est optionnelle, chiffrée et inscrite dans le journal d'audit.
- L'assistant IA **n'a jamais accès au coffre-fort de mots de passe** et respecte les droits de l'utilisateur.
- L'assistant **cite toujours le document source** de sa réponse.
- **Données de démo fictives uniquement.** Jamais de données issues des entretiens ou de vrais dossiers.
- Pas de secrets (mots de passe, clés, jetons) dans le dépôt. Utiliser des fichiers `.env` ignorés par git.
- Le code de la démo va dans `prototype/`. Chaque service a un court README qui explique comment le lancer.
- **Gel de la démo le jeudi 5 novembre à 16h00** : après, seulement des corrections de bugs.

## Règle n°4 : style des documents

- Langue : **français**. Les termes techniques anglais courants sont acceptés (TAM, SAM, SOM, MVP, RAG).
- Phrases simples et directes. Pas de jargon marketing creux.
- **Pas d'espaces insécables** : utiliser des espaces normales, y compris avant « : », « ? » et « ! ».
- Mettre à jour un document plutôt que d'en créer un nouveau qui le duplique. Si un nouveau fichier est nécessaire, l'ajouter à l'arborescence du README (section 9).

## Règle n°5 : git

- Messages de commit courts, en français, préfixés par le domaine : `docs:`, `biz:`, `proto:`, `entretiens:`, `livrables:`.
- Une branche par développeur pour le code (`dev1-plateforme`, `dev2-ia`, `dev3-interface`, `dev4-securite`), fusion dans `main` via pull request relue par une autre personne. Les documents peuvent être modifiés directement sur `main`.
- Ne jamais forcer un push sur `main`.

## Où trouver quoi

| Besoin | Fichier |
|---|---|
| Règles et grille du challenge | [`docs/attendus-challenge.md`](docs/attendus-challenge.md) |
| Ce que je dois faire aujourd'hui | [`docs/planning-semaine.md`](docs/planning-semaine.md) |
| Chiffres de marché, concurrents | [`docs/marche-et-concurrence.md`](docs/marche-et-concurrence.md) |
| Spécification technique de la démo | [`docs/prototype.md`](docs/prototype.md) |
| Prix, modèle financier, financement | [`docs/business-model.md`](docs/business-model.md) |
| Mesure de l'impact RSE | [`docs/rse.md`](docs/rse.md) |
| Plan à 5 ans | [`docs/roadmap-5-ans.md`](docs/roadmap-5-ans.md) |
| Préparer ou consigner un entretien | [`entretiens/`](entretiens/) |
| Executive summary, pitch, questions du jury | [`livrables/`](livrables/) |
