#!/usr/bin/env bash
# Assemble the slim deploy bundle for Walrus Sites (only optimized web assets).
set -euo pipefail
cd "$(dirname "$0")"

rm -rf dist
mkdir -p dist/chests

cp index.html styles.css app.js ws-resources.json dist/
cp consss_1st_gift.webp dist/
cp chests/*.webp dist/chests/

echo "dist/ built:"
du -sh dist
find dist -type f | sort
