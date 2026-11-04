#!/usr/bin/env bash
# Point d'entrée unique de la plateforme de la box (DEV-1).
# Usage : ./box.sh <commande>. Liste des commandes : ./box.sh aide
set -euo pipefail

ICI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ICI"

SORTIE="$ICI/sortie"
JOURNAL="$SORTIE/journal/evenements.jsonl"
COMPOSE=(docker compose)
CLES_SECRETES=(NC_ADMIN_PASSWORD NC_DB_PASSWORD CACHE_PASSWORD VW_ADMIN_TOKEN DEMO_MOT_DE_PASSE SAUVEGARDE_MOT_DE_PASSE IA_MOTEUR_CLE)

info()   { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
ok()     { printf '\033[1;32m ok\033[0m %s\n' "$*"; }
alerte() { printf '\033[1;33m !!\033[0m %s\n' "$*" >&2; }
echec()  { printf '\033[1;31mERREUR\033[0m %s\n' "$*" >&2; exit 1; }

# Événement au format JSON Lines, à brancher sur le journal d'audit de DEV-4.
journal() {
    local type=$1 detail=${2//\"/\'} resultat=${3:-ok}
    mkdir -p "$(dirname "$JOURNAL")"
    printf '{"date":"%s","source":"plateforme","type":"%s","detail":"%s","resultat":"%s"}\n' \
        "$(date -Iseconds)" "$type" "$detail" "$resultat" >> "$JOURNAL"
}

charger_env() {
    [ -f .env ] || echec "fichier .env absent : lancer d'abord ./box.sh installer"
    set -a; . ./.env; set +a
    # L'assistant IA tourne avec l'identité de l'exploitant de la box (pas root) et écrit dans sortie/.
    export BOX_UID=${BOX_UID:-$(id -u)} BOX_GID=${BOX_GID:-$(id -g)}
    mkdir -p "$SORTIE/ia" "$SORTIE/journal"
}

# Chaîne aléatoire sans caractères ambigus. Longueur en argument (défaut 32).
# (openssl puis cut plutôt que /dev/urandom | head : pas de SIGPIPE avec pipefail)
secret() { openssl rand -base64 96 | LC_ALL=C tr -dc "${2:-A-HJ-NP-Za-km-z2-9}" | cut -c "1-${1:-32}"; }

# Mot de passe des comptes de démo : lisible à voix haute pendant la démo.
secret_demo() { printf 'Cabinet-%s-%s' "$(secret 4 'A-HJ-NP-Z2-9')" "$(secret 4 'A-HJ-NP-Z2-9')"; }

# Crée .env si besoin et remplit chaque secret encore vide (relançable sans risque).
creer_env() {
    if [ ! -f .env ]; then
        cp .env.example .env
        chmod 600 .env
        info "Création de .env avec des secrets aléatoires (droits 600, ignoré par git)"
    fi
    local cle valeur
    for cle in "${CLES_SECRETES[@]}"; do
        grep -q "^${cle}=\$" .env || continue
        if [ "$cle" = DEMO_MOT_DE_PASSE ]; then valeur=$(secret_demo); else valeur=$(secret 32); fi
        sed -i "s|^${cle}=\$|${cle}=${valeur}|" .env
        ok "secret généré : $cle"
    done
}

verifier_prerequis() {
    command -v docker >/dev/null || echec "docker n'est pas installé (voir systeme/preparer-debian.sh)"
    docker compose version >/dev/null 2>&1 || echec "le plugin docker compose v2 est absent"
    docker info >/dev/null 2>&1 || echec "impossible de parler au démon docker (droits ? service arrêté ?)"
}

# Attend qu'un service soit « healthy » (ou « running » s'il n'a pas de test de santé).
# 3e argument facultatif : nom d'un autre projet compose (restauration de test).
attendre() {
    local service=$1 limite=${2:-600} projet=${3:-box} debut=$SECONDS id etat
    id=$(docker compose -p "$projet" ps -q "$service")
    [ -n "$id" ] || echec "service $service introuvable"
    while :; do
        etat=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$id")
        case $etat in
            healthy|running) ok "$service prêt"; return 0 ;;
            unhealthy|exited|dead) echec "$service : $etat (voir ./box.sh journaux $service)" ;;
        esac
        (( SECONDS - debut > limite )) && echec "$service n'est pas prêt après ${limite} s"
        sleep 5
    done
}

exporter_certificat() {
    mkdir -p "$SORTIE"
    local essai
    for essai in $(seq 1 30); do
        if "${COMPOSE[@]}" exec -T proxy cat /data/caddy/pki/authorities/local/root.crt > "$SORTIE/autorite-locale.crt" 2>/dev/null \
           && [ -s "$SORTIE/autorite-locale.crt" ]; then
            ok "certificat racine local : sortie/autorite-locale.crt"
            printf '    empreinte %s\n' "$(openssl x509 -in "$SORTIE/autorite-locale.crt" -noout -fingerprint -sha256 | cut -d= -f2)"
            return 0
        fi
        sleep 2
    done
    echec "le certificat racine de Caddy n'a pas été créé"
}

