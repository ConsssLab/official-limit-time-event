#!/usr/bin/env bash
# Assemble the slim deploy bundle for Walrus Sites (only optimized web assets).
set -euo pipefail
cd "$(dirname "$0")"

rm -rf dist
mkdir -p dist/chests

cp index.html styles.css app.js ws-resources.json dist/
cp consss_1st_gift.webp dist/
# chests/ now holds the powered-by logos (Tatum.png, Walrus.png), not chest tiles.
cp chests/*.png dist/chests/

echo "dist/ built:"
du -sh dist
find dist -type f | sort
