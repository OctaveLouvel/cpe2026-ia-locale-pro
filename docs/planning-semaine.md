# Planning de la semaine (3 au 9 novembre 2026)

Rôles : **BIZ** (business & marketing), **DEV-1** (plateforme), **DEV-2** (IA), **DEV-3** (interface & vitrine), **DEV-4** (sécurité & mesures). Voir le README, section 4.

Règles valables tous les jours :

- **Point d'équipe à 12h00 et à 17h30** (10 minutes) : fait, bloqué, changé. Mettre à jour la section 8 du README si une décision est prise.
- **Présence obligatoire** dans la salle de coaching de l'équipe pendant les créneaux de coaching. Solliciter les coachs au moins une fois par demi-journée sur la question la plus incertaine du moment.
- Chaque entretien est consigné le jour même dans [`entretiens/suivi.md`](../entretiens/suivi.md).
- Les cases à cocher se cochent dans ce fichier au fil de l'eau.

---

## Mardi 3 novembre

### Matin (jusqu'à 12h00)

- [ ] **Toute l'équipe** : lire le README et `AGENTS.md`. Remplir numéro d'équipe, salle, créneau du mercredi dans [`attendus-challenge.md`](attendus-challenge.md). Attribuer les 5 rôles (README, section 4).
- [ ] **DEV-1** : choisir le matériel de démo **avant 14h00** (voir [`prototype.md`](prototype.md), section Matériel).
- [ ] **BIZ** : proposer 3 noms de projet au point de 12h00, choix avant 18h00.

### 13h30 à 14h30 : atelier Enjeux RSE (obligatoire, 2 personnes)

- [ ] **BIZ + DEV-4** vont à l'atelier (Amphi Étoile). Ils notent ce que l'intervenant attend comme « impact mesurable » et le reportent dans [`rse.md`](rse.md).
- Les 3 autres restent en salle de coaching.

### Après-midi

