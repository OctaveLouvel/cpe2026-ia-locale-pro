# Plateforme de la box (DEV-1)

Les services de base de la box, installés et vérifiés par un seul script : `./box.sh`. Spécification d'ensemble : [`docs/prototype.md`](../../docs/prototype.md).

| Service | Brique | Adresse (domaine par défaut) |
|---|---|---|
| Tableau de bord (DEV-3) : état des services, sauvegardes, connexions sortantes, versions | Python, [`../interface/tableau-de-bord/`](../interface/tableau-de-bord/) | https://cabinet.localhost |
| Fichiers, agenda, contacts | Nextcloud 34 + applications Agenda et Contacts | https://cloud.cabinet.localhost |
| Coffre-fort de mots de passe | Vaultwarden (compatible Bitwarden) | https://coffre.cabinet.localhost |
| Reverse proxy TLS avec autorité de certification locale | Caddy 2.11 | ports 80 et 443 |
| Base de données et cache de Nextcloud | PostgreSQL 17, Valkey 8.1 | réseau interne seulement |
| Sauvegarde chiffrée | restic 0.19 | à la demande, ou chaque nuit |

## Démarrage rapide

Prérequis : Linux, Docker Engine 25 ou plus avec le greffon `docker compose`, ports 80 et 443 libres, `openssl`, `python3` (pour l'assistant d'installation), environ 1 Go de mémoire libre pour ces services (sans l'IA). Connexion internet nécessaire **une seule fois**, pour télécharger les images.

```bash
cd prototype/plateforme
./box.sh installer --demo   # en une commande : toute la box (assistant IA compris) et le cabinet FICTIF
                            # (sans --demo : box vide, puis ./box.sh donnees-demo plus tard)
```

Puis ouvrir https://cloud.cabinet.localhost et se connecter avec un compte du tableau ci-dessous. Le mot de passe commun est `DEMO_MOT_DE_PASSE` dans le fichier `.env`.

| Compte | Rôle | Voit |
|---|---|---|
| `hcorbiere` | Avocate associée | tous les dossiers |
| `jarnoult` | Avocat collaborateur | dossiers Fournil et Garnier |
| `ibelkacem` | Élève-avocate stagiaire | dossier Fournil seulement |
| `mthevenet` | Assistante juridique | administratif et agendas |

Détail des données et des droits : [`../donnees-demo/README.md`](../donnees-demo/README.md).

## Faire confiance au certificat de la box

Les certificats sont signés par l'autorité de certification propre à la box : aucune autorité publique, tout marche sans internet. Chaque poste doit lui faire confiance une fois.

1. Récupérer `sortie/autorite-locale.crt` (copié par `./box.sh installer`), ou le télécharger sur `http://<domaine>/autorite-locale.crt`.
2. Comparer son empreinte SHA-256 avec celle affichée par `./box.sh certificat`.
3. L'importer : Firefox, Paramètres > Vie privée et sécurité > Certificats > Afficher les certificats > Autorités > Importer (cocher « sites web ») ; Chrome sous Linux, Paramètres > Confidentialité > Sécurité > Gérer les certificats > Autorités ; système Debian, copier dans `/usr/local/share/ca-certificates/` puis `update-ca-certificates`.

Chaque installation crée une nouvelle autorité : après `./box.sh reinitialiser`, il faut réimporter le certificat. Une restauration de sauvegarde, elle, conserve l'autorité.

## Accès depuis un autre ordinateur (démo avec la box posée sur la table)

Le domaine `cabinet.localhost` ne fonctionne que sur la box elle-même. Pour la démo depuis l'ordinateur de présentation, relié par câble ou par un petit switch :

1. Dans `.env` : `BIND_ADDRESS=0.0.0.0` et `BOX_DOMAIN=cabinet.internal` (domaine réservé à l'usage privé). Pour changer de domaine, réinstaller : `./box.sh reinitialiser` puis `./box.sh installer` et `./box.sh donnees-demo`.
2. Sur l'ordinateur de présentation, ajouter au fichier hosts (`/etc/hosts`, ou `C:\Windows\System32\drivers\etc\hosts`) l'adresse IP de la box :
   ```
   192.168.50.1  cabinet.internal cloud.cabinet.internal coffre.cabinet.internal
   ```
3. Importer le certificat racine (section précédente).

Ne pas utiliser `BIND_ADDRESS=0.0.0.0` sur le wifi de l'école : la box serait visible de tout le réseau.

## Commandes

| Commande | Effet |
|---|---|
| `./box.sh installer` | Crée `.env`, construit l'image Nextcloud si besoin, démarre et attend que tout soit prêt |
| `./box.sh donnees-demo` | Charge le cabinet fictif. Relançable : rien n'est créé en double |
| `./box.sh assistant [adresse]` | Assistant web de première configuration (voir plus bas) |
| `./box.sh etat`, `demarrer`, `arreter`, `journaux [service]` | Exploitation courante |
| `./box.sh sauvegarder` | Instantané chiffré vers le disque externe |
| `./box.sh sauvegardes` | Liste des instantanés |
| `./box.sh tester-restauration` | Restauration réelle dans un projet isolé, puis vérifications |
| `./box.sh restaurer [instantané]` | Reconstruit la box depuis une sauvegarde : **remplace les données** |
| `./box.sh verifier-hors-ligne` | Liste de vérification de la démo, à lancer câble débranché |
| `./box.sh preparer-hors-ligne` | Exporte toutes les images dans `sortie/images-box.tar` |
| `./box.sh reinitialiser` | Supprime conteneurs et volumes (demande de taper « effacer ») |

## Assistant d'installation

`./box.sh assistant` lance un petit serveur web local (Python, sans dépendance) et affiche un lien avec un jeton d'accès. Cinq écrans :

1. **État de la box** : services démarrés, connexion à internet.
2. **Cabinet** : nom du cabinet, création du compte administrateur (l'associé), invitation au coffre-fort.
3. **Services** : coffre-fort, assistant IA (si installé), accès distant pour le support (désactivé par défaut).
4. **Sécurité** : chiffrement du disque vérifié (LUKS), empreinte du certificat, choix du disque externe et **première sauvegarde**, puis test de restauration en option.
5. **Fiche de secours** à imprimer : adresses, empreinte du certificat, phrase de passe des sauvegardes.

Testé de bout en bout le 3 novembre 2026 (accès refusé sans jeton, création du compte, sauvegarde réelle). Sur ce portable de développement, l'écran 4 indique honnêtement que le disque n'est pas chiffré.

## Hors ligne : ce qui est garanti et comment

- **Isolement par construction** : tous les services sont sur le réseau Docker `interne`, marqué `internal`, qui n'a aucune route vers internet. Seul le reverse proxy est aussi sur le réseau `frontal`, pour recevoir les connexions des postes. La sauvegarde tourne sans aucun réseau.
- **Nextcloud** : magasin d'applications, vérification des mises à jour, aperçus de liens, serveur de recherche fédérée et envoi de courriels coupés ; applications qui appellent des services externes désactivées (météo, annonces, sondage...). Agenda et Contacts sont intégrés à l'image : aucun téléchargement à l'installation. Détail : [`nextcloud/hooks/post-installation/10-box-hors-ligne.sh`](nextcloud/hooks/post-installation/10-box-hors-ligne.sh).
- **Coffre-fort** : téléchargement des icônes de sites désactivé.
- **Certificats** : autorité locale de Caddy, renouvellement automatique sans internet.
- **Installation sans internet** : `./box.sh preparer-hors-ligne` exporte les images ; sur la box, `docker load -i images-box.tar` puis `./box.sh installer`.

`./box.sh verifier-hors-ligne` contrôle tout cela (réseaux, réglages, pages sans ressource externe, données, refus d'accès, journal d'audit). Résultat le 3 novembre sur le portable de développement : 0 échec, 2 alertes attendues (machine encore connectée, écoute limitée à la machine). **Le vrai test câble débranché reste à faire le mercredi 4 novembre à 16 h sur le matériel de démo.**

## Sauvegarde chiffrée

Un instantané contient : l'export de la base Nextcloud et de ses rôles, une copie cohérente de la base du coffre-fort, les fichiers des utilisateurs, la configuration et les applications de Nextcloud, l'autorité de certification locale et le fichier `.env`. Le code des logiciels n'est pas sauvegardé : il vient des images. Nextcloud passe en mode maintenance pendant la copie (quelques secondes).

- **Chiffrement côté client** par restic (AES-256) avec `SAUVEGARDE_MOT_DE_PASSE`. Sans cette phrase de passe, la sauvegarde est illisible, y compris pour nous : elle figure sur la fiche de secours remise au cabinet.
- **Destination** : `SAUVEGARDE_DESTINATION` dans `.env`, un dossier du disque externe (chemin absolu).
- **Rotation** : 7 sauvegardes quotidiennes, 4 hebdomadaires, 12 mensuelles.
- **Chaque nuit** sur une box réelle : tâche cron installée par [`systeme/preparer-debian.sh`](systeme/preparer-debian.sh).

Mesures du 3 novembre 2026 sur le portable de développement, avec le jeu de démonstration et un dossier local à la place du disque externe : sauvegarde en 5 à 8 secondes ; **restauration complète et vérifiée en 39 à 40 secondes** (deux essais) (lecture de l'instantané, recopie, base de données, redémarrage). Le test vérifie : Nextcloud installé et hors maintenance ; mêmes nombres de comptes, fichiers, partages, événements et contacts que la box en service ; un document relu par WebDAV identique à l'original (sha256) ; coffre-fort en bonne santé ; autorité de certification identique. Les fichiers restaurés en clair sont supprimés à la fin du test. Sauvegarde hors site (copie du dépôt chiffré) : pas encore faite.

## Coffre-fort : compte de l'associée

Le chiffrement du coffre se fait dans le navigateur : la box ne connaît jamais le mot de passe maître, donc le compte ne peut pas être créé par script. `./box.sh donnees-demo` envoie seulement l'invitation. Pour la démo :

1. Ouvrir https://coffre.cabinet.localhost, « Créer un compte » avec `h.corbiere@corbiere-avocats.example`.
2. Ajouter les entrées fictives de `cabinet.json` (« RPVA - clé e-Barreau (FICTIF) », « Banque du cabinet (FICTIF) »...), avec des mots de passe générés par le coffre.

## Pour les autres équipes

- **Ajouter un service** (assistant IA, tableau de bord) : le déclarer dans `compose.yaml` sur le réseau `interne`, et ajouter sa route dans [`caddy/sites/`](caddy/sites/) (exemple dans le README de ce dossier). Aucun service ne doit être relié au réseau `frontal`.
- **DEV-2, droits de l'assistant** : l'assistant interroge Nextcloud avec les droits de la personne qui pose la question. Depuis le réseau interne : `http://nextcloud/remote.php/dav/files/<compte>/` (fichiers, WebDAV), `http://nextcloud/remote.php/dav/calendars/<compte>/` (agendas, CalDAV), `http://nextcloud/remote.php/dav/addressbooks/users/<compte>/` (contacts, CardDAV). Ce que Nextcloud ne renvoie pas à un compte, l'assistant ne doit pas le voir. Pour un premier prototype sans Nextcloud, [`../donnees-demo/index.json`](../donnees-demo/index.json) donne les lecteurs autorisés de chaque document. Le coffre-fort n'est relié à rien de tout cela.
- **DEV-3, tableau de bord** : fait, service `tableau-de-bord` sur le domaine principal ; voir [`../interface/README.md`](../interface/README.md).
- **DEV-4, journal d'audit** : deux sources déjà disponibles. Le journal d'audit de Nextcloud (`data/audit.log` dans le volume `box_nextcloud_donnees` : connexions, accès et partages de fichiers, au format JSON) et le journal de la plateforme `sortie/journal/evenements.jsonl` (installation, sauvegardes, restaurations, vérifications), au format `{"date", "source", "type", "detail", "resultat"}`.

## Système de la box

[`systeme/preparer-debian.sh`](systeme/preparer-debian.sh) prépare une Debian 13 neuve : vérification du chiffrement du disque (LUKS, à choisir à l'installation de Debian), Docker 26.1 et Compose 2.26 des paquets Debian, journaux Docker limités, pare-feu (80 et 443 ouverts au réseau local seulement), sauvegarde chaque nuit. **Écrit mais pas encore exécuté sur une machine réelle.** À décider avec DEV-4 : déverrouillage du disque au démarrage (phrase de passe tapée ou TPM), filtrage des connexions sortantes.

## Versions et licences

Versions figées dans [`compose.yaml`](compose.yaml) et [`nextcloud/Dockerfile`](nextcloud/Dockerfile). Licences relevées le 3 novembre 2026 sur les dépôts officiels (source [S22] de [`docs/sources.md`](../../docs/sources.md)) ; à reprendre par DEV-4 pour la partie cadre juridique.

| Brique | Version | Licence |
|---|---|---|
| Nextcloud (serveur), Agenda, Contacts | 34.0.5, 6.6.4, 8.9.3 | AGPL-3.0 |
| Vaultwarden | 1.37.5 | AGPL-3.0 |
| Coffre web Bitwarden (inclus dans l'image Vaultwarden) | - | GPL-3.0 |
| Caddy | 2.11.7 | Apache-2.0 |
| PostgreSQL | 17.11 | Licence PostgreSQL (permissive) |
| Valkey | 8.1.11 | BSD-3-Clause |
| restic | 0.19.1 | BSD-2-Clause |

Les briques sous AGPL sont utilisées sans modification de leur code : nous ne les modifions que par leur configuration.

## Limites connues

- Le jeton d'administration du coffre-fort est en clair dans `.env` (Vaultwarden recommande un hachage Argon2).
- Les courriels sont désactivés : pas de notification, pas de réinitialisation de mot de passe par courriel.
- Le choix « coffre-fort désactivé » de l'assistant arrête le service, mais `./box.sh demarrer` le relance.
- Accès distant (WireGuard) : à brancher par DEV-4.
