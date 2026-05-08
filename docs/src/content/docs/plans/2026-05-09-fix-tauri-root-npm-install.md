---
title: Fix — missing root npm install in tauri dev/build scripts
description: Add root npm install to tauri-dev.sh and tauri-build.sh so the @tauri-apps/cli symlink is always valid before npx tauri dev/build is called.
---

## Problem

After the [Prisma generate fix](/plans/2026-05-08-fix-prisma-generate-tauri), `npm run tauri:dev` got further but still failed at the final step:

```
▸ Launching Tauri dev …
npm error could not determine executable to run
```

**Root cause:** `node_modules/.bin/tauri` was a **broken symlink** (empty target string). `@tauri-apps/cli` lives in the repo root's `devDependencies`, but `tauri-dev.sh` never ran `npm install` at the repo root — only at `front/` and `backend/`.

The script already had a comment about this exact class of problem:

> Note: if the repo is synced via Google Drive, node_modules symlinks are broken after switching machines. The npm install steps below self-heal this.

The self-healing only covered `front/` and `backend/` — not the root where `@tauri-apps/cli` lives.

Diagnosis:
```
$ ls -la node_modules/.bin/tauri
lrw-------- tauri ->        ← broken (empty target)

$ ls node_modules/@tauri-apps/cli/tauri.js
node_modules/@tauri-apps/cli/tauri.js   ← file exists, just not linked
```

---

## Fix

Added `npm ci 2>/dev/null || npm install` at the repo root **before** the front and backend steps in both scripts:

### `scripts/tauri-dev.sh` and `scripts/tauri-build.sh`

```bash
echo "▸ Installing root dependencies (Tauri CLI) …"
cd "$REPO_ROOT"
npm ci 2>/dev/null || npm install
```

This runs first, healing the `node_modules/.bin/tauri` symlink so the later `npx tauri dev` / `npx tauri build` call resolves correctly.

---

## Why this happens

The repo root `package.json` has a minimal install — only `@tauri-apps/cli` in devDependencies. When node_modules are broken (Google Drive sync, machine switch, or missing install), the scripts now self-heal the root in addition to front and backend.

---

## Execution Summary

_To be appended after implementation._
