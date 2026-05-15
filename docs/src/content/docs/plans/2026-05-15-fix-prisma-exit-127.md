---
title: "2026-05-15: Fix Prisma exit 127 on desktop launch + doc polish"
description: "Fix 'prisma migrate deploy exited with exit status: 127' when launching Strata.app from /Applications; fix release page title format; shorten Why Strata callout."
---

## Problem

Three issues discovered after v1.2.3 desktop install feature:

### 1. Prisma exit 127 on desktop launch

```
Strata — startup error
Database migration failed:
prisma migrate deploy exited with exit status: 127
```

**Root cause**: macOS GUI apps launch with a stripped PATH (`/usr/bin:/bin:/usr/sbin:/sbin`). `find_npx()` returns `/opt/homebrew/bin/npx` — a JS script with `#!/usr/bin/env node` shebang. When the OS tries to execute it, `env node` fails because `/opt/homebrew/bin` is not in PATH → exit 127.

### 2. Release page titles too long

`v1-2-3.md` and `v1-2-4.md` had subtitles in their `title:` frontmatter (`"v1.2.3: Desktop install script + doc site fixes"`). All older releases use `"vX.Y.Z"` only.

### 3. "Why Strata?" callout too long

`strataapp.md` intro blockquote was too verbose.

## Fix

### 1 — `src-tauri/src/lib.rs`

Replace `npx prisma migrate deploy` / `npx prisma db seed` with:
```
node backend/node_modules/prisma/build/index.js migrate deploy
node backend/node_modules/prisma/build/index.js db seed
```

`find_node()` returns `/opt/homebrew/bin/node` (a native Mach-O binary — works without PATH). The local prisma script at `backend/node_modules/prisma/build/index.js` is used directly via Node, bypassing the shebang/env problem entirely. Remove `find_npx()`.

### 2 — Release title format

- `v1-2-3.md` + `v1-2-4.md` titles → `"v1.2.3"` / `"v1.2.4"`
- `agents-plan-checklist.instructions.md` — clarify: release doc `title:` = `"vX.Y.Z"` only (no subtitle)

### 3 — Shorten callout

`strataapp.md` intro callout shortened to a brief one-liner.

## AGENTS.md checklist

| # | Convention | Check |
|---|---|---|
| 1 | Docs | This plan + execution summary |
| 2 | Test gates | Rust compile + manual launch verify |
| 3 | Self-review | ✅ all files cross-referenced |
| 4 | Endpoint coverage | N/A |
| 5 | Bug-to-Test | Manual: tauri:install + double-click |
| 6 | Seed isolation | N/A |
| 7 | Transaction invariants | N/A |
| 8 | Plan history | ✅ this file |
| 9 | Infra test gate | `npm run tauri:install` + launch verify |
| 10 | Env compat | N/A |
| 11 | Do-no-harm | N/A (pure bug fix) |
| 12 | Execution summary | Append after done |
| 13 | Doc grep | No renames |
| 14 | Semver release | v1.2.5 patch |
