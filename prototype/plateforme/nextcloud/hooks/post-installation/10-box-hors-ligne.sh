#!/bin/sh
# Configuration de Nextcloud pour la box, appliquée une fois après l'installation.
# Objectif : aucune connexion sortante, interface en français, rien d'inutile pour un cabinet.
set -eu

occ() { php /var/www/html/occ "$@"; }
# Réglages de confort : un échec est signalé mais ne bloque pas l'installation.
essayer() { occ "$@" || echo "[box] Attention : échec de « occ $* »"; }

echo "[box] Coupure de toutes les fonctions qui appellent internet"
occ config:system:set has_internet_connection --type=boolean --value=false
occ config:system:set appstoreenabled --type=boolean --value=false
occ config:system:set updatechecker --type=boolean --value=false
occ config:system:set upgrade.disable-web --type=boolean --value=true
occ config:system:set knowledgebaseenabled --type=boolean --value=false
occ config:system:set reference_opengraph --type=boolean --value=false
occ config:system:set gs.enabled --type=boolean --value=false
occ config:system:set lookup_server --value=""
occ config:app:set files_sharing lookupServerEnabled --value=no
occ config:app:set files_sharing lookupServerUploadEnabled --value=no
essayer config:app:set password_policy enforceHaveIBeenPwned --value=0
essayer config:app:set contacts allowSocialSync --value=no

# Applications qui contactent des services externes ou ne servent pas à un cabinet hors ligne.
# (appstore et lookup_server_connector ne peuvent pas être désactivées : elles sont neutralisées
# par appstoreenabled=false, has_internet_connection=false et les deux réglages lookupServer.)
for app in updatenotification survey_client nextcloud_announcements weather_status \
           firstrunwizard support app_api federation sharebymail office recommendations; do
    occ app:disable "$app" >/dev/null 2>&1 && echo "[box] Application désactivée : $app" || true
done

echo "[box] Applications du cabinet"
occ app:enable calendar
occ app:enable contacts
# Journal d'audit de Nextcloud (connexions, accès et partages de fichiers) : data/audit.log
occ app:enable admin_audit

echo "[box] Langue, région, tâches de fond"
occ config:system:set default_language --value=fr
occ config:system:set default_locale --value=fr_FR
occ config:system:set default_phone_region --value=FR
occ config:system:set default_timezone --value=Europe/Paris
essayer config:system:set maintenance_window_start --type=integer --value=1
occ background:cron
# Migrations de types MIME : rapides sur une installation neuve, évitent un avertissement.
essayer maintenance:repair --include-expensive

echo "[box] Pas de fichiers d'exemple Nextcloud dans les comptes du cabinet"
occ config:system:set skeletondirectory --value=""
occ config:system:set templatedirectory --value=""

echo "[box] Partages : pas de lien public, pas de repartage"
occ config:app:set core shareapi_allow_links --value=no
essayer config:app:set core shareapi_allow_resharing --value=no

echo "[box] Apparence"
essayer theming:config name "${BOX_NOM:-Box du cabinet}"
essayer theming:config slogan "Vos dossiers restent au cabinet"
essayer theming:config url "https://${BOX_DOMAIN:-cabinet.localhost}"
essayer theming:config color "#1d3557"

echo "[box] Configuration terminée"
