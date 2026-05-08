#!/usr/bin/env bash
# scripts/tauri-build.sh — Build Strata .app + .dmg
#
# Produces an unsigned macOS .app and .dmg in src-tauri/target/release/bundle/
#
# IMPORTANT: The resulting app is unsigned. To open it:
#   xattr -cr /path/to/Strata.app

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_PORT=3456
API_URL="http://localhost:${BACKEND_PORT}/api/v1"

echo "▸ Installing root dependencies (Tauri CLI) …"
cd "$REPO_ROOT"
npm ci 2>/dev/null || npm install

echo "▸ Installing backend dependencies …"
cd "$REPO_ROOT/backend"
npm ci --omit=dev 2>/dev/null || npm install --omit=dev

echo "▸ Generating Prisma client …"
npx prisma generate

echo "▸ Building backend …"
npm run build

echo "▸ Installing frontend dependencies …"
cd "$REPO_ROOT/front"
npm ci 2>/dev/null || npm install

echo "▸ Building frontend with PUBLIC_API_URL=${API_URL} …"
PUBLIC_API_URL="$API_URL" npm run build

echo "▸ Building Tauri app …"
cd "$REPO_ROOT"

# Source rustup environment — cargo may not be on PATH in non-interactive shells
if [[ -f "$HOME/.cargo/env" ]]; then
  source "$HOME/.cargo/env"
fi

# Verify cargo is available (Tauri requires Rust to build the desktop shell)
if ! command -v cargo &>/dev/null; then
  echo ""
  echo "❌  Rust/Cargo not found. Tauri requires Rust to build the desktop app."
  echo ""
  echo "   Install Rust with:"
  echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
  echo "   source ~/.cargo/env"
  echo ""
  echo "   Then re-run this script."
  exit 1
fi

npx tauri build --bundles app

echo ""
echo "✅ Build complete!"
echo "   .app → src-tauri/target/release/bundle/macos/Strata.app"
echo ""
echo "⚠️  The app is unsigned. To open:"
echo "   xattr -cr src-tauri/target/release/bundle/macos/Strata.app"
