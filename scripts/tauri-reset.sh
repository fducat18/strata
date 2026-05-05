#!/usr/bin/env bash
# scripts/tauri-reset.sh — Rebuild app and start with a fresh dev database.
#
# Deletes the Strata-Dev SQLite database then runs tauri-dev.sh.
# Tauri's lib.rs will migrate and seed the fresh database automatically.
# Use this when you want a clean data state without clearing build caches.

set -euo pipefail

STRATA_DEV_DB="$HOME/Library/Application Support/Strata-Dev/strata.db"

echo "▸ Deleting dev database …"
rm -f "$STRATA_DEV_DB"
echo "  Deleted: $STRATA_DEV_DB"

exec "$(dirname "$0")/tauri-dev.sh"
