#!/usr/bin/env bash
# Prépare une machine Debian 13 (trixie) fraîchement installée pour devenir une box (DEV-1).
# À lancer en root, en atelier, avec une connexion internet :
#
#     ./preparer-debian.sh <compte>      # <compte> : utilisateur qui pilotera la box
#
# Le chiffrement du disque se choisit PENDANT l'installation de Debian : « Assisté - utiliser un
# disque entier avec LVM chiffré ». Il ne peut pas être ajouté après coup par ce script, qui se
# contente de vérifier qu'il est en place.
#
# ATTENTION : script écrit le 3 novembre 2026, pas encore exécuté sur une machine réelle.
set -euo pipefail

COMPTE=${1:-}
[ "$(id -u)" -eq 0 ] || { echo "À lancer en root (sudo)." >&2; exit 1; }
[ -n "$COMPTE" ] && id "$COMPTE" >/dev/null 2>&1 || { echo "Usage : $0 <compte existant>" >&2; exit 1; }
. /etc/os-release
[ "${VERSION_CODENAME:-}" = trixie ] || echo "Attention : prévu pour Debian 13 (trixie), système détecté : ${PRETTY_NAME:-inconnu}"

echo "==> Chiffrement du disque système"
racine=$(findmnt -no SOURCE / | cut -d'[' -f1)
if lsblk -s -no TYPE "$racine" | grep -qx crypt; then
    echo "    ok : la racine ($racine) est sur un volume chiffré LUKS"
else
    echo "    ATTENTION : la racine ($racine) n'est PAS chiffrée. Réinstaller Debian avec « LVM chiffré »." >&2
fi

echo "==> Paquets (versions de Debian 13 : Docker 26.1, Compose 2.26)"
apt-get update
apt-get install -y --no-install-recommends \
    docker.io docker-compose docker-buildx \
    python3 openssl curl jq rsync ca-certificates nftables

echo "==> Docker : journaux limités en taille, conteneurs maintenus pendant les mises à jour du démon"
install -d /etc/docker
if [ ! -f /etc/docker/daemon.json ]; then
    cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "local",
  "log-opts": { "max-size": "10m", "max-file": "3" },
  "live-restore": true
}
EOF
fi
systemctl enable --now docker
usermod -aG docker "$COMPTE"

echo "==> Pare-feu : seuls les ports 80 et 443 sont ouverts, et seulement au réseau local"
# Les ports publiés par Docker passent par la chaîne « forward » gérée par Docker : cette table ne
# filtre que ce qui arrive sur la machine elle-même. Le filtrage des connexions sortantes et le
# journal des connexions relèvent de DEV-4 (sécurité).
cat > /etc/nftables.conf <<'EOF'
#!/usr/sbin/nft -f
flush ruleset
table inet box {
    chain entree {
        type filter hook input priority filter; policy drop;
        iif "lo" accept
        ct state established,related accept
        ip saddr { 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 } tcp dport { 80, 443 } accept
        ip6 saddr fe80::/10 tcp dport { 80, 443 } accept
        icmp type echo-request limit rate 5/second accept
        icmpv6 type { nd-neighbor-solicit, nd-router-advert, nd-neighbor-advert, echo-request } accept
    }
}
EOF
systemctl enable --now nftables

echo "==> Sauvegarde automatique chaque nuit à 2 h 30 (quand SAUVEGARDE_DESTINATION est renseignée)"
REPERTOIRE=$(cd "$(dirname "$0")/.." && pwd)
cat > /etc/cron.d/box-sauvegarde <<EOF
# Sauvegarde chiffrée de la box (voir $REPERTOIRE/README.md)
30 2 * * * root cd $REPERTOIRE && ./box.sh sauvegarder >> /var/log/box-sauvegarde.log 2>&1
EOF

cat <<EOF

Préparation terminée. Étapes suivantes, connecté en tant que $COMPTE (nouvelle session pour le groupe docker) :
  cd $REPERTOIRE
  # avec internet (atelier) :
  ./box.sh installer
  # ou sans internet, à partir de l'archive d'images préparée ailleurs :
  docker load -i images-box.tar && ./box.sh installer
Puis, dans .env : BIND_ADDRESS=0.0.0.0 et BOX_DOMAIN=cabinet.internal pour l'accès depuis les postes du cabinet.
EOF