**BIZ**
- [ ] Construire une **liste de 40 cabinets d'avocats** à appeler, en Essonne et à Paris, en priorité ceux de 1 à 10 personnes. Sources : annuaires des barreaux, cartes en ligne, réseau personnel de l'équipe (famille, anciens maîtres de stage), LinkedIn. Mettre les coordonnées (noms, téléphones, mails) dans un **tableur partagé privé, hors du dépôt**. Dans `entretiens/suivi.md`, n'écrire que des identifiants anonymes (A01, A02...).
- [ ] Ajouter **2 ou 3 spécialistes** à contacter : prestataire informatique qui travaille pour des cabinets d'avocats, élu ou responsable numérique d'un barreau, enseignant en droit.
- [ ] Répartir la liste : 8 contacts par personne.
- [ ] Écrire le texte de la landing page pour DEV-3 **avant 15h00** (titre, problème, promesse, bouton « rejoindre la liste d'attente »). Pas de faux clients, pas de faux avis.
- [ ] Commencer le tableau des concurrents dans [`marche-et-concurrence.md`](marche-et-concurrence.md).

**Tous les développeurs**
- [ ] **Au moins 3 appels chacun entre 14h30 et 17h00** avec le script de [`entretiens/guide-entretien.md`](../entretiens/guide-entretien.md). Les cabinets sont joignables en journée, pas le soir.

**DEV-1**
- [ ] Installer l'OS et le moteur de conteneurs sur le matériel de démo. *(3 nov : plateforme installée sur le portable de DEV-1, matériel proposé en attente de confirmation ; script Debian prêt, voir `docs/prototype.md`, section 2.)*
- [x] Déployer Nextcloud (fichiers, agenda, contacts), Vaultwarden et un reverse proxy TLS local.
- [x] Créer le **jeu de données fictif** : un faux cabinet avec 3 faux dossiers clients (20 à 30 documents), un agenda rempli, des contacts. Bien marqué « fictif ». *(30 documents, 20 événements, 14 contacts : `prototype/donnees-demo/`.)*

**DEV-2**
- [ ] Installer le moteur d'inférence local et télécharger 2 ou 3 modèles candidats.
- [ ] Mesurer sur le matériel de démo : vitesse (tokens par seconde), temps jusqu'au premier mot, qualité en français sur 5 questions types. Noter les résultats dans [`prototype.md`](prototype.md).
- [ ] Premier prototype de recherche dans les documents (RAG) sur une dizaine de PDF fictifs, avec citation du document source.

**DEV-3**
- [ ] **Landing page + formulaire de liste d'attente en ligne ce soir.** Formulaire conforme au RGPD : consentement explicite, finalité indiquée, lien vers une courte mention de confidentialité.
- [ ] Maquette du tableau de bord unifié (papier ou outil de maquette), validée par l'équipe au point de 17h30.

**DEV-4**
- [ ] Modèle de menace d'une page : qui attaque, quoi, comment on protège (vol de la box, ransomware, fuite par l'IA, accès distant abusé, erreur de manipulation).
- [ ] Plan de chiffrement : disque, communications, sauvegardes. Plan de journal d'audit.
- [ ] Trouver un **wattmètre** (fablab, labo de l'école, prêt) pour mesurer la box mercredi.
- [ ] Commencer la roadmap technique avec temps de développement et RH (pour la slide « Solution »).

### 17h30 : point d'équipe

- [ ] Combien d'entretiens réalisés ? Combien de rendez-vous obtenus pour mercredi ?
- [ ] La landing page est-elle prête à partir ce soir ?
- [ ] Le modèle IA tourne-t-il sur le matériel de démo ?

### Soir

- [ ] **DEV-3 + BIZ** : publier la landing page et la partager (LinkedIn de l'équipe, groupes d'anciens, contacts des cabinets appelés qui ont accepté). Noter le nombre d'inscrits chaque soir.

---

## Mercredi 4 novembre

### Matin

- [ ] **Toute l'équipe** : atelier **Finance & Pitch** (Amphi Étoile). **9h00 à 10h00 si équipe 1 à 47, 10h15 à 11h15 si équipe 48 à 94.** Obligatoire pour tous.
- [ ] **Chaque développeur : au moins 2 appels ou rendez-vous** dans la matinée.
- [ ] **BIZ** : entretiens et relances de la veille. Demander à chaque personne intéressée une **marque d'intérêt écrite** (un simple mail : « je serais intéressé par une solution de ce type à environ X€ »).

### 12h00 : point sur les entretiens

- [ ] Valider le **persona** (l'associé qui paie, les collaborateurs qui utilisent) à partir de ce que disent les entretiens, et le noter dans [`marche-et-concurrence.md`](marche-et-concurrence.md).
- [ ] Lister ce que les avocats ont confirmé et ce qu'ils ont contredit. Si un point du problème est contredit, l'écrire dans la section 8 du README et en parler aux coachs l'après-midi.

### Après-midi

**BIZ** (avec l'aide de DEV-4 sur les coûts)
- [ ] TAM / SAM / SOM des cabinets d'avocats, avec sources.
- [ ] **Au moins 3 concurrents détaillés** (taille, fonctionnalités, stratégie, levées de fonds) + positionnement sur un schéma.
- [ ] Prix des offres (2 ou 3 maximum) à partir du coût matériel réel et des entretiens.
- [ ] Go to market : canaux, coûts, nombre de clients par an, coût d'acquisition.
- [ ] **Modèle financier v1** sur 5 ans (voir [`business-model.md`](business-model.md)).
- [ ] **Executive summary v1 à 18h00** dans [`livrables/executive-summary.md`](../livrables/executive-summary.md).

**DEV-1**
- [x] Assistant de première configuration (« installeur ») : création du compte administrateur, choix des services, chiffrement activé, premier test de sauvegarde. Il doit tenir en quelques écrans. *(Fait le 3 nov : `./box.sh assistant`, 5 écrans. Le chiffrement du disque est vérifié, pas activé : il se choisit à l'installation de Debian.)*
- [x] Sauvegarde chiffrée vers un disque externe, testée **avec une restauration réelle**. *(Fait le 3 nov vers un dossier local ; à refaire avec le vrai disque USB sur le matériel de démo.)*
- [ ] **16h00 : test de toute la démo câble réseau débranché.** Lister et corriger tout ce qui casse. *(Outil prêt : `./box.sh verifier-hors-ligne`.)*

**DEV-2**
- [ ] Assistant IA qui cherche dans les fichiers **et** l'agenda, respecte les droits de l'utilisateur, **n'accède jamais au coffre-fort**, et cite ses sources.
- [ ] Pack métier : vérifier la licence et le format d'un jeu de données ouvert utile aux avocats (textes juridiques, jurisprudence), et l'intégrer si c'est faisable en une demi-journée. Sinon, le présenter comme roadmap.
- [ ] Préparer les 3 questions exactes de la démo et vérifier que les réponses sont bonnes à chaque essai.

**DEV-3**
- [ ] Tableau de bord v1 : état des services, sauvegardes, mises à jour, journal des accès, entrée vers l'assistant.
- [ ] Modèle de slides commun à l'équipe, captures d'écran de la démo.

**DEV-4**
- [ ] Chiffrement en place, journal d'audit des connexions sortantes visible dans le tableau de bord.
- [ ] **Mesure au wattmètre** : au repos, en charge (IA qui répond). Calcul en kWh par an dans [`rse.md`](rse.md).
- [ ] Slide roadmap technique + RH. Liste des licences des briques utilisées.
- [ ] Coûts techno pour le modèle financier : matériel, hébergement des sauvegardes hors site, temps de support.

### 17h30 : point d'équipe

- [ ] Squelette des slides : **une slide par critère de la grille**, chaque slide attribuée à une personne.
- [ ] Relecture de l'executive summary par toute l'équipe.

### Soir

- [ ] **Executive summary finalisé et déposé sur Moodle mercredi soir.** Ne pas attendre jeudi matin. Vérifier : 2 pages maximum, noms et écoles, numéro d'équipe, nom du projet.

---

## Jeudi 5 novembre

- [ ] **Avant 9h00 : vérifier que l'executive summary est bien déposé sur Moodle** (date limite 9h00).
- [ ] **BIZ** : revérifier les prix et chiffres des concurrents utilisés dans les slides. Compléter les chiffres d'entretiens et d'inscrits à la liste d'attente.
- [ ] **12h00 : slides v1 complètes.**
- [ ] **14h00 : répétition n°1**, chronométrée, avec la démo.
- [ ] **16h00 : gel de la démo.** Plus aucune fonctionnalité, seulement des corrections.
- [ ] **16h30 : DEV-3 enregistre la vidéo de secours** de la démo (3 à 4 minutes).
- [ ] **17h00 : répétition n°2**, si possible devant un coach (open coaching facultatif rue Étoile, 10h00 à 17h00 : réserver un passage plus tôt dans la journée).
- [ ] **18h30 : répétition n°3**, puis entraînement aux questions : chacun répond à 5 questions de [`livrables/questions-jury.md`](../livrables/questions-jury.md).
- [ ] Soir : exporter les slides en PDF, copier slides + vidéo sur une clé USB et sur un deuxième ordinateur. Préparer le sac de démo (voir vendredi).

---

## Vendredi 6 novembre : jury

- [ ] Vérifier l'heure de passage dans le planning des jurys (bâtiment F).
- [ ] **Arriver 30 minutes avant**. Tester l'écran, l'adaptateur et la démo **sans le wifi de l'école**.
- [ ] Sac de démo : box de démo + alimentation + rallonge, adaptateurs HDMI et USB-C, petit routeur ou switch si l'ordinateur de présentation doit se connecter à la box, ordinateur de secours avec la vidéo, clé USB avec slides PDF.
- [ ] Juste après le passage : noter toutes les questions du jury dans [`livrables/questions-jury.md`](../livrables/questions-jury.md), section « Questions réellement posées ».

---

## Lundi 9 novembre : finale (si lauréats)

- [ ] Préparer un pitch de **3 minutes avec 2 ou 3 slides** pendant le week-end : problème prouvé, démo en une image ou une courte vidéo, marché et chiffre clé.
- [ ] Amphi 10, **18h00**. Vote de la salle : parler à un public large, pas seulement à des experts.

---

## Après le challenge

- [ ] Décision d'équipe : continuer ou non.
- [ ] Si oui : **inscription individuelle au programme Next Step avant le 15 novembre 2026** (entretien le 19 novembre). Programme du 10 décembre 2026 au 7 avril 2027, jury le 22 avril 2027.
- [ ] Recontacter les personnes inscrites sur la liste d'attente et les cabinets intéressés.
