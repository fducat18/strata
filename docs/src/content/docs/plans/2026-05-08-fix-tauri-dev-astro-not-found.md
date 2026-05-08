---
title: "Fix tauri:dev astro command not found + release --no-push flag"
description: "Root cause analysis and fix for the multi-machine Google Drive symlink issue, tauri-dev.sh hardening, and a new --no-push flag for the release script."
---

## Problem

### 1. `npm run tauri:dev` fails with `sh: astro: command not found`

The project is developed on two Macs (M3 Pro + M1 Max) with source synced via **Google Drive offline mode**.  
When switching machines, Google Drive does not correctly replicate symlinks — `node_modules/.bin/` entries arrive as empty/broken zero-byte symlinks on the second machine.

Root confirmation: `front/node_modules/.bin/astro` was a symlink pointing to `""` (empty string, size 0).

Secondary issue: `tauri-dev.sh` had no `npm install` step (unlike `tauri-build.sh`), so it could not self-heal after a machine switch.

Also: the root `package.json` invoked all tauri scripts with `sh scripts/tauri-*.sh`, but the scripts use `#!/usr/bin/env bash` and bash-only features (`pipefail`). `sh` ignores the shebang.

### 2. No way to release without pushing

`release.mjs` always pushed to remote after tagging. There was no way to bump versions, commit, and tag locally without immediately pushing.

---

## Solution

### `scripts/tauri-dev.sh`
- Added `npm ci 2>/dev/null || npm install` for both `front/` and `backend/` before building.
- Added Google Drive path detection: if `REPO_ROOT` contains `Google Drive`, a warning is printed to explain the symlink situation.

### `package.json` (root)
- Changed `sh scripts/tauri-*.sh` → `bash scripts/tauri-*.sh` for all four tauri scripts so the `#!/usr/bin/env bash` shebang and `pipefail` are respected.

### `scripts/release.mjs`
- Added `--no-push` flag. When set, the script bumps all 6 version files, commits, and tags locally but skips both `git push` calls.
- Prints manual push instructions when `--no-push` is used.

### `docs/versioning.md`
- Documented the new `--no-push` flag.

### `docs/desktopapp.md`
- Added "Multi-machine development" section explaining the Google Drive / symlink behavior and that `tauri-dev.sh` now auto-heals.

---

## Files changed

| File | Change |
|---|---|
| `scripts/tauri-dev.sh` | `npm install` before build + Google Drive warning |
| `package.json` (root) | `sh` → `bash` for tauri scripts |
| `scripts/release.mjs` | `--no-push` flag |
| `docs/src/content/docs/versioning.md` | Document `--no-push` |
| `docs/src/content/docs/desktopapp.md` | Multi-machine development section |
