---
title: "2026-10-02: Clean dev e2e residue and extend demo snapshots"
description: "Add one-shot cleanup for leaked e2e dev data and extend dev demo asset snapshot history to 10 years with deterministic points."
---

## Context

Running `docker:dev` against an existing `strata-dev.db` can show residual e2e data (`Test Asset ...`, `E2E Category ...`, `test-tag-...`, `e2e-tag-...`) from previous runs.  
Also, demo asset snapshot history is currently too short for long-horizon visual testing.

## Scope

- Add a manual cleanup command for existing dev DB e2e residue.
- Prevent future e2e residue from asset CRUD test flow.
- Extend dev demo seed snapshots to 10 years at 3 points/year.
- Backfill existing demo assets in dev DB so reset is not mandatory.
- Update related docs.

## Decisions

- Cleanup is **manual one-shot command** (not automatic on each `docker:dev`).
- Backfill applies to **existing demo assets** in dev profile.
- Snapshot generation stays **simple and deterministic**, optimized for visual history points.

## Planned changes

1. Add cleanup script (dev DB only) for known test-name patterns:
   - categories: `E2E Category *`, `Test Category *`
   - tags: `e2e-tag-*`, `test-tag-*`
   - assets: `Test Asset *`
2. Add npm script entrypoint for this cleanup.
3. Update frontend e2e asset CRUD flow to clean created test asset.
4. Replace current short snapshot seed with 10-year deterministic history (3 points/year):
   - non-loan assets: mixed positive/negative variation
   - loan asset: strictly declining
5. Backfill snapshot history for already-existing demo assets in dev seed run.
6. Update docs with cleanup command and new snapshot behavior.
7. Run all required gates; if green, commit and push to upstream `main`.

## AGENTS.md planning checklist

| # | Convention | Status |
|---|---|---|
| 1 | Documentation parity | ✅ Included |
| 2 | 4 test gates | ✅ Included |
| 3 | Self-review before execution | ✅ Completed |
| 4 | New endpoint coverage | N/A |
| 5 | Bug-to-Test | ✅ e2e leak prevention included |
| 6 | Seed/test data isolation | ✅ Addressed |
| 7 | Transaction invariants | N/A |
| 8 | Plan history before implementation | ✅ This file |
| 9 | Infra gate for script/build changes | ✅ Included |
| 10 | Environment compatibility checks | ✅ Included |
| 11 | Do-no-harm baseline | N/A |
| 12 | Execution Summary append | ✅ Planned |
| 13 | Doc grep for renamed values | ✅ If triggered |
| 14 | Semver + release notes | ✅ Planned before closeout |

## Execution Summary

**Commit**: `7122762`

### Actual changes

- Added manual dev cleanup script `backend/prisma/cleanup-dev-test-data.ts` with a safety guard (`strata-dev.db` only unless explicitly overridden), plus npm entrypoints:
  - `backend/package.json` → `cleanup:test-data`
  - root `package.json` → `devdb:clean-e2e`
- Updated dev seed logic in `backend/prisma/seed.ts`:
  - demo assets are now seeded **or backfilled** (no longer skipped when existing)
  - snapshot history replaced with deterministic 10-year cadence at 3 points/year
  - non-loan assets use mixed up/down variation; loan history is strictly declining
  - previous non-canonical seeded points for demo assets are removed during backfill
- Hardened frontend e2e cleanup in `front/e2e/asset-crud.spec.ts` by tracking created `Test Asset ...` names and deleting them in `afterEach` through API calls.
- Updated related docs:
  - `docs/src/content/docs/dev-setup.md`
  - `docs/src/content/docs/quickstart.md`
  - `docs/src/content/docs/configuration.md`
  - `docs/src/content/docs/backend.md`
  - `backend/README.md`

### Deviations from plan

- Updated `backend/test/app.e2e-spec.ts` to assert auto-computed portfolio snapshot value against live `current-value` API output instead of a hardcoded seed-specific constant. This keeps the e2e stable while seed history evolves.

### Test results

| Gate | Result |
|---|---|
| Backend build | ✅ `cd backend && npm run build` |
| Backend unit (coverage) | ✅ `cd backend && npm run test:cov` |
| Backend e2e | ✅ `cd backend && npm run test:e2e` |
| Frontend unit (coverage) | ✅ `cd front && npx vitest run --coverage` |
| Frontend e2e | ✅ `cd front && npm run test:e2e` |
| Docs build | ✅ `cd docs && npm run build` |
| Manual cleanup command | ✅ `npm run devdb:clean-e2e` |
| Demo-history backfill run | ✅ `cd backend && STRATA_SEED_PROFILE=development npx prisma db seed` |

### Key discoveries

- `npm run devdb:clean-e2e` initially failed due an invalid Prisma filter shape (`startsWith` used at wrong level). Fix was to target `name: { startsWith: ... }`.
- Extending demo history changed expected auto-computed portfolio value in existing e2e assumptions; test needed to validate behavior against current API output instead of static legacy value.
