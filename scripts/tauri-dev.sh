#!/usr/bin/env bash
# scripts/tauri-dev.sh — Start Strata in Tauri dev mode
#
# Rebuilds both frontend (with correct API URL) and backend,
# then launches `npx tauri dev` which opens the Tauri webview.
# The Tauri app itself spawns the backend + frontend sidecars.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_PORT=3456
API_URL="http://localhost:${BACKEND_PORT}/api/v1"

echo "▸ Building frontend with PUBLIC_API_URL=${API_URL} …"
cd "$REPO_ROOT/front"
PUBLIC_API_URL="$API_URL" npm run build

echo "▸ Building backend …"
cd "$REPO_ROOT/backend"
npm run build

echo "▸ Launching Tauri dev …"
cd "$REPO_ROOT"
npx tauri dev
