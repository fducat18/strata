#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HELPER="$REPO_ROOT/scripts/lib/tauri-install-checks.sh"

if [[ ! -f "$HELPER" ]]; then
  echo "missing helper: $HELPER" >&2
  exit 1
fi

# shellcheck source=/dev/null
source "$HELPER"

tmp_log="$(mktemp)"
cleanup() {
  rm -f "$tmp_log"
}
trap cleanup EXIT

printf 'boot\n' >"$tmp_log"

(
  sleep 2
  printf 'Backend ready — navigating to bundled frontend\n' >>"$tmp_log"
) &

if ! wait_for_log_marker "$tmp_log" 20 "Backend ready — navigating to bundled frontend"; then
  echo "expected wait_for_log_marker to succeed when marker appears within timeout" >&2
  exit 1
fi

# Marker already present when wait starts must also pass.
printf 'Backend ready — navigating to bundled frontend\n' >"$tmp_log"
if ! wait_for_log_marker "$tmp_log" 2 "Backend ready — navigating to bundled frontend"; then
  echo "expected wait_for_log_marker to succeed when marker already exists" >&2
  exit 1
fi

echo "ok: delayed marker detected"
