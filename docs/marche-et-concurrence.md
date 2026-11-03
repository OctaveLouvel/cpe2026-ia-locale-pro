# Marché et concurrence

Chiffres relevés le 3 novembre 2026. Toutes les sources sont dans [`sources.md`](sources.md) avec le numéro indiqué entre crochets. **Revérifier les prix des concurrents le jeudi 5 novembre avant de figer les slides.**

## 1. Segment visé

**Segment large** : petites structures soumises à une obligation légale de confidentialité, sans service informatique, qui veulent utiliser l'IA sans envoyer leurs dossiers dans un cloud tiers.

**Profession de lancement** : avocats ou experts-comptables, choix le mercredi 4 novembre à 12h00 (voir README, section 8). Les autres professions servent au TAM et à la roadmap, pas au persona.

### Professions candidates

| Profession | Taille | Intérêt | Limite | Place dans la roadmap |
|---|---|---|---|---|
| Avocats | 77 598 avocats inscrits [S1]. 32% des cabinets ont un seul avocat, 31% en ont 2 à 4 [S2] | Secret professionnel absolu, beaucoup de petits cabinets sans informatique interne | Logiciels métier à intégrer. Nombre de cabinets (et pas d'avocats) **à sourcer** | Lancement possible |
| Experts-comptables | 21 611 inscrits, 19 490 sociétés d'expertise comptable, plus de 186 000 salariés dans le secteur [S3] | Données financières des clients, gros volumes de documents. Environ 9 à 10 salariés par société (calcul : 186 000 / 19 490), donc plus d'utilisateurs par box | Ont souvent déjà un prestataire informatique et des logiciels métier en ligne | Lancement possible |
| Conseils en propriété industrielle | Un peu plus de 1 000 inscrits [S4] | Une fuite avant le dépôt d'un brevet peut détruire la nouveauté de l'invention : forte disposition à payer | Marché très petit | Niche premium, année 2 ou plus |
| Notaires | Les notaires représentent 81% des 21 600 officiers publics et ministériels, dans 7 089 offices notariaux [S5] | Données patrimoniales très sensibles | Écosystème informatique déjà très encadré par la profession (**à vérifier en entretien**) | À explorer |
| Psychologues | France hexagonale : 24 723 libéraux et 10 143 en exercice mixte [S6] | Données de santé très sensibles | 64,5% des libéraux sont micro-entrepreneurs [S7] : capacité de paiement limitée | Hors cible |
| Cabinets médicaux | Très nombreux (**à sourcer**) | Secret médical | Cadre HDS (voir section 4) | Année 3, via un partenaire certifié HDS |

Autres pistes, sans chiffres pour l'instant : architectes et bureaux d'études (plans, secret industriel), rédactions (protection des sources), cabinets de recrutement (données des candidats), PME qui font de la R&D.

### Persona (à compléter avec les entretiens)

- **Qui paie** : associé ou fondateur d'un cabinet de 1 à 10 personnes.
- **Qui utilise** : collaborateurs, assistants, l'associé lui-même.
- **Ce qu'il veut** : _à remplir à partir des entretiens, avec citations réelles et anonymisées_.
- **Ce qui le bloque aujourd'hui** : _à remplir à partir des entretiens_.
- **Ce qu'il est prêt à payer** : _à remplir à partir des entretiens_.

## 2. TAM / SAM / SOM

Méthode (à appliquer à la profession choisie) :

- **TAM** : nombre de structures du segment large en France, puis en Europe francophone × panier annuel moyen.
- **SAM** : structures de moins de 10 personnes en France × panier annuel moyen. Pour les avocats, partir de la répartition par taille [S2] et trouver le nombre de cabinets.
- **SOM** : nombre de cabinets clients visé à 5 ans dans le modèle financier ([`business-model.md`](business-model.md)), soit environ 530 dans l'exemple actuel. **HYPOTHÈSE** à justifier par le go to market.
- Le panier annuel moyen se calcule depuis les prix : vente de la box amortie sur sa durée de vie + abonnement annuel.

## 3. Concurrence

### Vue d'ensemble

Le marché des box de cloud personnel est **fragmenté** : quelques start-ups financées, des fabricants de NAS, et des projets libres gratuits. Aucun acteur étudié ne vise spécifiquement les professions soumises au secret avec un service sur place en France (**à confirmer** par une recherche plus large, y compris sur les acteurs français).

### Concurrents directs détaillés

| Acteur | Offre | Prix | Financement et taille | Ce qu'on en retient |
|---|---|---|---|---|
| **Olares One** | Serveur cloud personnel et station IA qui transforme les fichiers locaux en assistant personnel [S8]. GPU RTX 5090 Mobile 24 Go [S9]. Olares OS est libre et gratuit [S10] | 2 899 $ en précommande, 3 999 $ prix public [S11] | Série A de 45 millions de dollars menée par SIG [S12] | **Concurrent le plus proche.** Preuve que le marché existe. Cible : passionnés d'IA, créateurs, développeurs, entreprises soucieuses de la confidentialité [S12]. Pas de service sur place, pas de spécialisation métier, pas centré sur la France |
| **Umbrel Home** | Box préconfigurée avec umbrelOS, magasin d'applications (fichiers, médias, domotique, Bitcoin) [S13] | Lancée à 699 $ en 2023 [S14], vendue ensuite autour de 399 $ [S15] | Fondée en 2020 [S13] | Grand public et passionnés. OS gratuit installable soi-même [S13] |
| **Start9 Server One 2026** | Serveur personnel avec StartOS, orienté souveraineté et Bitcoin [S16] | 749 $ à 1 049 $, **support à vie inclus** (valeur annoncée 300 $), garantie 2 ans [S17] | Petite équipe basée à Denver [S18] | Le support est déjà offert : notre abonnement doit apporter autre chose |
| **ZimaCube** (IceWhale) | NAS « cloud personnel » avec applications tierces (Immich, Plex...) [S19] | 649 $ en version de base, 1 099 $ en version Pro [S19] | Campagne de financement participatif qui a largement dépassé son objectif [S20] | Orienté stockage et créateurs de contenu |

### Autres concurrents à documenter

- **YunoHost** : distribution libre et gratuite pour l'auto-hébergement, d'origine française (**à sourcer**). Concurrent pour les profils techniques, pas pour un cabinet sans informatique.
- **Synology, QNAP** : NAS grand public et PME avec applications (**à sourcer**).
- **Concurrence indirecte** : services d'IA en ligne, y compris spécialisés pour les avocats ou les comptables et hébergés en Europe (**à rechercher et sourcer** : c'est probablement la vraie alternative que les cabinets envisagent).
- **Prestataires informatiques locaux** qui installent des serveurs dans les cabinets : concurrents et futurs partenaires revendeurs.

