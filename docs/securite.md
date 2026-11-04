# Sécurité de la box

Responsable : DEV-4. Ce document distingue toujours ce qui est **en place et vérifié dans le prototype** de ce qui **reste à faire**. Ne présenter au jury comme acquis que la première colonne.

Vérification automatique de la plupart des points ci-dessous : `./box.sh verifier-hors-ligne` (voir [`prototype/plateforme/README.md`](../prototype/plateforme/README.md)).

## 1. Modèle de menace

| Menace | Comment elle arrive | En place dans le prototype | Reste à faire |
|---|---|---|---|
| **Vol de la box** | Cambriolage du cabinet, box emportée | Coffre-fort chiffré dans le navigateur (le serveur ne connaît pas les mots de passe) ; sauvegardes chiffrées et restaurables sur une box neuve (restauration mesurée à 39-40 s) | **Chiffrement du disque (LUKS)** : choisi à l'installation de Debian, contrôlé par [`preparer-debian.sh`](../prototype/plateforme/systeme/preparer-debian.sh) ; le portable de démo n'est pas chiffré. Choisir le déverrouillage au démarrage : phrase tapée (sûr, mais la box ne redémarre pas seule) ou puce TPM (redémarre seule, protège moins si toute la box est volée) |
| **Rançongiciel sur un poste du cabinet** | Pièce jointe piégée, le poste chiffre les fichiers synchronisés | Sauvegardes versionnées (7 quotidiennes, 4 hebdomadaires, 12 mensuelles) sur disque externe, non accessibles depuis les postes ; restauration réelle testée | Copie hors site chiffrée ; dépôt de sauvegarde en ajout seul, pour qu'une box compromise ne puisse pas effacer ses sauvegardes |
| **Fuite par l'IA** | L'assistant montre à quelqu'un un dossier qui ne lui est pas destiné, ou envoie des données dehors | L'assistant lit avec les droits de la personne (Nextcloud décide) ; refus sans appel au modèle pour un nom inconnu ou une demande de mot de passe ; **coffre-fort sur un réseau séparé, injoignable par l'assistant (vérifié)** ; assistant et moteur sans accès à internet (vérifié) ; chaque question au journal | Garder l'index de recherche sur le disque chiffré de la box (c'est le cas sur une box préparée avec le script) |
| **Accès distant abusé** | Un accès de support laissé ouvert, détourné | Aucun accès distant dans le prototype : le pare-feu du script Debian n'ouvre que les ports 80 et 443, au réseau local | WireGuard **désactivé par défaut**, activé par le client pour une intervention, journalisé, refermé automatiquement |
| **Erreur de manipulation** | Fichier supprimé, partage envoyé à la mauvaise personne | Liens de partage publics et repartage désactivés ; corbeille et versions de Nextcloud ; restauration depuis la sauvegarde | Procédure écrite pour le cabinet : retrouver une version, restaurer un dossier |
| **Écoute sur le réseau du cabinet** | Poste ou wifi compromis qui intercepte le trafic | Tout en HTTPS (autorité de certification propre à la box), en-tête HSTS | Installation du certificat racine sur chaque poste lors de l'installation sur place |
| **Faille dans une brique** | Vulnérabilité publiée dans Nextcloud, Vaultwarden, Caddy... | Versions figées et connues ; chaque connexion de mise à jour serait journalisée | Veille sur les vulnérabilités, mise à jour sous un délai contractuel (à fixer), avec l'accord du client |
| **Essais de mots de passe** | Quelqu'un sur le réseau tente des mots de passe | Protection de Nextcloud contre les essais répétés ; l'assistant transmet l'adresse réelle du poste ; mots de passe de connexion jamais conservés par l'assistant (mot de passe d'application révocable) | Double authentification pour les associés |
| **Nous-mêmes, prestataire** | Un employé du prestataire, ou un prestataire compromis | Pas d'accès distant permanent ; sauvegardes illisibles sans la phrase de la fiche de secours, détenue par le cabinet ; journal visible par le client | Contrat de sous-traitance (RGPD) : qui intervient, comment, avec quelle trace |

## 2. Plan de chiffrement

| Données | Au repos | En transit | Qui détient la clé | Prototype |
|---|---|---|---|---|
| Disque de la box (fichiers, bases, index de l'IA) | LUKS2, choisi à l'installation de Debian | | Le cabinet (phrase) ou la puce TPM | **Non** sur le portable de démo ; le script de préparation vérifie sa présence, non testé sur machine réelle |
| Échanges postes ↔ box | | TLS, certificats de l'autorité locale de la box, renouvelés automatiquement | La box | **Oui** |
| Échanges entre conteneurs | | En clair, sur des réseaux Docker internes à la machine | | Acceptable : ne quittent pas la machine |
| Coffre-fort de mots de passe | Chiffré dans le navigateur avant envoi (protocole Bitwarden) | TLS | Chaque utilisateur (mot de passe maître) | **Oui** |
| Sauvegardes sur disque externe | restic, AES-256 | | Le cabinet (phrase sur la fiche de secours) | **Oui**, restauration testée |
| Sauvegarde hors site | La même, copiée chiffrée | TLS | Le cabinet : nous ne pouvons pas la lire | **Non**, à faire |

## 3. Journal d'audit

| Source | Contenu | Où le voir |
|---|---|---|
| Plateforme (`sortie/journal/evenements.jsonl`) | Installation, sauvegardes, tests de restauration, vérifications, **connexions sortantes**, changements de modèle d'IA | Page **Journal d'audit** (https://ia.<domaine>/journal), administrateurs du cabinet |
| Assistant IA (`sortie/journal/assistant.jsonl`) | Connexions, **chaque question** avec les sources citées et la durée, refus | Même page ; chaque personne voit ses propres entrées dans l'assistant (« Ce qui a été tracé ») |
| Nextcloud (`audit.log`, application Audit) | Connexions, accès aux fichiers, partages | Fichier sur la box ; pas encore dans la page |

Le journal contient le texte des questions posées à l'assistant : il reste sur la box et sa page est réservée aux administrateurs (groupes `admin` et `associes`). **Reste à faire** : durée de conservation (à fixer avec le cabinet) ; rendre le journal infalsifiable (chaînage par empreintes, ou envoi vers un support en ajout seul) ; intégrer `audit.log` de Nextcloud à la page.

## 4. Connexions sortantes

Règle du projet : tout fonctionne hors ligne ; une connexion sortante est optionnelle, chiffrée, décidée par le client et visible au journal.

| Connexion | Par qui | Quand | Journalisée |
|---|---|---|---|
| Téléchargement d'un modèle d'IA | Conteneur `ia-telechargeur`, seul relié au réseau `sortie` | Clic d'un administrateur sur la page Modèles d'IA | **Oui** |
| Téléchargement des images, construction | Préparation en atelier (`./box.sh installer` ou `preparer-hors-ligne`) | Une fois, avant livraison | Installation journalisée |
| Mises à jour de sécurité | À concevoir | Fenêtre de maintenance acceptée par le client | À faire |

Vérifié par le script : le réseau des services est marqué `internal` ; seul le reverse proxy est relié au réseau de l'hôte ; seul `ia-telechargeur` est relié au réseau `sortie` ; le moteur d'IA n'est relié qu'au réseau interne ; Nextcloud ne joint pas internet. **Reste à faire** : règles de pare-feu sur la box (chaîne DOCKER-USER) pour bloquer et journaliser toute autre sortie, y compris celles du système.

## 5. Licences des briques

Relevées le 3 et le 4 novembre 2026 sur les dépôts officiels ([S22], [S25] de [`sources.md`](sources.md)).

| Brique | Licence | Remarque |
|---|---|---|
| Nextcloud, Agenda, Contacts | AGPL-3.0 | Utilisés sans modification du code |
| Vaultwarden | AGPL-3.0 | Idem |
| Coffre web Bitwarden (dans l'image Vaultwarden) | GPL-3.0 | |
| Caddy | Apache-2.0 | |
| PostgreSQL | Licence PostgreSQL (permissive) | |
| Valkey | BSD-3-Clause | |
| restic | BSD-2-Clause | |
| Ollama | MIT | Moteur des modèles d'IA |
| Colibri (option) | Apache-2.0 | |
| pypdf, numpy | BSD-3-Clause (numpy inclut aussi des parties MIT, Zlib, 0BSD, CC0) | Dépendances de l'assistant |
| python-docx | MIT | Idem |
| Modèles Qwen3 4B, Qwen3.6 35B-A3B | Apache-2.0 | Licence de chaque autre modèle du catalogue à vérifier avant de le proposer à un client |

Conséquence pour le jury (cadre juridique) : la revente est permise. Les briques sous AGPL et GPL imposent de fournir leur code source aux clients : nous les utilisons sans modification et fournirons les liens et les versions. Notre propre code (assistant, installeur, tableau de bord) est séparé.

## 6. Reste à faire, par priorité

1. Box de démo sur un disque chiffré, ou le dire clairement au jury.
2. Copie hors site chiffrée des sauvegardes.
3. Pare-feu des sorties (DOCKER-USER) et journal des tentatives bloquées.
4. Jeton d'administration du coffre-fort haché (Argon2) au lieu d'être en clair dans `.env`.
5. Accès distant WireGuard activable et journalisé.
6. Journal infalsifiable et `audit.log` de Nextcloud dans la page du journal.
