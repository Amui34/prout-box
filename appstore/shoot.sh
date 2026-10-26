#!/bin/sh
# Captures brutes pour l'App Store (6,9" = 1320 × 2868) depuis le simulateur iPhone 17 Pro Max.
# Usage : appstore/shoot.sh <nom>   → appstore/raw/<nom>.png
# L'app doit être lancée et à l'écran voulu (voir fiche.md pour la liste des 5 écrans).
# Pour remplir le classement sans micro : 5 taps sur le titre « Prout Box » (mode démo).
set -e
cd "$(dirname "$0")"
DEVICE="${DEVICE:-iPhone 17 Pro Max}"
mkdir -p raw
xcrun simctl io "$DEVICE" screenshot --type=png "raw/$1.png"
echo "✓ raw/$1.png"
