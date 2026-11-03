# Enjeux RSE

Critère de la grille : **2 points**. Le jury veut un **impact mesurable, au-delà de la déclaration d'intention**, avec les impacts positifs **et négatifs**, puis une synthèse.

Responsables : DEV-4 (mesures) et BIZ (présentation). Ils suivent l'atelier Enjeux RSE du mardi 3 novembre à 13h30 et notent ici ce que l'intervenant attend.

## Notes de l'atelier du 3 novembre

_À compléter par BIZ et DEV-4 après l'atelier._

## 1. Mesures à faire sur la box de démo

| Indicateur | Méthode | Valeur |
|---|---|---|
| Puissance au repos (W) | Wattmètre, moyenne sur 5 minutes | _à mesurer_ |
| Puissance en charge (W) | Wattmètre, pendant que l'assistant répond | _à mesurer_ |
| Consommation annuelle (kWh) | Puissance moyenne en W × 8,76 (24 heures × 365 jours / 1 000). Exemple : 40 W donnent environ 350 kWh par an | _à calculer_ |
| Émissions annuelles liées à l'électricité (kg CO2e) | kWh par an × facteur d'émission de l'électricité en France (**à sourcer**, par exemple dans la Base Empreinte de l'ADEME) | _à calculer_ |
| Empreinte de fabrication du matériel | Donnée fabricant ou base de données publique (**à sourcer**) | _à rechercher_ |

## 2. Impacts négatifs (à présenter honnêtement)

- **Fabrication** du matériel : c'est souvent la plus grosse part de l'empreinte d'un équipement informatique.
- **Consommation continue** : la box est allumée en permanence, et un GPU consomme beaucoup en charge.
- Un serveur dans chaque cabinet est **moins mutualisé** qu'un grand centre de données. Ne pas prétendre que le local est forcément plus écologique que le cloud : ce n'est pas démontré.

## 3. Impacts positifs

- **Sociétal** : protection du secret professionnel et des données des clients des cabinets ; aucune donnée transférée hors du cabinet, donc hors de l'Union européenne.
- **Souveraineté** : moins de dépendance à des services étrangers.
- **Durée de vie** : engagement de mises à jour sur plusieurs années (**durée à fixer**), réparabilité, remplacement de pièces plutôt que de la box entière.
- **Matériel reconditionné** en option, à chiffrer.
- **Sobriété** : modèle d'IA dimensionné au besoin réel du cabinet plutôt que le plus gros possible ; mise en veille du GPU hors usage.

## 4. Indicateurs à suivre dans l'entreprise

- kWh par an et par cabinet client.
- Part de box en matériel reconditionné.
- Durée de vie moyenne des box en service.
- Nombre de cabinets clients sans aucun transfert de données hors du cabinet.

## 5. Synthèse pour la slide

Une phrase par point : le chiffre de consommation mesuré, l'impact négatif principal, l'impact positif principal, les deux actions concrètes pour réduire le négatif. **_À rédiger le mercredi soir avec les vraies mesures._**
