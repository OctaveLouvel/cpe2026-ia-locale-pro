# Questions probables du jury

Entraînement du jeudi soir : chacun répond à voix haute à 5 questions, en moins d'une minute chacune. Les éléments de réponse sont des **pistes** : les remplacer par nos vrais chiffres et nos vrais entretiens.

## Marché et concurrence

**Pourquoi vous et pas Olares One, qui a levé 45 millions de dollars ?**
Olares vise les passionnés d'IA, créateurs et développeurs, avec une machine puissante à installer soi-même, sans service sur place. Nous vendons un service clé en main à des cabinets sans informatique, avec installation, mises à jour, conformité au secret professionnel et pack métier. Leur levée prouve que le marché de l'IA locale existe.

**Pourquoi un cabinet ne prendrait-il pas YunoHost ou Umbrel, qui sont gratuits ?**
Parce qu'il faut savoir les installer, les sécuriser et les maintenir. Un petit cabinet n'a personne pour le faire. [Citation d'entretien si disponible.]

**Pourquoi pas une IA en ligne hébergée en Europe ?**
[À préparer après la recherche sur les concurrents indirects.] Pistes : les données quittent quand même le cabinet, dépendance au fournisseur, coût par utilisateur dans la durée. Rester honnête : pour certains cabinets, ce sera une vraie alternative.

**Combien d'entretiens avez-vous faits, et qu'ont-ils dit ?**
[Chiffres exacts de `entretiens/suivi.md`. Une citation autorisée. Ce qui nous a surpris.]

**Les cabinets sont-ils vraiment prêts à payer ?**
[Prix évoqués en entretien, marques d'intérêt écrites, ce qu'ils paient déjà pour leur informatique.]

## Produit et technique

**Qu'avez-vous développé vous-mêmes ?**
L'installeur, le tableau de bord, le journal d'audit, le service d'assistant qui croise les données, respecte les droits et cite ses sources, et le pack métier. Les briques de base sont des logiciels libres reconnus, ce qui est un gage de sécurité.

**Et si l'IA invente une réponse dans un dossier juridique ?**
Elle cite toujours ses sources, répond « je ne trouve pas » quand rien n'est pertinent, et l'interface rappelle qu'il faut vérifier. L'assistant aide à chercher et résumer, il ne remplace pas le professionnel.

**Que se passe-t-il si la box est volée, tombe en panne ou brûle ?**
Disque chiffré : un voleur ne lit rien. Sauvegarde locale et sauvegarde hors site chiffrée côté client. Box de remplacement et restauration sous [délai à définir].

**Comment faites-vous les mises à jour si la box est hors ligne ?**
Les connexions sortantes sont optionnelles. Le client autorise la mise à jour (fenêtre planifiée ou action manuelle), elle est chiffrée et inscrite dans le journal. Sans connexion, intervention sur place.

**Qui est responsable en cas de faille ?**
[Contrat de service, délai d'application des correctifs, assurance responsabilité civile professionnelle à prévoir. Ne pas improviser une réponse juridique : dire ce qui est prévu et ce qui reste à valider avec un juriste.]

**Quelle est la qualité de l'IA sur un matériel abordable ?**
[Mesures réelles : temps de réponse, tokens par seconde, sur le matériel de démo.]

**Combien de temps et de personnes pour passer du prototype au produit ?**
[Roadmap technique de `docs/prototype.md`, section 7.]

## Juridique

**Êtes-vous conformes au RGPD ? Avez-vous besoin d'une certification ?**
Le cabinet reste responsable de traitement et les données restent chez lui. Si nous faisons la sauvegarde hors site ou l'administration à distance, nous sommes sous-traitant, avec le contrat qui va avec. Pour la santé, la certification HDS s'imposerait dans ce cas : c'est pour ça que la santé arrive en année 3, via un partenaire certifié.

**Les licences des logiciels libres vous autorisent-elles à les revendre ?**
Oui, avec des obligations : par exemple, les briques sous licence AGPL imposent de fournir le code source des modifications. [Liste des licences vérifiées par DEV-4.]

## Business et finance

**Pourquoi ce prix ?**
[Coût matériel réel, marge, prix évoqués en entretien, comparaison avec Olares et avec ce que les cabinets paient déjà.]

**Combien coûte l'acquisition d'un cabinet ?**
[Calcul du go to market.]

**Pourquoi un abonnement si le support est gratuit chez Start9 ?**
Notre abonnement couvre les mises à jour de sécurité suivies, la sauvegarde hors site, les mises à jour des modèles et du pack métier, l'intervention sur place et le remplacement de la box.

**Avez-vous besoin de lever des fonds ?**
[Besoin de trésorerie du modèle : le matériel est payé avant d'être vendu. Sources et calendrier.]

**Pourquoi le B2B et pas les particuliers ?**
Les particuliers disent tenir à leur vie privée mais paient rarement pour la protéger, et les acquérir coûte cher. Les avocats ont une obligation légale de confidentialité, un décideur identifiable et un budget.

## RSE

**Une box allumée en permanence dans chaque cabinet, ce n'est pas écologique.**
C'est vrai, et nous l'avons mesuré : [kWh par an]. Nous le réduisons par [mise en veille du GPU, matériel reconditionné, durée de vie longue]. L'impact positif principal est sociétal : la protection des données des clients.

## Questions réellement posées

_À remplir juste après le passage du vendredi, pour la finale et pour la suite._

| Question | Qui a répondu | Bonne réponse ? | À améliorer |
|---|---|---|---|
| | | | |
