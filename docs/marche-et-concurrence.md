# Marché et concurrence

Chiffres relevés le 3 novembre 2026. Toutes les sources sont dans [`sources.md`](sources.md) avec le numéro indiqué entre crochets. **Revérifier les prix des concurrents le jeudi 5 novembre avant de figer les slides.**

## 1. Cible : les cabinets d'avocats

**Cible** : cabinets d'avocats de 1 à 10 personnes, sans service informatique, en France, en commençant par l'Île-de-France. Vente en B2B.

| Indicateur | Valeur | Source |
|---|---|---|
| Avocats inscrits en France | 77 598 | [S1] |
| Cabinets avec un seul avocat | 32% | [S2] |
| Cabinets de 2 à 4 avocats | 31% | [S2] |
| Nombre de **cabinets** d'avocats en France | **à sourcer** | |
| Part des avocats en Île-de-France | **à sourcer** | |

Pourquoi cette cible :

- **Secret professionnel absolu** : la confidentialité est une obligation, pas une préférence.
- **Beaucoup de petites structures** sans informatique interne : personne pour installer et maintenir une solution locale.
- **Un décideur identifiable** (l'associé) qui dispose d'un budget.

Limite à traiter : les cabinets utilisent des logiciels de gestion de cabinet qu'il faudra, à terme, connecter à la box.

### Extensions (vision à 5 ans uniquement)

Ces professions servent au TAM et à la roadmap. Elles n'apparaissent ni dans le persona, ni dans la démo.

| Profession | Taille | Intérêt | Limite | Place dans la roadmap |
|---|---|---|---|---|
| Experts-comptables | 21 611 inscrits, 19 490 sociétés d'expertise comptable, plus de 186 000 salariés dans le secteur [S3] | Données financières des clients. Environ 9 à 10 salariés par société (calcul : 186 000 / 19 490), donc plus d'utilisateurs par box | Ont souvent déjà un prestataire informatique et des logiciels métier en ligne | Année 2 |
| Notaires | Les notaires représentent 81% des 21 600 officiers publics et ministériels, dans 7 089 offices notariaux [S5] | Données patrimoniales très sensibles | Écosystème informatique déjà très encadré par la profession (**à vérifier**) | Années 4 et 5 |
| Conseils en propriété industrielle | Un peu plus de 1 000 inscrits [S4] | Une fuite avant le dépôt d'un brevet peut détruire la nouveauté de l'invention : forte disposition à payer | Marché très petit | Années 4 et 5 |
| Cabinets médicaux | Très nombreux (**à sourcer**) | Secret médical | Cadre HDS (voir section 4) | Année 3, via un partenaire certifié HDS |

### Persona (à compléter avec les entretiens)

- **Qui paie** : associé ou fondateur d'un cabinet de 1 à 10 personnes.
- **Qui utilise** : collaborateurs, assistants, l'associé lui-même.
- **Ce qu'il veut** : _à remplir à partir des entretiens, avec citations réelles et anonymisées_.
- **Ce qui le bloque aujourd'hui** : _à remplir à partir des entretiens_.
- **Ce qu'il est prêt à payer** : _à remplir à partir des entretiens_.

## 2. TAM / SAM / SOM

Méthode :

- **TAM** : tous les cabinets d'avocats en France × panier annuel moyen. Pour la vision, ajouter les professions de la section « Extensions » et l'Europe francophone.
- **SAM** : cabinets d'avocats de 1 à 10 personnes en France × panier annuel moyen. Partir de la répartition par taille [S2] et du nombre de cabinets (à sourcer).
- **SOM** : nombre de cabinets clients visé à 5 ans dans le modèle financier ([`business-model.md`](business-model.md)), soit environ 530 dans l'exemple actuel. **HYPOTHÈSE** à justifier par le go to market.
- Le panier annuel moyen se calcule depuis les prix : vente de la box amortie sur sa durée de vie + abonnement annuel.

## 3. Concurrence

### Vue d'ensemble

Le marché des box de cloud personnel est **fragmenté** : quelques start-ups financées, des fabricants de NAS, et des projets libres gratuits. Aucun acteur étudié ne vise spécifiquement les professions soumises au secret avec un service sur place en France (**à confirmer** par une recherche plus large, y compris sur les acteurs français).

### Concurrents directs détaillés

| Acteur | Offre | Prix | Financement et taille | Ce qu'on en retient |
|---|---|---|---|---|
| **Olares One** | Serveur cloud personnel et station IA qui transforme les fichiers locaux en assistant personnel [S6]. GPU RTX 5090 Mobile 24 Go [S7]. Olares OS est libre et gratuit [S8] | 2 899 $ en précommande, 3 999 $ prix public [S9] | Série A de 45 millions de dollars menée par SIG [S10] | **Concurrent le plus proche.** Preuve que le marché existe. Cible : passionnés d'IA, créateurs, développeurs, entreprises soucieuses de la confidentialité [S10]. Pas de service sur place, pas de spécialisation métier, pas centré sur la France |
| **Umbrel Home** | Box préconfigurée avec umbrelOS, magasin d'applications (fichiers, médias, domotique, Bitcoin) [S11] | Lancée à 699 $ en 2023 [S12], vendue ensuite autour de 399 $ [S13] | Fondée en 2020 [S11] | Grand public et passionnés. OS gratuit installable soi-même [S11] |
| **Start9 Server One 2026** | Serveur personnel avec StartOS, orienté souveraineté et Bitcoin [S14] | 749 $ à 1 049 $, **support à vie inclus** (valeur annoncée 300 $), garantie 2 ans [S15] | Petite équipe basée à Denver [S16] | Le support est déjà offert : notre abonnement doit apporter autre chose |
| **ZimaCube** (IceWhale) | NAS « cloud personnel » avec applications tierces (Immich, Plex...) [S17] | 649 $ en version de base, 1 099 $ en version Pro [S17] | Campagne de financement participatif qui a largement dépassé son objectif [S18] | Orienté stockage et créateurs de contenu |

### Autres concurrents à documenter

- **YunoHost** : distribution libre et gratuite pour l'auto-hébergement, d'origine française (**à sourcer**). Concurrent pour les profils techniques, pas pour un cabinet sans informatique.
- **Synology, QNAP** : NAS grand public et PME avec applications (**à sourcer**).
- **Concurrence indirecte** : services d'IA en ligne, y compris spécialisés pour les avocats et hébergés en Europe (**à rechercher et sourcer** : c'est probablement la vraie alternative que les cabinets envisagent).
- **Prestataires informatiques locaux** qui installent des serveurs dans les cabinets : concurrents et futurs partenaires revendeurs.

