#!/usr/bin/env bash
# Point d'entrée unique de la plateforme de la box (DEV-1).
# Usage : ./box.sh <commande>. Liste des commandes : ./box.sh aide
set -euo pipefail

ICI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ICI"

SORTIE="$ICI/sortie"
JOURNAL="$SORTIE/journal/evenements.jsonl"
COMPOSE=(docker compose)
CLES_SECRETES=(NC_ADMIN_PASSWORD NC_DB_PASSWORD CACHE_PASSWORD VW_ADMIN_TOKEN DEMO_MOT_DE_PASSE SAUVEGARDE_MOT_DE_PASSE)

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
attendre() {
    local service=$1 limite=${2:-600} debut=$SECONDS id etat
    id=$("${COMPOSE[@]}" ps -q "$service")
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
  Certificat racine     http://${BOX_DOMAIN}/autorite-locale.crt

  Mots de passe : fichier .env (NC_ADMIN_PASSWORD, DEMO_MOT_DE_PASSE). Adresse d'écoute : ${BIND_ADDRESS}.
EOF
}

cmd_installer() {
    verifier_prerequis
    creer_env
    charger_env
    info "Construction de l'image Nextcloud de la box"
    "${COMPOSE[@]}" build nextcloud
    info "Démarrage des services"
    "${COMPOSE[@]}" up -d
    info "Attente de la fin de l'installation de Nextcloud (1 à 3 minutes la première fois)"
    attendre db 120
    attendre cache 120
    attendre nextcloud 900
    attendre coffre 120
    attendre proxy 60
    exporter_certificat
    journal installation "services de base installés et démarrés"
    afficher_adresses
    echo
    info "Étape suivante pour la démo : ./box.sh donnees-demo"
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
    journal reinitialisation "conteneurs et volumes supprimés"
    ok "box réinitialisée (le fichier .env est conservé)"
}

cmd_aide() {
    cat <<'EOF'
Usage : ./box.sh <commande>

  installer            Crée .env (secrets), construit, démarre et attend que tout soit prêt
  donnees-demo         Charge le cabinet FICTIF : comptes, dossiers, droits, agendas, contacts
  demarrer | arreter   Démarre ou arrête les services
  etat                 État des services et adresses
  journaux [service]   Journaux des conteneurs
  certificat           Exporte le certificat racine local dans sortie/
  preparer-hors-ligne  Exporte toutes les images dans sortie/images-box.tar (installation sans internet)
  reinitialiser        Supprime conteneurs ET volumes (demande confirmation)
EOF
}

commande=${1:-aide}
shift || true
case $commande in
    installer)            cmd_installer ;;
    donnees-demo)         cmd_donnees_demo ;;
    demarrer)             cmd_demarrer ;;
    arreter)              cmd_arreter ;;
    etat)                 cmd_etat ;;
    journaux)             cmd_journaux "$@" ;;
    certificat)           cmd_certificat ;;
    preparer-hors-ligne)  cmd_preparer_hors_ligne ;;
    reinitialiser)        cmd_reinitialiser ;;
    aide|-h|--help)       cmd_aide ;;
    *)                    cmd_aide; exit 1 ;;
esac