afficher_adresses() {
    cat <<EOF

  Tableau de bord       https://${BOX_DOMAIN}
  Fichiers et agenda    https://cloud.${BOX_DOMAIN}
  Coffre-fort           https://coffre.${BOX_DOMAIN}
  Assistant IA          https://ia.${BOX_DOMAIN}
  Modèles d'IA          https://ia.${BOX_DOMAIN}/modeles
  Certificat racine     http://${BOX_DOMAIN}/autorite-locale.crt

  Mots de passe : fichier .env (NC_ADMIN_PASSWORD, DEMO_MOT_DE_PASSE). Adresse d'écoute : ${BIND_ADDRESS}.
EOF
}

cmd_installer() {
    local demo=non
    [ "${1:-}" = --demo ] && demo=oui
    verifier_prerequis
    creer_env
    charger_env
    if docker image inspect "$NC_IMAGE" >/dev/null 2>&1; then
        ok "image $NC_IMAGE déjà présente (construite ou chargée depuis l'archive hors ligne)"
    else
        info "Construction de l'image Nextcloud de la box (connexion internet nécessaire)"
        "${COMPOSE[@]}" build nextcloud
    fi
    info "Démarrage des services"
    "${COMPOSE[@]}" up -d
    info "Attente de la fin de l'installation de Nextcloud (1 à 3 minutes la première fois)"
    attendre db 120
    attendre cache 120
    attendre nextcloud 900
    attendre coffre 120
    attendre proxy 60
    attendre ia-moteur 300
    attendre assistant 300
    exporter_certificat
    journal installation "box installée : services de base et assistant IA"
    if [ "$demo" = oui ]; then
        cmd_donnees_demo
        "${COMPOSE[@]}" exec -T -e IA_MOT_DE_PASSE="$DEMO_MOT_DE_PASSE" assistant python -m assistant indexer hcorbiere \
            || alerte "indexation à refaire quand un modèle sera actif : ./box.sh indexer-ia"
    fi
    afficher_adresses
    echo
    info "Choisir et installer le modèle d'IA : https://ia.${BOX_DOMAIN}/modeles (compte administrateur du cabinet)"
    [ "$demo" = oui ] || info "Pour charger le cabinet fictif de démonstration : ./box.sh donnees-demo"
}

cmd_demarrer() {
    charger_env
    "${COMPOSE[@]}" up -d
    attendre nextcloud 300
    journal demarrage "services démarrés"
    afficher_adresses
}

cmd_arreter() {
    "${COMPOSE[@]}" stop
    journal arret "services arrêtés"
}

cmd_etat() {
    charger_env
    "${COMPOSE[@]}" ps --format 'table {{.Service}}\t{{.Status}}'
    afficher_adresses
}

cmd_journaux() { "${COMPOSE[@]}" logs --tail=100 -f "$@"; }

cmd_certificat() { charger_env; exporter_certificat; }

cmd_donnees_demo() {
    charger_env
    attendre nextcloud 300
    info "Chargement du jeu de données FICTIF du cabinet"
    "${COMPOSE[@]}" run --rm outils /outils/charger_donnees_demo.py
    journal donnees_demo "jeu de données fictif chargé"
    cat <<EOF

  Comptes fictifs (mot de passe commun : DEMO_MOT_DE_PASSE dans .env)
    hcorbiere   Hélène Corbière, avocate associée     tous les dossiers
    jarnoult    Julien Arnoult, avocat collaborateur  dossiers Fournil et Garnier
    ibelkacem   Inès Belkacem, élève-avocate          dossier Fournil seulement
    mthevenet   Margaux Thévenet, assistante          administratif et agendas
EOF
}

# ---------------------------------------------------------------- sauvegarde chiffrée (restic)
#
# Contenu d'un instantané : export de la base Nextcloud, copie cohérente de la base du coffre-fort,
# fichier .env (secrets), configuration et applications de Nextcloud, fichiers des utilisateurs,
# données du coffre-fort, autorité de certification locale. Le code des logiciels n'est pas
# sauvegardé : il vient des images. Le dépôt est chiffré par restic (AES-256) avec
# SAUVEGARDE_MOT_DE_PASSE : sans lui, la sauvegarde est illisible, y compris pour nous.

NC_IMAGE=box/nextcloud:34.0.5-1
PREPARATION="$SORTIE/sauvegarde-preparation"
RESTAURATION="$SORTIE/restauration"
PROJET_TEST=box-restauration

occ() { "${COMPOSE[@]}" exec -T -u www-data nextcloud php occ "$@"; }
restic_box() { "${COMPOSE[@]}" run --rm -T sauvegarde "$@"; }

