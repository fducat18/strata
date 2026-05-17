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
LOG_PATH="$HOME/Library/Logs/net.ducatillon.strata/Strata.log"
# shellcheck source=/dev/null
source "$REPO_ROOT/scripts/lib/tauri-install-checks.sh"

find_matching_port_pid() {
  local port="$1"
  local needle="$2"
  local pid
  while IFS= read -r pid; do
    [[ -z "$pid" ]] && continue
    local cmd
    cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
    if [[ "$cmd" == *"$needle"* ]]; then
      echo "$pid"
    fi
  done < <(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)
}

kill_pid_safely() {
  local pid="$1"
  [[ -z "$pid" ]] && return 0
  kill -TERM "$pid" 2>/dev/null || true
  sleep 1
  kill -KILL "$pid" 2>/dev/null || true
}

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

# Step 4: Post-install runtime verification (strict)
echo ""
echo "▸ Running post-install runtime checks …"

# Clean stale legacy frontend sidecar from older desktop runtime.
stale_front_pid="$(find_matching_port_pid 4321 "$REPO_ROOT/front/dist/server/entry.mjs" | head -n1 || true)"
if [[ -n "$stale_front_pid" ]]; then
  echo "   Found stale legacy frontend sidecar on :4321 (pid=$stale_front_pid). Terminating …"
  kill_pid_safely "$stale_front_pid"
fi

log_lines_before=0
if [[ -f "$LOG_PATH" ]]; then
  log_lines_before="$(wc -l < "$LOG_PATH" | tr -d ' ')"
fi

open "$INSTALL_PATH"

backend_pid=""
for _ in {1..45}; do
  backend_pid="$(find_matching_port_pid 3456 "$REPO_ROOT/backend/dist/main.js" | head -n1 || true)"
  if [[ -n "$backend_pid" ]]; then
    break
  fi
  sleep 1
done

if [[ -z "$backend_pid" ]]; then
  osascript -e 'tell application "Strata" to quit' >/dev/null 2>&1 || true
  echo "❌ Post-install check failed: desktop backend on :3456 did not start."
  exit 1
fi

if ! wait_for_log_marker "$LOG_PATH" 30 "Backend ready — navigating to bundled frontend" "$log_lines_before"; then
  osascript -e 'tell application "Strata" to quit' >/dev/null 2>&1 || true
  echo "❌ Post-install check failed: loader readiness marker missing in desktop log."
  echo "   Expected: Backend ready — navigating to bundled frontend"
  echo "   Last desktop log lines:"
  tail -n 20 "$LOG_PATH" 2>/dev/null || true
  exit 1
fi

legacy_4321_pid="$(find_matching_port_pid 4321 "$REPO_ROOT/front/dist/server/entry.mjs" | head -n1 || true)"
legacy_6543_pid="$(find_matching_port_pid 6543 "$REPO_ROOT/front/dist/server/entry.mjs" | head -n1 || true)"
if [[ -n "$legacy_4321_pid" || -n "$legacy_6543_pid" ]]; then
  osascript -e 'tell application "Strata" to quit' >/dev/null 2>&1 || true
  echo "❌ Post-install check failed: desktop launched legacy frontend sidecar."
  [[ -n "$legacy_4321_pid" ]] && echo "   :4321 pid=$legacy_4321_pid"
  [[ -n "$legacy_6543_pid" ]] && echo "   :6543 pid=$legacy_6543_pid"
  exit 1
fi

osascript -e 'tell application "Strata" to quit' >/dev/null 2>&1 || true
sleep 5
backend_pid_after_quit="$(find_matching_port_pid 3456 "$REPO_ROOT/backend/dist/main.js" | head -n1 || true)"
if [[ -n "$backend_pid_after_quit" ]]; then
  echo "❌ Post-install check failed: backend listener remained after app quit (pid=$backend_pid_after_quit)."
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   ✅ Strata installed successfully!           ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "   → Double-click Strata in Finder or Spotlight to launch"
echo "   → Or: open /Applications/Strata.app"
echo "   → Post-install runtime checks: passed"
echo ""
echo "   ⚠️  The repo must stay at this path for the app to work:"
echo "   $REPO_ROOT"
echo ""
echo "   ⚠️  Node.js must remain installed (the app needs it at runtime)"
echo ""
