#!/usr/bin/env bash
# scripts/tauri-install.sh — Build Strata.app and install it to /Applications
#
# One-time setup so you can double-click Strata from Finder or Spotlight
# without ever opening a terminal again.
#
# After install: double-click /Applications/Strata.app — that's it.
#
# Known requirements:
#   - Node.js must be installed (the .app spawns it as a sidecar)
#   - The repo must stay at this path (paths are baked in at compile time)
#   - Data is stored at <repo>/backend/.data/strata.db (shared with docker:prod)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="Strata.app"
BUILD_PATH="$REPO_ROOT/src-tauri/target/release/bundle/macos/$APP_NAME"
INSTALL_PATH="/Applications/$APP_NAME"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Strata — Install to /Applications          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Step 1: Build the .app
echo "▸ Building Strata.app …"
bash "$REPO_ROOT/scripts/tauri-build.sh"

if [[ ! -d "$BUILD_PATH" ]]; then
  echo ""
  echo "❌  Build succeeded but $APP_NAME not found at expected path:"
  echo "   $BUILD_PATH"
  exit 1
fi

# Step 2: Clear macOS quarantine flag (unsigned app)
echo ""
echo "▸ Clearing macOS quarantine flag …"
xattr -cr "$BUILD_PATH"

# Step 3: Copy to /Applications (overwrite existing)
echo "▸ Installing to /Applications …"
if [[ -d "$INSTALL_PATH" ]]; then
  echo "   Removing existing $INSTALL_PATH …"
  rm -rf "$INSTALL_PATH"
fi

cp -r "$BUILD_PATH" "$INSTALL_PATH"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   ✅ Strata installed successfully!           ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "   → Double-click Strata in Finder or Spotlight to launch"
echo "   → Or: open /Applications/Strata.app"
echo ""
echo "   ⚠️  The repo must stay at this path for the app to work:"
echo "   $REPO_ROOT"
echo ""
echo "   ⚠️  Node.js must remain installed (the app needs it at runtime)"
echo ""