verifier_destination() {
    local d=${SAUVEGARDE_DESTINATION:-}
    [ -n "$d" ] || echec "SAUVEGARDE_DESTINATION est vide dans .env : brancher le disque externe et indiquer le dossier de sauvegarde"
    [[ $d = /* ]] || echec "SAUVEGARDE_DESTINATION doit être un chemin absolu"
    [ -d "$d" ] || echec "dossier de sauvegarde introuvable : $d (disque externe branché et monté ?)"
    # Dossiers montés dans le conteneur de sauvegarde : créés ici pour ne pas appartenir à root.
    mkdir -p "$PREPARATION" "$RESTAURATION"
    chmod 700 "$PREPARATION"
}

# Fichiers en clair (export de base, .env) : supprimés dès que l'instantané chiffré est fait.
nettoyer_preparation() { rm -f "$PREPARATION"/{nextcloud.pgdump,roles.sql,comptes.txt,coffre.sqlite3,env,manifeste.txt}; }

# Tables comptées au moment de la sauvegarde, puis comparées après restauration.
TABLES_CONTROLE=(oc_users oc_filecache oc_share oc_calendarobjects oc_cards)

# Les fichiers restaurés appartiennent à www-data ou root : suppression depuis un conteneur.
nettoyer_restauration() {
    [ -d "$RESTAURATION" ] || return 0
    docker run --rm --entrypoint sh -v "$RESTAURATION:/r" "$NC_IMAGE" -c 'rm -rf /r/sources' >/dev/null
}

cmd_sauvegarder() {
    charger_env
    verifier_destination
    local debut=$SECONDS fichier instantane
    if ! restic_box cat config >/dev/null 2>&1; then
        info "Initialisation du dépôt de sauvegarde chiffré dans $SAUVEGARDE_DESTINATION"
        restic_box init
    fi
    info "Nextcloud en mode maintenance pendant la copie"
    occ maintenance:mode --on >/dev/null
    trap 'occ maintenance:mode --off >/dev/null 2>&1 || true; nettoyer_preparation' EXIT
    info "Export de la base de données de Nextcloud"
    "${COMPOSE[@]}" exec -T db pg_dump -U nextcloud -Fc nextcloud > "$PREPARATION/nextcloud.pgdump"
    # Rôles PostgreSQL : Nextcloud se connecte avec son propre rôle (oc_<admin>), propriétaire des tables.
    "${COMPOSE[@]}" exec -T db pg_dumpall -U nextcloud --globals-only > "$PREPARATION/roles.sql"
    local table
    for table in "${TABLES_CONTROLE[@]}"; do
        echo "$table=$(compter box "select count(*) from $table")"
    done > "$PREPARATION/comptes.txt"
    info "Copie cohérente de la base du coffre-fort"
    fichier=$("${COMPOSE[@]}" exec -T coffre /vaultwarden backup 2>/dev/null | grep -o 'db_[0-9_]*\.sqlite3' | head -1)
    [ -n "$fichier" ] || echec "la copie de la base du coffre-fort a échoué"
    "${COMPOSE[@]}" cp "coffre:/data/$fichier" "$PREPARATION/coffre.sqlite3" >/dev/null
    "${COMPOSE[@]}" exec -T coffre rm -f "/data/$fichier"
    cp .env "$PREPARATION/env"
    { echo "date=$(date -Iseconds)"; "${COMPOSE[@]}" config --images | sed 's/^/image=/'; } > "$PREPARATION/manifeste.txt"
    info "Instantané chiffré (restic)"
    restic_box backup --host box --tag box --quiet \
        --exclude '/sources/nextcloud-donnees/appdata_*/preview' \
        --exclude '/sources/coffre/db.sqlite3*' --exclude '/sources/coffre/icon_cache' --exclude '/sources/coffre/tmp' \
        /sources/preparation /sources/nextcloud-html/config /sources/nextcloud-html/custom_apps \
        /sources/nextcloud-html/themes /sources/nextcloud-donnees /sources/coffre /sources/caddy
    occ maintenance:mode --off >/dev/null
    nettoyer_preparation
    trap - EXIT
    info "Rotation : 7 sauvegardes quotidiennes, 4 hebdomadaires, 12 mensuelles"
    restic_box forget --host box --keep-daily 7 --keep-weekly 4 --keep-monthly 12 --prune --quiet
    instantane=$(restic_box snapshots --host box --latest 1 --compact | awk 'NR==3 {print $1}')
    journal sauvegarde "instantané $instantane dans $SAUVEGARDE_DESTINATION en $((SECONDS - debut)) s"
    ok "sauvegarde $instantane terminée en $((SECONDS - debut)) s"
}

cmd_sauvegardes() {
    charger_env
    verifier_destination
    restic_box snapshots --host box
}

# Restaure un instantané dans un projet compose : « box » (la vraie box) ou le projet de test,
# qui ne publie aucun port et ne gêne pas la box en service.
restaurer_dans() {
    local projet=$1 instantane=$2 src="$RESTAURATION/sources" services=(db cache nextcloud coffre)
    [ "$projet" = box ] && services+=(proxy nextcloud-cron)
    nettoyer_restauration
    info "Lecture de l'instantané $instantane"
    restic_box restore "$instantane" --host box --target /restauration --quiet
    [ -s "$src/preparation/nextcloud.pgdump" ] || echec "instantané incomplet : export de la base absent"
    # Les secrets restaurés doivent correspondre aux données restaurées : environnement propre.
    local P=(env -i "PATH=$PATH" "HOME=$HOME" docker compose -p "$projet" --env-file "$src/preparation/env")
    "${P[@]}" down -v --remove-orphans >/dev/null 2>&1 || true
    "${P[@]}" up --no-start "${services[@]}" 2>/dev/null
    info "Recopie des fichiers dans les volumes"
    docker run --rm --entrypoint sh -v "${projet}_nextcloud_html:/var/www/html" -v "$src/nextcloud-html:/restaure:ro" "$NC_IMAGE" \
        -c 'rsync -rlDog --chown www-data:www-data /usr/src/nextcloud/ /var/www/html/ && cp -a /restaure/. /var/www/html/'
    docker run --rm --entrypoint sh -v "${projet}_nextcloud_donnees:/dst" -v "$src/nextcloud-donnees:/src:ro" "$NC_IMAGE" \
        -c 'cp -a /src/. /dst/'
    docker run --rm --entrypoint sh -v "${projet}_coffre_donnees:/dst" -v "$src/coffre:/src:ro" -v "$src/preparation:/prep:ro" "$NC_IMAGE" \
        -c 'cp -a /src/. /dst/ && cp /prep/coffre.sqlite3 /dst/db.sqlite3'
    if [ "$projet" = box ]; then
        docker run --rm --entrypoint sh -v "${projet}_caddy_donnees:/dst" -v "$src/caddy:/src:ro" "$NC_IMAGE" -c 'cp -a /src/. /dst/'
    fi
    info "Restauration de la base de données"
    "${P[@]}" up -d db 2>/dev/null
    attendre db 120 "$projet"
    # Rôles d'abord (le rôle « nextcloud » existe déjà dans la base neuve), puis les tables avec leurs propriétaires.
    sed '/^CREATE ROLE nextcloud;$/d' "$src/preparation/roles.sql" \
        | "${P[@]}" exec -T db psql -v ON_ERROR_STOP=1 -q -U nextcloud -d postgres >/dev/null
    "${P[@]}" exec -T db pg_restore -U nextcloud -d nextcloud --exit-on-error < "$src/preparation/nextcloud.pgdump"
    "${P[@]}" up -d "${services[@]}" 2>/dev/null
    attendre nextcloud 600 "$projet"
    # La sauvegarde est faite en mode maintenance : on en sort après restauration.
    "${P[@]}" exec -T -u www-data nextcloud php occ maintenance:mode --off >/dev/null
}

# Encodage d'URL octet par octet (chemins avec espaces et accents).
encoder_url() {
    local LC_ALL=C s=$1 i c sortie=""
    for (( i = 0; i < ${#s}; i++ )); do
        c=${s:i:1}
        case $c in
            [a-zA-Z0-9.~_/-]) sortie+=$c ;;
            *) printf -v c '%%%02X' "'$c"; sortie+=$c ;;
        esac
    done
    printf '%s' "$sortie"
}

compter() { # projet, requête SQL
    docker compose -p "$1" exec -T db psql -U nextcloud -d nextcloud -tAc "$2" | tr -d '[:space:]'
}

verifier_restauration() {
    local projet=$1 src="$RESTAURATION/sources" erreurs=0 table vivant restaure
    local P=(docker compose -p "$projet")
    if "${P[@]}" exec -T nextcloud curl -fsS http://localhost/status.php | grep -q '"installed":true,"maintenance":false'; then
        ok "Nextcloud restauré : installé, hors maintenance"
    else
        alerte "Nextcloud restauré : état incorrect"; erreurs=$((erreurs + 1))
    fi
    # Comparaison avec les comptages faits au moment de la sauvegarde (la box en service a pu changer depuis).
    for table in "${TABLES_CONTROLE[@]}"; do
        vivant=$(grep "^$table=" "$src/preparation/comptes.txt" 2>/dev/null | cut -d= -f2)
        restaure=$(compter "$projet" "select count(*) from $table")
        if [ -z "$vivant" ]; then
            alerte "$table : $restaure lignes (pas de comptage dans cet instantané, ancien format)"
        elif [ "$vivant" = "$restaure" ]; then
            ok "$table : $restaure lignes, identique à la sauvegarde"
        else
            alerte "$table : $restaure lignes restaurées contre $vivant au moment de la sauvegarde"; erreurs=$((erreurs + 1))
        fi
    done
    # Un document du jeu de démonstration, relu par WebDAV dans la box restaurée, comparé à l'original.
    local document="Dossiers clients/2026-014 Fournil des Aubépines - bail commercial/02 Bail commercial du 1er mars 2019.pdf"
    local mdp empreinte_git empreinte_restauree
    mdp=$(grep '^DEMO_MOT_DE_PASSE=' "$src/preparation/env" | cut -d= -f2-)
    if [ -f "$ICI/../donnees-demo/fichiers/$document" ] && [ -n "$mdp" ]; then
        empreinte_git=$(sha256sum "$ICI/../donnees-demo/fichiers/$document" | cut -d' ' -f1)
        empreinte_restauree=$("${P[@]}" exec -T nextcloud curl -fsS -H 'Host: nextcloud' -u "hcorbiere:$mdp" \
            "http://localhost/remote.php/dav/files/hcorbiere/$(encoder_url "$document")" | sha256sum | cut -d' ' -f1)
        if [ "$empreinte_git" = "$empreinte_restauree" ]; then
            ok "document relu par WebDAV avec le compte de l'associée : identique à l'original (sha256)"
        else
            alerte "document restauré différent de l'original"; erreurs=$((erreurs + 1))
        fi
    fi
    # Test de santé intégré à l'image du coffre-fort (il attend la fin de son démarrage).
    if (attendre coffre 120 "$projet") >/dev/null 2>&1; then
        ok "coffre-fort restauré : démarré et en bonne santé"
    else
        alerte "coffre-fort restauré : ne démarre pas"; erreurs=$((erreurs + 1))
    fi
    # Le dossier de l'autorité locale n'est lisible que par root : lecture depuis un conteneur.
    if [ -f "$SORTIE/autorite-locale.crt" ] && docker run --rm --entrypoint cat -v "$RESTAURATION:/r:ro" "$NC_IMAGE" \
           /r/sources/caddy/caddy/pki/authorities/local/root.crt 2>/dev/null | cmp -s - "$SORTIE/autorite-locale.crt"; then
        ok "autorité de certification locale restaurée : identique"
    else
        alerte "certificat racine restauré différent ou absent"; erreurs=$((erreurs + 1))
    fi
    return "$erreurs"
}

cmd_tester_restauration() {
    charger_env
    verifier_destination
    local instantane=${1:-latest} debut=$SECONDS duree resultat=0
    info "Restauration réelle de l'instantané $instantane dans un projet de test isolé ($PROJET_TEST, aucun port publié)"
    # Quoi qu'il arrive, le projet de test et les fichiers restaurés en clair sont supprimés.
    trap 'docker compose -p "$PROJET_TEST" down -v --remove-orphans >/dev/null 2>&1; nettoyer_restauration' EXIT
    restaurer_dans "$PROJET_TEST" "$instantane"
    duree=$((SECONDS - debut))
    info "Vérifications"
    verifier_restauration "$PROJET_TEST" || resultat=$?
    info "Suppression du projet de test et des fichiers restaurés en clair"
    docker compose -p "$PROJET_TEST" down -v --remove-orphans >/dev/null 2>&1
    nettoyer_restauration
    trap - EXIT
    if [ "$resultat" -eq 0 ]; then
        journal test_restauration "instantané $instantane restauré et vérifié en $duree s" ok
        ok "restauration complète et vérifiée en $duree s (de la lecture du disque au service rendu)"
    else
        journal test_restauration "instantané $instantane : $resultat vérification(s) en échec" echec
        echec "$resultat vérification(s) en échec"
    fi
}

# Reconstruction de la box depuis une sauvegarde (box neuve, ou panne). Remplace toutes les données.
cmd_restaurer() {
    creer_env
    charger_env
    verifier_destination
    local instantane=${1:-latest}
    restic_box cat config >/dev/null 2>&1 \
        || echec "dépôt illisible : vérifier SAUVEGARDE_DESTINATION et SAUVEGARDE_MOT_DE_PASSE (fiche de secours)"
    alerte "Restauration de l'instantané $instantane : les données actuelles de la box seront REMPLACÉES."
    read -r -p "Taper « restaurer » pour confirmer : " reponse
    [ "$reponse" = restaurer ] || echec "annulé"
    local debut=$SECONDS
    "${COMPOSE[@]}" --profile outils down -v --remove-orphans
    restaurer_dans box "$instantane"
    # Les secrets de la sauvegarde deviennent ceux de la box (ils correspondent aux données).
    cp .env ".env.avant-restauration"
    install -m 600 "$RESTAURATION/sources/preparation/env" .env
    nettoyer_restauration
    charger_env
    exporter_certificat
    journal restauration "box restaurée depuis l'instantané $instantane en $((SECONDS - debut)) s"
    ok "box restaurée en $((SECONDS - debut)) s (ancien .env conservé dans .env.avant-restauration)"
    afficher_adresses
}

# ---------------------------------------------------------------- vérification hors ligne
#
# Automatise la liste de vérification de docs/prototype.md (section 9). À lancer câble débranché
# et wifi coupé : le mercredi à 16 h, puis le vendredi matin avant le passage devant le jury.

cmd_verifier_hors_ligne() {
    charger_env
    local echecs=0 alertes=0 ip=127.0.0.1 domaine=$BOX_DOMAIN mdp=$DEMO_MOT_DE_PASSE
    [ "$BIND_ADDRESS" != 0.0.0.0 ] && ip=$BIND_ADDRESS
    local CURL=(curl -sS --max-time 15 --cacert "$SORTIE/autorite-locale.crt"
                --resolve "$domaine:443:$ip" --resolve "cloud.$domaine:443:$ip" --resolve "coffre.$domaine:443:$ip"
                --resolve "ia.$domaine:443:$ip")
    reussi() { ok "$*"; }
    rate() { printf '\033[1;31m ÉCHEC\033[0m %s\n' "$*"; echecs=$((echecs + 1)); }
    attention() { alerte "$*"; alertes=$((alertes + 1)); }

    info "1. Coupure réseau de la machine"
    if ip route show default 2>/dev/null | grep -q .; then
        attention "une route par défaut existe : la machine est encore connectée (débrancher le câble, couper le wifi)"
    else
        reussi "aucune route vers internet"
    fi

    info "2. Services"
    local service etat
    for service in proxy nextcloud nextcloud-cron db cache coffre ia-moteur ia-telechargeur assistant; do
        etat=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
               "$("${COMPOSE[@]}" ps -q "$service" 2>/dev/null)" 2>/dev/null || echo absent)
        case $etat in healthy|running) reussi "$service : $etat" ;; *) rate "$service : $etat" ;; esac
    done
    [ -s "$SORTIE/autorite-locale.crt" ] || exporter_certificat >/dev/null

    info "3. Isolement réseau des services"
    if [ "$(docker network inspect -f '{{.Internal}}' box_interne)" = true ]; then
        reussi "réseau des services « interne » : sans accès à internet par construction"
    else
        rate "le réseau box_interne n'est pas marqué internal"
    fi
    local relies
    relies=$(docker network inspect -f '{{range .Containers}}{{.Name}} {{end}}' box_frontal)
    if [ "$(echo "$relies" | wc -w)" -le 1 ] && [[ $relies == *proxy* ]]; then
        reussi "seul le reverse proxy est relié au réseau de l'hôte"
    else
        rate "conteneurs reliés au réseau de l'hôte : $relies"
    fi
    relies=$(docker network inspect -f '{{range .Containers}}{{.Name}} {{end}}' box_sortie 2>/dev/null)
    if [ -z "$relies" ] || { [ "$(echo "$relies" | wc -w)" -eq 1 ] && [[ $relies == *ia-telechargeur* ]]; }; then
        reussi "réseau « sortie » : seul le conteneur de téléchargement des modèles y est relié"
    else
        rate "conteneurs reliés au réseau de téléchargement : $relies"
    fi
    local reseaux_moteur
    reseaux_moteur=$(docker inspect -f '{{range $nom, $_ := .NetworkSettings.Networks}}{{$nom}} {{end}}' \
                     "$("${COMPOSE[@]}" ps -q ia-moteur)" 2>/dev/null | xargs)
    [ "$reseaux_moteur" = box_interne ] && reussi "le moteur d'IA n'est relié qu'au réseau interne (pas d'internet)" \
                                        || rate "réseaux du moteur d'IA : ${reseaux_moteur:-inconnu}"
    if "${COMPOSE[@]}" exec -T nextcloud curl -sS --max-time 5 -o /dev/null https://www.example.com 2>/dev/null; then
        rate "Nextcloud arrive à joindre internet"
    else
        reussi "Nextcloud ne peut pas joindre internet (essai vers www.example.com refusé)"
    fi
    local reglage valeur
    for reglage in has_internet_connection appstoreenabled updatechecker; do
        valeur=$(occ config:system:get "$reglage" 2>/dev/null | tr -d '\r')
        [ "$valeur" = false ] && reussi "Nextcloud : $reglage = false" || rate "Nextcloud : $reglage = ${valeur:-non défini}"
    done

    info "4. Pages chargées sans ressource externe (CDN, polices, scripts)"
    local page html externes
    for page in "https://$domaine/" "https://cloud.$domaine/login" "https://coffre.$domaine/" "https://ia.$domaine/"; do
        if ! html=$("${CURL[@]}" -f "$page"); then
            rate "$page ne se charge pas"; continue
        fi
        externes=$(grep -oiE '<(script|link|img|iframe)[^>]+(src|href)="(https?:)?//[^"]+"' <<<"$html" \
                   | grep -oiE '(https?:)?//[^/"]+' | grep -viE "//([a-z0-9-]+\.)*${domaine//./\\.}$" | sort -u | tr '\n' ' ' || true)
        [ -z "$externes" ] && reussi "$page : aucune ressource externe" || rate "$page charge des ressources externes : $externes"
    done

    info "5. Données de démonstration et droits"
    local nb
    nb=$("${CURL[@]}" -u "hcorbiere:$mdp" -X PROPFIND -H 'Depth: infinity' \
         "https://cloud.$domaine/remote.php/dav/files/hcorbiere/Dossiers%20clients/" | grep -o '<d:getcontenttype>' | wc -l)
    [ "$nb" -ge 26 ] && reussi "l'associée voit $nb documents dans « Dossiers clients »" \
                     || rate "l'associée ne voit que $nb documents (jeu de démo chargé ? ./box.sh donnees-demo)"
    local lefort="Dossiers clients/2026-009 Lefort - divorce amiable/03 Inventaire du patrimoine des époux Lefort.pdf" code
    code=$("${CURL[@]}" -o /dev/null -w '%{http_code}' -u "ibelkacem:$mdp" \
           "https://cloud.$domaine/remote.php/dav/files/hcorbiere/$(encoder_url "$lefort")")
    [ "$code" = 404 ] && reussi "refus d'accès : la stagiaire ne peut pas lire le dossier Lefort (HTTP 404)" \
                      || rate "la stagiaire obtient HTTP $code sur un document du dossier Lefort"
    nb=$("${CURL[@]}" -u "hcorbiere:$mdp" -X PROPFIND -H 'Depth: 1' \
         "https://cloud.$domaine/remote.php/dav/calendars/hcorbiere/audiences/" | grep -o '\.ics<' | wc -l)
    [ "$nb" -ge 1 ] && reussi "agenda « Audiences et échéances » : $nb événements" || rate "agenda des audiences vide"

    info "6. Journal d'audit de Nextcloud"
    nb=$("${COMPOSE[@]}" exec -T nextcloud sh -c 'wc -l < /var/www/html/data/audit.log' 2>/dev/null | tr -d '[:space:]')
    [ "${nb:-0}" -gt 0 ] && reussi "data/audit.log : ${nb} événements (connexions, accès et partages)" \
                         || attention "journal d'audit de Nextcloud vide ou absent"

    info "7. Accès depuis l'ordinateur de présentation"
    if [ "$BIND_ADDRESS" = 127.0.0.1 ]; then
        attention "BIND_ADDRESS=127.0.0.1 : la box n'est joignable que depuis elle-même (mettre 0.0.0.0 si la démo se fait depuis un autre ordinateur)"
    else
        reussi "box joignable sur $BIND_ADDRESS, ports 80 et 443"
    fi

    echo
    echo "  Restent à vérifier à la main : les 3 questions de démo (DEV-2), le tableau de bord (DEV-3),"
    echo "  le journal d'audit dans le tableau de bord (DEV-4), l'écran et l'adaptateur de la salle."
    journal verification_hors_ligne "$echecs échec(s), $alertes alerte(s)" "$([ "$echecs" -eq 0 ] && echo ok || echo echec)"
    if [ "$echecs" -eq 0 ]; then
        ok "vérification terminée : 0 échec, $alertes alerte(s)"
    else
        echec "$echecs échec(s), $alertes alerte(s)"
    fi
}

