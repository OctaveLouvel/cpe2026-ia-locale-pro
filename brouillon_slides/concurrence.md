# Concurrence et positionnement (asoterIA)

Sources associées : [`docs/sources.md`](../docs/sources.md) (références [S6] à [S18] et [S26] à [S33]).

---

## 1. Brouillon de tableau comparatif (pour les slides)

Ce tableau synthétique croise les grandes familles de concurrents sur nos axes de valeur :

| Axe de comparaison | **asoterIA (Nous)** | **IA juridiques Cloud**<br>*(GenIA-L Dalloz, Predictice / Doctrine, Jimini, Septeo)* | **Box Cloud & IA perso**<br>*(Olares One, Start9, Umbrel Home)* | **Box IA juridique**<br>*(LegisBox Cabinet)* | **Auto-hébergement libre**<br>*(YunoHost, NAS Synology)* |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cible principale** | **Cabinets de 1 à 10 avocats (sans service IT)** | Tous cabinets (surtout moyens et grands) | Passionnés tech, développeurs, créateurs [S10, S11, S14] | Cabinets d'avocats (1 à 10 avocats) [S31] | Profils techniques, geeks, associations [S32] |
| **100% local et hors ligne** | **Oui** *(aucune donnée ne sort du cabinet)* | **Non** *(serveurs distants en France / UE)* | **Oui** *(local, mais connecté par défaut)* | **Oui** *(serveur sur site)* [S31] | **Oui** *(si configuré en local)* |
| **Veille juridique & citations** | **Oui** *(citations par page + lois et jurisprudence)* | **Oui** *(fonds Dalloz, LexisNexis, Légifrance)* [S27, S28] | **Non** *(IA générique sur fichiers locaux)* [S6] | **Oui** *(Légifrance, Cour de cassation)* [S31] | **Non** |
| **Cloud privé complet inclus** | **Oui** *(fichiers, agenda, contacts, coffre-fort isolé)* | **Non** *(IA seule ou option d'un logiciel métier)* | **Oui** *(magasin d'applications)* [S8, S11] | **Partiel** *(agenda, outils PDF/Word)* [S31] | **Oui** *(Nextcloud, etc.)* [S32] |
| **Installation sur site & support FR** | **Oui** *(clé en main, matériel et support inclus)* | Déploiement en ligne, support éditeur | **Non** *(livré nu, à configurer soi-même)* | **Oui** *(avec engagement de 36 mois)* [S31] | **Non** *(tout est à faire soi-même)* |
| **Frais d'installation / matériel** | **1 500 €** *(mise à disposition + installation)* | 0 € *(hors frais de déploiement logiciel)* | **399 $ à 3 999 $** *(achat du boîtier seul)* [S9, S13, S33] | 0 € *(mais engagement 36 mois imposé)* [S31] | **300 € à 1 500 €** *(achat du serveur nu)* |
| **Abonnement mensuel** | **250 € / mois par cabinet** *(1 à 10 pers.)* | **213 € à 250 €+ HT / mois / utilisateur** [S27, S28] | **0 €** *(ou ~200 $/an d'aide chez Start9)* [S33] | **499 € à 1 799 € HT / mois par cabinet** [S31] | **0 €** *(logiciel libre)* [S32] |
| **Coût total sur 3 ans**<br>*(ex. cabinet de 5 avocats)* | **10 500 €**<br>*(tout compris)* | **38 340 € à 45 000 €+**<br>*(5 licences à 213-250 €/mois)* | **~3 000 € à 4 500 €**<br>*(sans installation ni droit)* | **35 964 €**<br>*(Plan Pro 4-6 avocats à 999 €/mois)* | **~1 000 €**<br>*(+ dizaines d'heures d'administration IT)* |

---

## 2. Zoom détaillé par concurrent (attendu par la grille du jury)

Le jury demande de détailler **au moins 3 concurrents** (taille, fonctionnalités, stratégie, levées de fonds).

| Concurrent | Catégorie & Fonctionnalités | Prix actuels relevés | Financement, taille & actualité | Pourquoi asoterIA gagne face à eux |
| :--- | :--- | :--- | :--- | :--- |
| **1. Olares One** | **Box Cloud & IA locale.** Mini-PC ultra-puissant (Core Ultra 9, RTX 5090M 24 Go, 96 Go RAM) qui indexe les fichiers locaux avec l'OS libre Olares OS [S6, S7, S8]. | **2 899 $** en précommande, **3 999 $ à 4 999 $** prix public [S8, S9]. Pas d'abonnement. | **45 M$ levés en Série A** (menée par SIG) [S10]. Cible mondiale de créateurs et développeurs. | Leur levée prouve que le marché de l'IA locale existe. Mais Olares vend une machine très chère à installer soi-même, sans support en France, sans veille juridique et surdimensionnée pour un petit cabinet. |
| **2. Doctrine / Predictice & GenIA-L (Dalloz)** | **IA juridiques Cloud.** Recherche jurisprudentielle, analyse de pièces et rédaction adossées aux bases de droit françaises [S27, S28]. | **GenIA-L** : dès **213 € HT / mois / utilisateur** [S27].<br>**Predictice** : dès **250 € HT / mois** (Essentiel) ou sur devis [S28].<br>**Doctrine** : sur devis [S28]. | **Forte concentration** : Doctrine a racheté Predictice (~20 M€ en sept. 2025), puis le géant mondial **LexisNexis (RELX) a racheté Doctrine en sept. 2026** [S28]. | Ce sont les acteurs de référence sur le contenu juridique, mais : 1) les dossiers partent dans le cloud (frein pour 81% des avocats [S26]), 2) le rachat par un géant anglo-néerlandais inquiète sur la souveraineté, 3) à 250 € / mois *par avocat*, un cabinet de 4 avocats paie 1 000 € / mois contre **250 € / mois** chez nous. |
| **3. Jimini AI & Septeo Brain (Secib)** | **Copilotes IA juridiques en ligne.** Intégrés à Word/Outlook (Jimini) ou au logiciel de gestion du cabinet (Septeo Brain dans Secib, Kleos Expert AI) [S29, S30]. | **Jimini AI** : sur devis [S29].<br>**Secib** : dès **65 € HT / mois / utilisateur** + option Septeo Brain sur devis [S30].<br>**Kleos** : 50 à 90 € HT / mois / utilisateur [S30]. | **Jimini AI** : start-up française (2023), **1,9 M€ levés** (Polytechnique Ventures), partenaire du CNB [S29].<br>**Septeo** : grand groupe logiciel européen [S30]. | Hébergement en France/UE rassurant, mais l'architecture reste 100% en ligne (incompatible avec une exigence « zéro transfert externe ») et la tarification par siège pénalise les structures de 2 à 10 personnes. |
| **4. Start9 (Server One) & Umbrel (Home)** | **Serveurs personnels auto-hébergés.** Boîtiers plug-and-play (Nextcloud, Vaultwarden, petits modèles IA locaux) [S11, S14]. | **Umbrel Home** : **399 $** [S13].<br>**Start9 Server One** : **899 $** (**999 € à 1 139 €** en Europe), support inclus avec le boîtier [S15, S33]. | **Start9** : PME américaine (Denver) [S16].<br>**Umbrel** : fondée en 2020 [S11].<br>**ZimaCube** : 649 $ à 1 099 $ [S17]. | Pas chers à l'achat, mais orientés particuliers / Bitcoin. **Attention au piège du jury** : Start9 inclut le support à vie. Nous justifions nos 250 € / mois par la **location du matériel, la veille juridique continue, le déplacement sur site et les sauvegardes**. |
| **5. LegisBox Cabinet (EYA SAS)** | **Box IA juridique sur site.** Serveur local pour avocats avec assistant IA (Lex), Légifrance / Cour de cassation et outils PDF/Word [S31]. | Engagement 36 mois :<br>- 1 à 3 avocats : **499 € HT / mois**<br>- 4 à 6 avocats : **999 € HT / mois**<br>- 7 à 10 avocats : **1 799 € HT / mois** [S31] | Jeune société française (EYA SAS) [S31]. | **Validation directe de notre concept** de box IA locale pour avocats. **Notre avantage** : avec 1 500 € d'installation + 250 € / mois, nous sommes **2 à 7 fois moins chers chaque mois**, tout en incluant le cloud privé complet du cabinet. |

