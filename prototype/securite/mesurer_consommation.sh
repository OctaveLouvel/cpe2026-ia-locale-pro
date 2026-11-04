#!/usr/bin/env bash
# Mesure de la puissance consommée par la machine (DEV-4, critère RSE).
#
#     ./mesurer_consommation.sh <durée en secondes> <étiquette>
#
# Méthode : sur un portable débranché, la batterie mesure elle-même le courant et la tension
# (/sys/class/power_supply/BAT*). Puissance = courant x tension, relevée toutes les 2 secondes.
# C'est la consommation de TOUT le portable (écran compris), pas celle de la box seule.
# Sur la box réelle (mini-PC sur secteur), utiliser un wattmètre : ce script ne s'applique pas.
set -euo pipefail

DUREE=${1:-120}
ETIQUETTE=${2:-mesure}
BAT=$(ls -d /sys/class/power_supply/BAT* 2>/dev/null | head -1)
[ -n "$BAT" ] || { echo "Pas de batterie : mesurer au wattmètre." >&2; exit 1; }
[ "$(cat "$BAT/status")" = Discharging ] || { echo "Débrancher le chargeur : la batterie ne mesure que la décharge." >&2; exit 1; }

puissance() {
    if [ -f "$BAT/power_now" ]; then
        awk '{printf "%.2f", $1 / 1e6}' "$BAT/power_now"
    else
        awk -v i="$(cat "$BAT/current_now")" -v u="$(cat "$BAT/voltage_now")" 'BEGIN {printf "%.2f", i * u / 1e12}'
    fi
}

valeurs=()
fin=$((SECONDS + DUREE))
while [ "$SECONDS" -lt "$fin" ]; do
    valeurs+=("$(puissance)")
    sleep 2
done
printf '%s\n' "${valeurs[@]}" | awk -v e="$ETIQUETTE" -v d="$DUREE" '
    {s += $1; n++; if (min == "" || $1 < min) min = $1; if ($1 > max) max = $1}
    END {printf "%s : moyenne %.1f W (min %.1f, max %.1f) sur %d relevés en %d s\n", e, s / n, min, max, n, d}'
