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

## Execution Summary

**Commit**: 168ec98

### Actual changes

- `src-tauri/src/lib.rs` — removed `find_npx()`; updated `run_prisma_migrate` and `run_prisma_seed` to call `node backend/node_modules/prisma/build/index.js` directly
- `docs/releases/v1-2-3.md` — title stripped to `"v1.2.3"`
- `docs/releases/v1-2-4.md` — title stripped to `"v1.2.4"`
- `docs/strataapp.md` — Why Strata callout shortened to one line
- `.github/instructions/agents-plan-checklist.instructions.md` — added "Release notes doc format" section clarifying title = `"vX.Y.Z"` only
- `docs/plans/2026-05-15-fix-prisma-exit-127.md` — this file

### Deviations from plan

None. Implementation followed the plan exactly.

### Test results

| Gate | Result |
|---|---|
| Rust compile (`cargo check`) | ✅ 0 errors, 0 warnings |
| `npm run tauri:install` | ✅ Built and installed to /Applications |
| Double-click launch | ✅ Backend healthy on port 3456, no error dialog |
| Backend unit / e2e | ⏭ not affected |
| Frontend unit / e2e | ⏭ not affected |

### Key discoveries

- `find_node()` already hardcoded the absolute Mach-O binary path — no additional path resolution needed.
- `/opt/homebrew/bin/npx` is a symlink to a JS file (`npm/bin/npx-cli.js`) with `#!/usr/bin/env node` — the shebang is what fails in stripped-PATH environments, not the binary existence check.