# ---------------------------------------------------------------- assistant IA (DEV-2)

IA_IMAGE_MOTEUR=ollama/ollama:0.40.14

# Moteur de rédaction Colibri, lancé directement sur la machine (il lit le modèle sur le SSD) mais
# n'écoutant QUE sur l'adresse de l'hôte dans le réseau interne des conteneurs : l'assistant le joint,
# le wifi et internet ne le voient pas, et les conteneurs restent sans accès à internet.
cmd_moteur_ia() {
    charger_env
    local action=${1:-etat} ip port=5000
    ip=$(docker network inspect box_interne -f '{{(index .IPAM.Config 0).Gateway}}' 2>/dev/null) \
        || echec "réseau box_interne absent : lancer d'abord ./box.sh demarrer"
    local cle=(); [ -n "${IA_MOTEUR_CLE:-}" ] && cle=(-H "Authorization: Bearer $IA_MOTEUR_CLE")
    case $action in
        demarrer)
            [ -x "${COLIBRI_DIR:-}/c/coli" ] || echec "Colibri introuvable : renseigner COLIBRI_DIR dans .env"
            [ -d "${COLIBRI_MODELE:-}" ] || echec "modèle introuvable : renseigner COLIBRI_MODELE dans .env"
            info "Démarrage de Colibri sur $ip:$port (réseau interne seulement)"
            # setsid : le lanceur et le moteur qu'il démarre forment un groupe, arrêté d'un coup.
            setsid nohup "$COLIBRI_DIR/c/coli" serve --model "$COLIBRI_MODELE" --host "$ip" --port "$port" --no-think \
                ${IA_MOTEUR_CLE:+--api-key "$IA_MOTEUR_CLE"} > "$SORTIE/ia/colibri.log" 2>&1 &
            echo $! > "$SORTIE/ia/colibri.pid"
            local essai
            for essai in $(seq 1 120); do
                curl -fsS "${cle[@]}" "http://$ip:$port/v1/models" >/dev/null 2>&1 && break
                sleep 2
            done
            curl -fsS "${cle[@]}" "http://$ip:$port/v1/models" >/dev/null 2>&1 || echec "Colibri ne répond pas (voir sortie/ia/colibri.log)"
            sed -i "s|^IA_COLIBRI_URL=.*|IA_COLIBRI_URL=http://$ip:$port|" .env
            grep -q "^IA_COLIBRI_URL=" .env || echo "IA_COLIBRI_URL=http://$ip:$port" >> .env
            # L'assistant lit cette adresse à son démarrage.
            charger_env
            "${COMPOSE[@]}" up -d assistant >/dev/null 2>&1
            journal moteur_ia "Colibri démarré sur $ip:$port"
            ok "Colibri prêt : http://$ip:$port/v1"
            ;;
        arreter)
            [ -f "$SORTIE/ia/colibri.pid" ] && kill -TERM -- "-$(cat "$SORTIE/ia/colibri.pid")" 2>/dev/null || true
            rm -f "$SORTIE/ia/colibri.pid"
            journal moteur_ia "Colibri arrêté"
            ok "Colibri arrêté"
            ;;
        etat)
            if curl -fsS "${cle[@]}" "http://$ip:$port/v1/models" 2>/dev/null; then echo; else echo "Colibri arrêté"; fi
            ;;
        *) echec "usage : ./box.sh moteur-ia demarrer|arreter|etat" ;;
    esac
}