### Notre différenciation (à valider en entretien)

1. **Service** : installation sur place, support en français, mises à jour de sécurité suivies.
2. **Conformité** : pensé pour le secret professionnel, sans transfert de données hors du cabinet, journal des accès lisible par le client.
3. **Pack métier** : données et modèles de documents utiles à la profession.
4. **Simplicité** : pas besoin de compétences techniques, contrairement à YunoHost, Umbrel ou Start9.

Réponse à préparer : **« Pourquoi vous et pas Olares ? »** (voir [`livrables/questions-jury.md`](../livrables/questions-jury.md)).

## 4. Cadre juridique et acteurs de l'écosystème

- **Secret professionnel** des avocats et des experts-comptables : citer les textes exacts (**à sourcer**).
- **RGPD** : le cabinet est responsable de traitement. Si nous faisons de la sauvegarde hors site ou de l'administration à distance, nous devenons sous-traitant : contrat de sous-traitance nécessaire.
- **Santé et HDS** : un cabinet qui héberge ses propres dossiers patients sur ses serveurs internes n'est pas soumis à la certification HDS [S21]. La certification s'impose à qui héberge pour le compte d'un tiers, y compris l'activité « administration et exploitation du système d'information » [S22]. Elle coûte typiquement 20 000 à 80 000€ sur 3 ans [S21]. Conséquence : pas de santé avant l'année 3, et via un partenaire certifié.
- **Licences** : Nextcloud et Immich sont sous AGPL (**à vérifier** pour chaque brique effectivement utilisée). La revente est permise, avec des obligations sur le code source.
- **Acteurs** : instances professionnelles (barreaux, CNB, conseils de l'Ordre des experts-comptables), éditeurs de logiciels métier, prestataires informatiques, fabricants de mini-PC, fournisseurs de stockage pour les sauvegardes hors site.
