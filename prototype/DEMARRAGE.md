# Lancer la box en une commande

Ce guide s'adresse à toute l'équipe, sans connaissances techniques particulières. Toute la box tourne dans des conteneurs Docker : rien n'est installé sur la machine à part Docker. Détails de chaque partie : [`plateforme/README.md`](plateforme/README.md), [`ia/README.md`](ia/README.md).

## 1. Prérequis

- Linux avec **Docker Engine 25 ou plus** et le greffon `docker compose` (vérifier : `docker compose version`).
- Pouvoir lancer `docker` sans `sudo` (vérifier : `docker info`). Sinon : `sudo usermod -aG docker $USER`, puis se reconnecter.
- `openssl`, `curl` et `python3` (présents sur la plupart des distributions).
- **Ports 80 et 443 libres** sur la machine.
- Environ 1 Go de mémoire pour les services, plus la mémoire du modèle d'IA choisi (affichée sur la page des modèles).
- **Internet une seule fois**, pour télécharger les images et le modèle d'IA. Ensuite, tout marche câble débranché.

## 2. Installer

```bash
cd prototype/plateforme
./box.sh installer --demo
```

C'est tout. La commande :

1. crée le fichier `.env` et génère tous les mots de passe (ce fichier n'est jamais mis dans git) ;
2. télécharge et construit les images, puis démarre les conteneurs ;
3. attend que chaque service soit prêt ;
4. charge le cabinet **fictif** Corbière Avocats (comptes, dossiers, agendas, contacts) ;
5. affiche les adresses de la box.

Durée mesurée le 4 novembre sur le portable de démo, à partir de zéro : **207 s** (plus long avec une connexion lente). Sans `--demo`, la box est vide ; on peut charger le cabinet fictif plus tard avec `./box.sh donnees-demo`.

Ce qui tourne ensuite (`./box.sh etat` pour le voir) :

| Conteneur | Rôle | Accès à internet |
|---|---|---|
| `proxy` (Caddy) | Porte d'entrée HTTPS, portail de la box | Non (il écoute seulement) |
| `nextcloud`, `nextcloud-cron`, `db`, `cache` | Fichiers, agenda, contacts, tâches de fond | Non |
| `coffre` (Vaultwarden) | Coffre-fort de mots de passe, sur un réseau à part | Non |
| `assistant` | Assistant IA, avec les droits de chaque personne | Non |
| `ia-moteur` (Ollama) | Fait tourner le modèle d'IA | Non |
| `ia-telechargeur` | Télécharge un modèle quand un administrateur le demande | Oui, journalisé |

## 3. Ouvrir la box

1. Ouvrir **https://cabinet.localhost** : c'est le portail, avec un lien vers chaque service et leur état en direct.
2. Le navigateur prévient que le certificat est inconnu : c'est normal, la box a sa propre autorité de certification. Pour ne plus avoir l'alerte, importer `plateforme/sortie/autorite-locale.crt` dans le navigateur ([marche à suivre](plateforme/README.md#faire-confiance-au-certificat-de-la-box)).
3. Se connecter avec un compte fictif. Le mot de passe commun est la valeur `DEMO_MOT_DE_PASSE` du fichier `plateforme/.env`.

| Compte | Rôle | Voit |
|---|---|---|
| `hcorbiere` | Avocate associée, **administratrice** | tous les dossiers |
| `jarnoult` | Avocat collaborateur | dossiers Fournil et Garnier |
| `ibelkacem` | Élève-avocate stagiaire | dossier Fournil seulement |
| `mthevenet` | Assistante juridique | administratif et agendas |

## 4. Choisir le modèle d'IA, à la souris

1. Ouvrir **https://ia.cabinet.localhost/modeles** (ou le bouton « Choisir le modèle » du portail), connecté avec `hcorbiere`.
2. Chaque carte indique la taille à télécharger, la mémoire nécessaire (estimation) et si le modèle tient dans la mémoire de la machine. Préférer un modèle marqué « Tient en mémoire ».
3. Cliquer sur **Installer** : une barre montre le téléchargement. C'est une connexion sortante : elle est inscrite au journal d'audit.
4. Cliquer sur **Activer**. L'assistant charge le modèle et prépare l'index des documents.
5. Poser une question sur **https://ia.cabinet.localhost**. Les questions de la démo sont dans [`docs/prototype.md`](../docs/prototype.md), section 6.

Même chose en ligne de commande : `./box.sh ia` (menu numéroté), ou `./box.sh ia installer qwen3:4b` puis `./box.sh ia activer qwen3:4b`.

Option : **Colibri**, déjà installé hors conteneur sur la machine. Renseigner `COLIBRI_DIR` et `COLIBRI_MODELE` dans `.env`, lancer `./box.sh moteur-ia demarrer`, puis l'activer sur la même page. Colibri n'écoute que sur le réseau interne de la box.

## 5. Avant la démo : vérifier hors ligne

```bash
./box.sh verifier-hors-ligne
```

À lancer **câble débranché et wifi coupé**. Le script vérifie que les services ne joignent pas internet, que l'assistant ne peut pas joindre le coffre-fort, que les pages ne chargent rien de l'extérieur. Résultat attendu : 0 échec.

Pour installer sur une machine **sans internet du tout** : sur une machine connectée, `./box.sh preparer-hors-ligne` produit `sortie/images-box.tar`. Le copier sur la box, puis `docker load -i images-box.tar` et `./box.sh installer --demo`.

## 6. Commandes du quotidien

| Commande | Effet |
|---|---|
| `./box.sh etat` | État des conteneurs et adresses |
| `./box.sh arreter`, `./box.sh demarrer` | Arrêter, redémarrer (les données sont gardées) |
| `./box.sh journaux assistant` | Voir ce que fait un service (ici l'assistant) |
| `./box.sh sauvegarder`, `./box.sh tester-restauration` | Sauvegarde chiffrée, et preuve qu'elle se restaure |
| `./box.sh reinitialiser` | **Efface tout** (demande de taper « effacer »), pour repartir de zéro |
| `./box.sh aide` | Toutes les commandes |

## 7. En cas de problème

| Symptôme | Cause probable | Que faire |
|---|---|---|
| « impossible de parler au démon docker » | Docker arrêté, ou utilisateur hors du groupe `docker` | `sudo systemctl start docker`, ou section 1 |
| Un conteneur ne démarre pas, « port is already allocated » | Un autre logiciel utilise le port 80 ou 443 | L'arrêter (par exemple un autre serveur web), puis `./box.sh demarrer` |
| « nextcloud n'est pas prêt » | Premier démarrage lent, ou erreur | `./box.sh journaux nextcloud` |
| L'assistant affiche « Aucun modèle choisi » | Aucun modèle activé | Section 4 |
| L'assistant est très lent | Modèle trop gros pour la mémoire | Choisir un modèle marqué « Tient en mémoire » |
| Alerte de certificat après une réinstallation | Chaque installation crée une nouvelle autorité | Réimporter `sortie/autorite-locale.crt` |
| `https://cabinet.localhost` ne répond pas depuis un autre ordinateur | La box n'écoute que sur elle-même par défaut | [Accès depuis un autre ordinateur](plateforme/README.md#accès-depuis-un-autre-ordinateur-démo-avec-la-box-posée-sur-la-table) |