---

## 3. Matrice de positionnement (2 axes) pour la slide Concurrence

Pour accompagner le tableau d'un schéma visuel sur la slide Concurrence :

- **Axe horizontal** : *De « Générique / Technique (à monter soi-même) » à « Spécialisé Droit français & Clé en main »*.
- **Axe vertical** : *De « Données dans le Cloud & Prix par utilisateur » à « 100% Local (Hors ligne) & Prix fixe par cabinet »*.

**Positionnement des acteurs sur les 4 quadrants :**
1. **En bas à gauche (Cloud + Générique)** : ChatGPT, Claude, Gemini grand public *(risque maximal de fuite de données et d'hallucinations juridiques)*.
2. **En haut à gauche (100% Local + Générique / Technique)** : **Olares One, Start9, Umbrel, ZimaCube, YunoHost** *(les données restent en local, mais aucune base juridique et nécessite des compétences IT)*.
3. **En bas à droite (Cloud + Spécialisé Droit)** : **GenIA-L (Dalloz), Doctrine / Predictice (LexisNexis), Jimini AI, Septeo Brain** *(pertinence juridique, mais les dossiers quittent le cabinet et le prix par utilisateur explose)*.
4. **En haut à droite (100% Local + Spécialisé Droit & Clé en main)** : **asoterIA** *(ainsi que LegisBox, mais **asoterIA** se démarque nettement par son tarif unique accessible à **250 € / mois** par cabinet et sa suite de cloud privé complète)*.
