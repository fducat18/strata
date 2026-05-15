---
title: "2026-05-15: Fix backend crash on desktop launch — npx in stripped PATH"
description: "NestJS bootstrap calls npx prisma migrate deploy, which fails with exit 127 when macOS strips PATH for GUI apps. Fixed by using process.execPath + local prisma script."
---

## Problem

After v1.2.5 fixed `lib.rs`, the desktop app passed the Prisma migration step but the backend failed to become healthy:

```
Backend health check 1/30 …
…
Backend did not become healthy after 30 attempts
Some services failed to start
```

**Root cause**: `backend/src/main.ts` also calls `execSync('npx prisma migrate deploy')` inside NestJS bootstrap. When Tauri spawns the backend with macOS stripped PATH (`/usr/bin:/bin:/usr/sbin:/sbin`), `npx` is not found → backend crashes immediately → health checks all fail.

There were two separate places calling `npx prisma`:
1. `src-tauri/src/lib.rs` — fixed in v1.2.5
2. `backend/src/main.ts` — fixed in this release

## Fix

Replace `execSync('npx prisma migrate deploy')` with:

```typescript
const prismaJs = path.join(__dirname, '..', 'node_modules', 'prisma', 'build', 'index.js');
execFileSync(process.execPath, [prismaJs, 'migrate', 'deploy'], {
  stdio: 'inherit',
  env: { ...process.env },
});
```

- `process.execPath` = absolute path to the running node binary (set by Tauri's `find_node()` call) — works without PATH
- `prismaJs` = local prisma binary from `backend/node_modules/` — works without PATH
- Also works in Docker and `npm run start:dev` modes (same node binary, same local prisma)

## AGENTS.md checklist

| # | Convention | Check |
|---|---|---|
| 1 | Docs | This plan + execution summary |
| 2 | Test gates | Backend unit + build + tauri:install launch |
| 3 | Self-review | ✅ |
| 4 | Endpoint coverage | N/A |
| 5 | Bug-to-Test | tauri:install + double-click verify |
| 6 | Seed isolation | N/A |
| 7 | Transaction invariants | N/A |
| 8 | Plan history | ✅ this file |
| 9 | Infra test gate | npm run tauri:install + launch verify |
| 10 | Env compat | N/A |
| 11 | Do-no-harm | Docker/dev mode migration still works |
| 12 | Execution summary | Append after done |
| 13 | Doc grep | N/A |
| 14 | Semver release | v1.2.6 patch |

## Execution Summary

**Commit**: 52a118f

### Actual changes

- `backend/src/main.ts` — replaced `execSync('npx prisma migrate deploy')` with `execFileSync(process.execPath, [prismaJs, 'migrate', 'deploy'])` using local `node_modules/prisma/build/index.js`

### Deviations from plan

None.

### Test results

| Gate | Result |
|---|---|
| Backend build (`nest build`) | ✅ success |
| Backend unit (`npm test`) | ✅ 319 tests passed |
| `npm run tauri:install` | ✅ built and installed |
| Double-click launch | ✅ backend healthy on port 3456, dashboard loads |
| Backend e2e | ⏭ not affected |
| Frontend unit / e2e | ⏭ not affected |

### Key discoveries

- `backend/dist/` is gitignored — tauri-build.sh rebuilds it from source during `npm run tauri:install`. The fix only needs to be in `src/main.ts`.
- `process.execPath` in the child NestJS process equals the node binary that Tauri used to spawn it (`find_node()` result), so the pattern is self-consistent.
- `__dirname` in compiled CJS `dist/main.js` = `backend/dist/`, so `path.join(__dirname, '..', 'node_modules', ...)` = `backend/node_modules/prisma/build/index.js` ✅