# Prépare l'index de recherche pour la démo, avec le compte de l'associée (qui voit tous les dossiers).
cmd_indexer_ia() {
    charger_env
    attendre assistant 300
    info "Indexation des documents visibles par hcorbiere"
    "${COMPOSE[@]}" exec -T -e IA_MOT_DE_PASSE="$DEMO_MOT_DE_PASSE" assistant python -m assistant indexer hcorbiere
    journal indexation_ia "index de recherche préparé avec le compte de démonstration hcorbiere"
}

# Télécharge et construit toutes les images, puis les exporte dans une archive : la box peut ensuite
# être installée sur une machine qui n'a jamais eu accès à internet (docker load -i ...).
cmd_preparer_hors_ligne() {
    verifier_prerequis
    creer_env
    info "Téléchargement des images"
    "${COMPOSE[@]}" --profile outils pull --ignore-buildable
    info "Construction de l'image Nextcloud"
    "${COMPOSE[@]}" build nextcloud
    mkdir -p "$SORTIE"
    local images
    images=$("${COMPOSE[@]}" --profile outils config --images | sort -u)
    info "Export des images dans sortie/images-box.tar"
    # shellcheck disable=SC2086
    docker save -o "$SORTIE/images-box.tar" $images
    ok "$(du -h "$SORTIE/images-box.tar" | cut -f1) : sortie/images-box.tar"
    echo "  Sur la box : docker load -i images-box.tar, puis ./box.sh installer (aucun accès internet requis)"
}

