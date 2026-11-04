#!/bin/sh
# Génère executive-summary.pdf depuis executive-summary.html avec Chromium (sans réseau).
set -e
cd "$(dirname "$0")"
chromium --headless --disable-gpu --no-pdf-header-footer --no-sandbox \
  --print-to-pdf=executive-summary.pdf "file://$PWD/executive-summary.html" 2>/dev/null
echo "executive-summary.pdf : $(pdfinfo executive-summary.pdf | awk '/^Pages/ {print $2}') page(s)"
