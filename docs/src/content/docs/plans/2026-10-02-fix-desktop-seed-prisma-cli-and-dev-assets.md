---
title: "2026-10-02: Fix desktop seed reliability, Prisma CLI resolution, and dev seed assets"
description: "Fix desktop startup seed failures and Prisma CLI path resolution, add stock+crypto dev seed assets, and harden install verification."
---

## Problem

Two production desktop issues and one seed-content request must be delivered together:

1. Fresh macOS desktop install can start with **no asset types**.
2. Desktop launch from `/Applications` can fail with:
   `prisma CLI not found at .../backend/node_modules/prisma/build/index.js`.
3. Development seed dataset must include one **stock** asset and one **crypto** asset.

## Current state

- `src-tauri/src/lib.rs` resolves Prisma CLI via a single hardcoded path (`node_modules/prisma/build/index.js`).
- Desktop seed execution is non-blocking on failure; startup can continue with incomplete reference data.
- Reference seeding in production is currently tied to file-fresh detection instead of explicit reference-data presence.
- `backend/prisma/seed.ts` dev dataset currently contains banking/real-estate/loan/vehicle assets only.

## Decisions

- Production self-heal scope: **auto-heal only when `asset_types` count is `0`**.
- If `asset_types` has any rows, startup will not auto-reseed.
- If first-run seed fails, startup must fail explicitly (no silent success-shaped fallback).

## Implementation plan

1. Update Tauri Prisma CLI resolution in `src-tauri/src/lib.rs` to support current package layouts (no single-path assumption).
2. Make desktop seed path strict:
   - return `Result` from seed runner,
   - include stderr in error path,
   - fail startup when required seed fails.
3. Add production reference-data check and run seed only when `asset_types` is empty.
4. Extend dev seed in `backend/prisma/seed.ts`:
   - add one stock demo asset,
   - add one crypto demo asset,
   - add snapshot-history config for both,
   - update any deterministic baseline values impacted by totals.
5. Extend regression tests:
   - Rust tests for Prisma CLI path resolution + seed decision behavior,
   - backend seed-profile assertions for new dev demo assets/content.
6. Harden `scripts/tauri-install.sh` post-install verification to detect missing seeded reference data.
7. Update docs (`desktopapp.md`, `dev-setup.md`, `configuration.md`, `migrations.md`, and any references to demo asset counts).
8. Run required gates:
   - backend build + `test:cov` + `test:e2e`
   - frontend coverage + frontend e2e
   - infra gate: `npm run tauri:install`
9. If all gates pass: commit + push feature branch changes.
10. Run explicit semver release flow:
   - `git tag --sort=-v:refname | head -5`
   - `npm run release -- X.Y.Z`
   - create `docs/src/content/docs/releases/vX-Y-Z.md` and update releases index.

## AGENTS.md planning checklist

| # | Convention | Check |
|---|---|---|
| 1 | Documentation parity | Covered (plan + docs updates included) |
| 2 | 4 test gates | Covered explicitly in plan |
| 3 | Self-review before approval | Completed below |
| 4 | Endpoint coverage | N/A (no new API endpoint planned) |
| 5 | Bug-to-Test | Regression tests included |
| 6 | Seed/Test isolation | Tests use isolated DB fixtures |
| 7 | Transaction invariants | N/A |
| 8 | Plan history | This plan file created before implementation |
| 9 | Infra gate | `npm run tauri:install` included |
| 10 | Environment compatibility | Included in runtime/infra validation |
| 11 | Do-no-harm baseline | N/A (bug fix + seed content change) |
| 12 | Execution Summary | Will append after implementation |
| 13 | Doc grep rule | Will run if paths/commands change |
| 14 | Semver release rule | Included as final step |

## Self-review

| Check | Status | Notes |
|---|---|---|
| Internal consistency | ✅ | All planned file edits correspond to reported issues |
| Cross-reference verification | ✅ | Tauri runtime, install script, seed files, tests, docs mapped |
| Acceptance mapping | ✅ | Asset-type absence + Prisma CLI error + seed-content request all mapped |
| Open ambiguities | ✅ | Self-heal policy confirmed (`asset_types == 0`) |

## Execution Summary

**Commit SHA(s)**: `3c710f8`, `3754d8c`

### Actual changes

- `src-tauri/src/lib.rs`
  - Replaced hardcoded Prisma CLI lookup with multi-candidate resolution (package.json bin + fallbacks).
  - Made seeding fail-fast (`Result` + startup error dialog) instead of warning-only.
  - Added production self-heal trigger when `asset_types` count is `0`.
  - Added Rust unit tests for Prisma path resolution and seed decision policy.
- `backend/src/main.ts`
  - Added resilient Prisma CLI path resolution for migration bootstrap.
- `backend/prisma/seed.ts`
  - Added two dev demo assets: `MSCI World ETF` (STOCKS) and `Bitcoin Wallet` (CRYPTO).
  - Added 10-year snapshot history definitions for both.
  - Updated seeded portfolio baseline snapshot value to `245800.0`.
- `backend/test/seed-profile.e2e-spec.ts`
  - Added assertions for STOCKS/CRYPTO asset presence in development seed and absence in production seed.
- `scripts/tauri-install.sh`
  - Added strict post-install seed verification by querying `asset_types` count from `strata.db`.
- Docs updated:
  - `desktopapp.md`, `configuration.md`, `adr-003-database-strategy.md`
  - plans index + this plan record.

### Deviations from plan

- Planned docs scope included `dev-setup.md` and `migrations.md`; no semantic drift was present there, so changes were limited to files that contained outdated or newly impacted statements (`desktopapp`, `configuration`, ADR-003).
- Post-install seed verification was implemented via direct SQLite count check (`better-sqlite3`) rather than API probe, because desktop runtime API requires per-session token not available to install script.

### Test results

| Gate | Result |
|---|---|
| Backend build | ✅ `cd backend && npm run build` |
| Backend unit coverage | ✅ `cd backend && npm run test:cov` (350 passed) |
| Backend e2e | ✅ `cd backend && npm run test:e2e` (75 passed) |
| Frontend unit coverage | ✅ `cd front && npx vitest run --coverage` (467 passed) |
| Frontend e2e | ✅ `cd front && npm run test:e2e` (35 passed) |
| Infra gate | ✅ `npm run tauri:install` (post-install runtime checks passed; reference seed check passed) |
| Docs build | ✅ `cd docs && npm run build` |

### Key discoveries

- The hardcoded Prisma CLI entrypoint (`prisma/build/index.js`) is not reliable across installed layouts; runtime must resolve from package metadata/fallbacks.
- Seed-failure-as-warning was enough to produce a “startup succeeded but no asset types” state; startup must treat required seed failure as blocking.