cmd_reinitialiser() {
    alerte "Suppression de TOUS les conteneurs et volumes de la box (fichiers, agenda, coffre-fort)."
    read -r -p "Taper « effacer » pour confirmer : " reponse
    [ "$reponse" = effacer ] || echec "annulé"
    "${COMPOSE[@]}" --profile outils down -v --remove-orphans
    # Index de l'assistant : il désigne les fichiers de l'ancienne installation. Le choix du modèle est gardé.
    rm -f "$SORTIE/ia/index.json" "$SORTIE/ia/vecteurs.npy"
    journal reinitialisation "conteneurs et volumes supprimés"
    ok "box réinitialisée (le fichier .env est conservé)"
}

cmd_aide() {
    cat <<'EOF'
Usage : ./box.sh <commande>

  installer [--demo]   Installe toute la box en une commande (--demo : avec le cabinet fictif)
  donnees-demo         Charge le cabinet FICTIF : comptes, dossiers, droits, agendas, contacts
  demarrer | arreter   Démarre ou arrête les services
  etat                 État des services et adresses
  journaux [service]   Journaux des conteneurs
  certificat           Exporte le certificat racine local dans sortie/
  sauvegarder          Instantané chiffré (restic) vers SAUVEGARDE_DESTINATION (disque externe)
  sauvegardes          Liste des instantanés
  tester-restauration  Restaure le dernier instantané dans un projet isolé et vérifie tout
  restaurer [id]       Reconstruit la box depuis un instantané (REMPLACE les données)
  verifier-hors-ligne  Liste de vérification de la démo, à lancer câble débranché
  ia [commande]        Modèles d'IA : menu pour choisir, installer et activer (liste, installer, activer, supprimer)
  moteur-ia ACTION     demarrer | arreter | etat : moteur Colibri sur le réseau interne
  indexer-ia           Prépare l'index de recherche de l'assistant pour la démo
  assistant [adresse]  Assistant web de première configuration (défaut 127.0.0.1:8090)
  preparer-hors-ligne  Exporte toutes les images dans sortie/images-box.tar (installation sans internet)
  reinitialiser        Supprime conteneurs ET volumes (demande confirmation)
EOF
}

commande=${1:-aide}
shift || true
case $commande in
    installer)            cmd_installer "$@" ;;
    donnees-demo)         cmd_donnees_demo ;;
    demarrer)             cmd_demarrer ;;
    arreter)              cmd_arreter ;;
    etat)                 cmd_etat ;;
    journaux)             cmd_journaux "$@" ;;
    certificat)           cmd_certificat ;;
    sauvegarder)          cmd_sauvegarder ;;
    sauvegardes)          cmd_sauvegardes ;;
    tester-restauration)  cmd_tester_restauration "$@" ;;
    restaurer)            cmd_restaurer "$@" ;;
    verifier-hors-ligne)  cmd_verifier_hors_ligne ;;
    moteur-ia)            cmd_moteur_ia "$@" ;;
    ia)                   charger_env; exec python3 "$ICI/../ia/gerer_modeles.py" "$@" ;;
    indexer-ia)           cmd_indexer_ia ;;
    assistant)            exec python3 "$ICI/installeur/assistant.py" "$@" ;;
    preparer-hors-ligne)  cmd_preparer_hors_ligne ;;
    reinitialiser)        cmd_reinitialiser ;;
    aide|-h|--help)       cmd_aide ;;
    *)                    cmd_aide; exit 1 ;;
esac
