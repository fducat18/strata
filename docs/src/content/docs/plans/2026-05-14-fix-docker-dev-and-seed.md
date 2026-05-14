---
title: "2026-05-14: Fix docker:dev stale images and seed historical snapshots"
description: "Make docker:dev always regenerate version and rebuild images (layer-cached), and add 15 monthly relative-date asset snapshots to dev seed for realistic date filter testing."
---

## Problems

### Issue 1 — docker:dev shows wrong version, stale code

`docker:dev` runs `docker-compose up` with **no rebuild and no gen-version call**.
If images were built previously by `docker:prod` (or any build without `STRATA_ENV=development`),
the version baked into the frontend bundle is the clean tag → shows as `v1.1.0` (production label),
not `v1.1.0-2-g185cf43 — DEV`. Any code change committed since the last `docker:reset` is also invisible.

**Root cause**: `docker:dev` intentionally skipped rebuild for speed (~10s startup). This worked
when the user always ran `docker:reset` after code changes, but created confusion when images were stale.

**Fix**: Add `STRATA_ENV=development node scripts/gen-version.mjs all` + layer-cached build to `docker:dev`.
New distinction:

| Command | Gen version | Build | DB |
|---|---|---|---|
| `docker:dev` | ✅ DEV | ✅ layer-cached | Preserved |
| `docker:reset` | ✅ DEV | ✅ layer-cached | Wiped |
| `docker:nuke` | ✅ DEV | ✅ no-cache | Wiped |

### Issue 2 — Colors still blue in docker:dev

Same root cause as Issue 1: old Docker image (built before `useNetWorthBreakdown` color fix).
Fixed by fixing Issue 1 (rebuild picks up new code).

### Issue 3 — Seed only has one snapshot per asset

After the `useNetWorthBreakdown` hook was changed to use asset snapshot dates as the X-axis,
short time filters (1D, 7D, 1M, 3M) showed empty chart — because the seed only creates
**one snapshot at a hardcoded past date** (`2025-01-15`), far outside the short ranges.

**Fix**: Generate **15 monthly relative-date snapshots** per demo asset using `new Date()` at
seed runtime (14 months ago → today). Values evolve realistically.

---

## Implementation

### `package.json` — docker:dev

```diff
- "docker:dev": "DB_FILE=strata-dev.db node scripts/check-ports.mjs && DB_FILE=strata-dev.db docker-compose up",
+ "docker:dev": "DB_FILE=strata-dev.db node scripts/check-ports.mjs && STRATA_ENV=development node scripts/gen-version.mjs all && DB_FILE=strata-dev.db docker-compose build --parallel && DB_FILE=strata-dev.db docker-compose up",
```

### `backend/prisma/seed.ts` — snapshot history

15 monthly snapshots per asset (index 0 = 14 months ago, index 14 = today):

| Asset | Monthly delta | Value at 14mo ago | Value today |
|---|---|---|---|
| BNP Checking | +30 | ~3830 | ~4250 |
| Livret A | +75 | ~21900 | ~22950 |
| Apartment Paris | +1200 | ~368200 | ~385000 |
| Home Loan | -429 | ~186000 | ~180000 |
| Toyota Yaris | -100 | ~6400 | ~5000 |
| Renault Kangoo | -40 | ~2560 | ~2000 |

Dates computed at runtime → all time filters always have data.

### Docs updated

- `docs/src/content/docs/plans/2026-05-05-docker-startup-optimization.md` — section 6 rewritten
- `docs/src/content/docs/adr/adr-003-database-strategy.md` — docker:dev row updated

---

## Acceptance Criteria

1. `npm run docker:dev` generates version + rebuilds (layer-cached) before starting
2. Version shows DEV label after `docker:dev`
3. Colors show distinct per type/category (previous fix now visible)
4. Seed creates 15 monthly snapshots per demo asset
5. All 6 time filters (1D/7D/1M/3M/YTD/1Y) show data in dev stack
6. Backend unit + e2e tests pass
