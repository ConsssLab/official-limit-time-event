#!/usr/bin/env bash
# Assemble the slim deploy bundle for Walrus Sites (only optimized web assets).
set -euo pipefail
cd "$(dirname "$0")"

rm -rf dist
mkdir -p dist/chests dist/assets/ui

cp index.html styles.css app.js ws-resources.json dist/
# NFT reveal image (shown on successful claim).
cp consss_1st_gift.png dist/
# Official Chainoa design system assets (shared with conssswars.com).
cp assets/consss.png dist/assets/
cp assets/ui/*.png dist/assets/ui/
# Powered-by logos.
cp chests/Tatum.png chests/Walrus.png dist/chests/

echo "dist/ built:"
du -sh dist
find dist -type f | sort
