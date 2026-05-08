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

**Commit:** `cee4832`

### Actual changes

| File | Change |
|---|---|
| `scripts/tauri-dev.sh` | Added root `npm ci 2>/dev/null \|\| npm install` before the frontend step |
| `scripts/tauri-build.sh` | Same, before the backend step |
| `docs/src/content/docs/plans/2026-05-09-fix-tauri-root-npm-install.md` | This plan doc (new file) |

### Deviations from plan

None.

### Test results

| Gate | Result |
|---|---|
| Backend unit | ✅ 265 tests passed |
| Backend e2e  | ⏭ skipped (unaffected) |
| Frontend unit | ⏭ skipped (unaffected) |
| Frontend e2e  | ⏭ skipped (unaffected) |
| Tauri symlink | ✅ `node_modules/.bin/tauri` → `../@tauri-apps/cli/tauri.js`, `tauri-cli 2.10.1` |

### Key discoveries

- The root `node_modules` only had `@tauri-apps` — a sparse install suggesting the root was installed once but never refreshed with the scripts.
- The broken symlink had an **empty** target (`lrw-------- tauri ->`), not a dangling one. This is a known Google Drive artefact when syncing across machines.
- After `npm install` at root, the symlink was recreated correctly in under 2 seconds.