### Notre différenciation (à valider en entretien)

1. **Service** : installation sur place, support en français, mises à jour de sécurité suivies.
2. **Conformité** : pensé pour le secret professionnel, sans transfert de données hors du cabinet, journal des accès lisible par le client.
3. **Pack métier** : données et modèles de documents utiles à la profession.
4. **Simplicité** : pas besoin de compétences techniques, contrairement à YunoHost, Umbrel ou Start9.

Réponse à préparer : **« Pourquoi vous et pas Olares ? »** (voir [`livrables/questions-jury.md`](../livrables/questions-jury.md)).

## 4. Cadre juridique et acteurs de l'écosystème

- **Secret professionnel** de l'avocat : citer les textes exacts (**à sourcer**).
- **RGPD** : le cabinet est responsable de traitement. Si nous faisons de la sauvegarde hors site ou de l'administration à distance, nous devenons sous-traitant : contrat de sous-traitance nécessaire.
- **Santé et HDS** : un cabinet qui héberge ses propres dossiers patients sur ses serveurs internes n'est pas soumis à la certification HDS [S19]. La certification s'impose à qui héberge pour le compte d'un tiers, y compris l'activité « administration et exploitation du système d'information » [S20]. Elle coûte typiquement 20 000 à 80 000€ sur 3 ans [S19]. Conséquence : pas de santé avant l'année 3, et via un partenaire certifié.
- **Licences** : Nextcloud est sous AGPL (**à vérifier** pour chaque brique effectivement utilisée). La revente est permise, avec des obligations sur le code source.
- **Acteurs** : instances professionnelles (barreaux, CNB), éditeurs de logiciels de gestion de cabinet d'avocats, prestataires informatiques, fabricants de mini-PC, fournisseurs de stockage pour les sauvegardes hors site.
