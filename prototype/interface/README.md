# Interface et vitrine (DEV-3)

Deux parties, en Python sans dépendance et sans aucune ressource externe (polices, scripts, icônes sont dans les pages).

| Partie | Où elle tourne | Adresse |
|---|---|---|
| [`tableau-de-bord/`](tableau-de-bord/) : page d'accueil de la box | Dans la box, conteneur `tableau-de-bord` | https://cabinet.localhost |
| [`landing/`](landing/) : landing page et liste d'attente | Sur internet, chez un hébergeur (à choisir) | à publier |

## Tableau de bord de la box

Lancé avec le reste de la box : `./box.sh installer` (voir [`../plateforme/README.md`](../plateforme/README.md)). Aucune image à construire : le service utilise l'image `python:3.12-slim`, déjà présente pour les outils, avec ce dossier monté en lecture seule. Après une modification de la page : `docker compose restart tableau-de-bord` dans `prototype/plateforme/`.

Ce qu'il montre, en direct (rafraîchi toutes les 30 secondes) :

- **état des services** : Nextcloud, coffre-fort, assistant IA (nombre de documents indexés, modèle actif), moteur d'IA ;
- **connexions sortantes** : depuis quand rien n'est sorti de la box, la dernière connexion et le nombre sur 30 jours ;
- **dernière sauvegarde** réussie, dernier test de restauration ;
- **dernière vérification hors ligne** (`./box.sh verifier-hors-ligne`) ;
- **mises à jour** : date d'installation et versions de chaque brique, lues dans `compose.yaml` ;
- accès aux services et lien vers le **journal d'audit** détaillé de DEV-4 (https://ia.cabinet.localhost/journal, réservé aux administrateurs).

D'où viennent les données : routes de santé des services sur le réseau interne, journaux `prototype/plateforme/sortie/journal/*.jsonl` (montés en lecture seule ; un nouveau journal de DEV-4 au même format est pris en compte sans rien changer), et `compose.yaml`. Le tableau de bord ne lit **aucune donnée du cabinet** et n'affiche ni nom de personne ni question posée : il est visible de tous les postes. Le coffre-fort étant sur un réseau à part, son état est lu par la page à travers le reverse proxy (`/etat/coffre`).

| Fichier | Rôle |
|---|---|
| `tableau_de_bord/serveur.py` | Serveur web : `/` (page), `/api/resume` (état), `/api/sante` (santé du conteneur) |
| `tableau_de_bord/collecte.py` | Lecture des services, des journaux et des versions |
| `tableau_de_bord/page.html` | La page (HTML, CSS et JavaScript dans un seul fichier) |

Pour la démo (étape 2 du scénario, `docs/prototype.md` section 6) : lancer `./box.sh sauvegarder` le matin, pour que la carte « Dernière sauvegarde » soit verte, et `./box.sh verifier-hors-ligne` câble débranché juste avant le passage.

## Landing page et liste d'attente

```bash
cd prototype/interface/landing
python3 serveur.py                         # http://127.0.0.1:8080, à placer derrière un reverse proxy HTTPS
python3 serveur.py compter                 # nombre d'inscrits, à noter chaque soir
python3 serveur.py desinscrire <adresse>   # demande de retrait
```

Réglages par variables d'environnement : `LANDING_ADRESSE` (défaut `127.0.0.1`), `LANDING_PORT` (défaut `8080`), `LANDING_DONNEES` (défaut `./donnees/`, ignoré par git).

Formulaire conforme au RGPD : seule l'adresse est obligatoire (taille du cabinet et fonction facultatives), case d'accord non cochée par défaut, finalité écrite à côté de la case, lien vers la [mention de confidentialité](landing/confidentialite.html). Aucun cookie, aucune mesure d'audience, aucune adresse IP dans les journaux. Le formulaire marche sans JavaScript. Protection contre les robots : champ caché piège et 10 essais par heure et par adresse IP. Une adresse déjà inscrite n'est pas doublée. Les inscriptions (`donnees/inscriptions.csv`, droits 600) ne doivent **jamais** être copiées dans le dépôt.

Testé le 4 novembre en local : adresse invalide refusée, case non cochée refusée, doublon ignoré, robot ignoré, limite d'essais, comptage et désinscription.

**Avant de publier** (le serveur affiche un avertissement tant que ce n'est pas fait) :

1. **BIZ** relit et valide le texte de la page : c'est un texte provisoire de DEV-3, tiré du README (problème, solution). Il ne contient ni prix, ni client, ni avis, ni chiffre, et dit clairement que le produit n'est pas encore commercialisé.
2. Remplacer `[Nom du projet]` et `[adresse de contact]` dans les deux pages, et `[hébergeur et pays d'hébergement]` dans `confidentialite.html`.
3. Valider en équipe la durée de conservation écrite dans la mention (fin du projet, au plus 12 mois après l'inscription).
4. Choisir l'hébergement (décision d'équipe, voir README section 8) : par exemple une petite VM avec Caddy devant `serveur.py`. Le serveur doit garder les inscriptions sur disque : un hébergement de pages statiques seules ne suffit pas.
