#!/usr/bin/env bash
# scripts/tauri-dev.sh — Start Strata in Tauri dev mode
#
# Installs dependencies, rebuilds both frontend (with correct API URL) and backend,
# then launches `npx tauri dev` which opens the Tauri webview.
# The Tauri app itself spawns the backend + frontend sidecars.
#
# Note: if the repo is synced via Google Drive, node_modules symlinks are
# broken after switching machines. The npm install steps below self-heal this.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_PORT=3456
API_URL="http://localhost:${BACKEND_PORT}/api/v1"

if [[ "$REPO_ROOT" == *"Google Drive"* ]]; then
  echo "⚠️  Repo is inside Google Drive. node_modules symlinks may be broken after"
  echo "   switching machines. Running npm install automatically to self-heal…"
  echo ""
fi

echo "▸ Installing root dependencies (Tauri CLI) …"
cd "$REPO_ROOT"
npm ci 2>/dev/null || npm install

echo "▸ Installing frontend dependencies …"
cd "$REPO_ROOT/front"
npm ci 2>/dev/null || npm install

echo "▸ Building frontend with PUBLIC_API_URL=${API_URL} …"
PUBLIC_API_URL="$API_URL" npm run build

echo "▸ Installing backend dependencies …"
cd "$REPO_ROOT/backend"
npm ci 2>/dev/null || npm install

echo "▸ Generating Prisma client …"
npx prisma generate

echo "▸ Building backend …"
npm run build

echo "▸ Launching Tauri dev …"
cd "$REPO_ROOT"
npx tauri dev
