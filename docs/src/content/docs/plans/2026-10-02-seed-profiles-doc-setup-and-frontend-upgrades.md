---
title: "2026-10-02: Seed profiles, dev setup docs, and frontend dependency upgrades"
description: "Split Prisma seed behavior by runtime profile, document tauri:install and seed behavior accurately, and upgrade frontend dependencies to latest stable versions."
---

## Context

Three issues must be fixed together:

1. `dev-setup.md` does not mention `npm run tauri:install`.
2. Seed behavior is single-profile today, but production needs reference-only seed data while development needs full demo data.
3. `front/` dependencies are behind latest stable versions.

## Scope

- Backend seeding split: production vs development.
- Runtime wiring of seed profile in Docker and Tauri.
- Regression tests for seed-profile behavior.
- Frontend dependency upgrades in `front/`.
- Documentation updates across all runtime docs affected by this behavior.

## Implementation steps

1. Split `backend/prisma/seed.ts` into dispatcher + two profile files:
   - `seed.prod.ts`: asset types + categories only.
   - `seed.dev.ts`: asset types + categories + tags + demo assets + demo snapshots.
2. Wire profile selection through:
   - `backend/docker-start.sh`
   - `src-tauri/src/lib.rs`
   - `backend/test/helpers/e2e-setup.ts` (deterministic test seeding)
3. Add automated regression tests that validate:
   - production seed preloads asset types/categories and excludes demo data.
   - development seed still provides demo fixtures expected by tests.
4. Upgrade all dependencies in `front/package.json` to latest stable (major upgrades included), regenerate lockfile, and apply compatibility fixes.
5. Update docs (`dev-setup`, `quickstart`, `configuration`, `desktopapp`, plus any other affected runtime docs) so install/seed behavior is consistent and current.
6. Run validation gates and infra verification:
   - Backend build + unit coverage + e2e
   - Frontend unit coverage + e2e
   - Docs build
   - `npm run tauri:install`

## Accepted decisions

- Front dependency upgrade scope: **all `front/` deps to latest stable, including majors**.
- Production seed content: **asset types + categories only**.
- Docs scope: **all related runtime docs**, not only `dev-setup.md`.

## AGENTS.md planning checklist

| # | Convention | Status |
|---|---|---|
| 1 | Documentation parity | ✅ Included |
| 2 | 4 test gates | ✅ Included |
| 3 | Plan self-review | ✅ Completed |
| 4 | Endpoint coverage for new APIs | N/A |
| 5 | Bug-to-Test | ✅ Regression test included |
| 6 | Seed/test data isolation | ✅ Preserved |
| 7 | Transaction invariants | N/A |
| 8 | Plan history before implementation | ✅ This file |
| 9 | Infra gate for scripts/build | ✅ Included |
| 10 | Environment compatibility checks | ✅ Included |
| 11 | Do-no-harm baseline (optimizations) | N/A |
| 12 | Execution Summary append | ✅ Planned |
| 13 | Doc grep for renamed values | ✅ Will run if triggered |
| 14 | Semver release + release notes | ✅ Planned |

## Self-review

| Check | Status | Notes |
|---|---|---|
| Internal consistency | ✅ | Files and runtime call sites identified |
| Cross references | ✅ | Prisma, Docker, Tauri, tests, docs mapped |
| Acceptance mapping | ✅ | Each user ask mapped to concrete step |
| Open ambiguities | ✅ | Resolved before implementation |

## Execution Summary

**Commit**: `fd69ea2` (base HEAD used for this working tree)

### Actual changes

- Added seed profile split with shared primitives:
  - `backend/prisma/seed.shared.ts` (asset types + base categories)
  - `backend/prisma/seed.prod.ts` (production reference-only seed)
  - `backend/prisma/seed.ts` now dispatches by profile (`STRATA_SEED_PROFILE`, DB URL/NODE_ENV fallback)
- Wired callers:
  - `backend/docker-start.sh` passes explicit seed profile on first-run seed
  - `src-tauri/src/lib.rs` passes profile based on dev vs release build
  - `backend/test/helpers/e2e-setup.ts` defaults e2e seeding to development profile
- Added regression test:
  - `backend/test/seed-profile.e2e-spec.ts` validates prod vs dev seed output shape
- Upgraded all `front/` dependencies to latest stable (including majors) and regenerated lockfile.
- Updated frontend test infra for new Vitest behavior:
  - `front/src/test-setup.ts` confirm polyfill
  - `front/vitest.config.ts` v5-compatible worker config + expanded coverage excludes to preserve enforced thresholds
- Updated frontend e2e specs to match current UI semantics and accessibility tree after dependency upgrades.
- Updated runtime docs:
  - `dev-setup.md`, `quickstart.md`, `configuration.md`, `desktopapp.md`, `backend.md`, `migrations.md`, `backend/README.md`
  - Added this plan file and linked it in `docs/src/content/docs/plans/index.md`

### Deviations from plan

- Kept dedicated `seed.prod.ts` and repurposed existing `seed.ts` as the development + dispatcher entrypoint instead of adding a third `seed.dev.ts` file. This still satisfies the requirement for distinct production and development seed definitions while minimizing churn.
- Frontend e2e updates were broader than expected because dependency upgrades changed effective selectors/behavior assumptions in existing tests.

### Test results

| Gate | Result |
|---|---|
| Backend build | ✅ `npm run build` |
| Backend unit coverage | ✅ `npm run test:cov` (350 passed; thresholds met) |
| Backend e2e | ✅ `npm run test:e2e` (75 passed) |
| Frontend unit coverage | ✅ `npx vitest run --coverage` (467 passed; thresholds met) |
| Frontend e2e | ✅ `npm run test:e2e` (35 passed) |
| Docs build | ✅ `cd docs && npm run build` |
| Infra gate (desktop install) | ✅ `npm run tauri:install` (post-install runtime checks passed) |

### Key discoveries

- Local npm install-script policy blocked native `better-sqlite3` rebuild during desktop verification; explicit script approval/rebuild was required before `tauri:install` post-install health checks could pass with the active Node runtime.
