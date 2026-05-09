#!/usr/bin/env bash
# scripts/tauri-nuke.sh — Rebuild app and start with a fresh dev database,
# Astro build cache cleared.
#
# Use when docker:reset is not enough: Astro build produces stale output after
# a dependency upgrade or when incremental cache seems corrupted.
# Clears front/.astro before rebuilding.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STRATA_DEV_DB="$REPO_ROOT/backend/.data/strata-dev.db"

echo "▸ Deleting dev database …"
rm -f "$STRATA_DEV_DB"
echo "  Deleted: $STRATA_DEV_DB"

echo "▸ Clearing Astro build cache …"
rm -rf "$REPO_ROOT/front/.astro"
echo "  Cleared: front/.astro"

exec "$(dirname "$0")/tauri-dev.sh"
