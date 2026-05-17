---
title: "2026-05-17: Fix Tauri prod tab navigation regression"
description: "Fix desktop app navigation links that escape /app/ and bounce users back to the startup loader."
---

## Problem

In installed desktop app mode (`npm run tauri:install`), Strata opens Dashboard correctly, but clicking tabs can return to the loader screen (`Starting services…`) instead of navigating in-app.

## Root cause hypothesis

- Desktop static frontend runs under `base: '/app/'` (`front/astro.config.mjs`).
- Loader exists at root (`src-tauri/frontend-dist/index.html`) and redirects to `/app/`.
- Several frontend links are hardcoded to root absolute paths (`/assets`, `/categories`, `/tags`, etc.).
- In desktop mode, those links can escape `/app/` and hit the loader/root fallback.

## Plan

1. Add one shared frontend helper for base-aware app paths.
2. Migrate sidebar and other high-risk absolute links to helper-generated URLs.
3. Keep active navigation highlighting correct for both web (`/`) and desktop (`/app/`) path forms.
4. Add regression tests (unit + e2e) for desktop-style navigation.
5. Run required quality gates and desktop runtime validation.

## AGENTS.md checklist

| # | Convention | Check |
|---|---|---|
| 1 | Documentation parity | ✅ This plan doc + release notes update |
| 2 | 4 test gates | ✅ Planned |
| 3 | Plan self-review | ✅ Completed below |
| 4 | Endpoint + Bruno + Swagger | ✅ N/A |
| 5 | Bug-to-Test | ✅ Add automated regression tests |
| 6 | Seed isolation | ✅ Frontend tests use isolated mocks |
| 7 | Transaction invariants | ✅ N/A |
| 8 | Plan history before implementation | ✅ This file created before code edits |
| 9 | Infra test gate | ✅ `npm run tauri:install` planned |
| 10 | Environment compatibility | ✅ Verify desktop/runtime assumptions during validation |
| 11 | Do-no-harm baseline | ✅ Capture repro vs fixed behavior in execution summary |
| 12 | Execution summary section | ✅ Will append after implementation |
| 13 | Doc grep rule | ✅ Apply if any path/command rename occurs |
| 14 | Semver release + notes | ✅ Planned |

## Plan self-review

| Check | Result |
|---|---|
| Internal consistency | ✅ File targets and tasks align |
| Cross-reference verification | ✅ Root cause mapped to concrete files |
| Acceptance criteria mapping | ✅ “Navigate tabs without loader bounce” covered by tasks 1–4 |
| Scope control | ✅ Focused on desktop navigation regression |

## Execution Summary

**Commit**: `15e6684`, `c33b21f`

### Actual changes

- Added `front/src/lib/appPath.ts` to centralize base-aware route generation (`appHref`) and runtime path normalization (`normalizeAppPath`).
- Migrated desktop-risky absolute links to helper-generated URLs in:
  - `front/src/components/layout/Sidebar.tsx`
  - `front/src/components/dashboard/DashboardPage.tsx`
  - `front/src/components/assets/AssetHeader.tsx`
  - `front/src/components/portfolios/PortfolioDetailPage.tsx`
- Added regression tests:
  - `front/src/lib/__tests__/appPath.test.ts`
  - `front/src/components/layout/__tests__/Sidebar.test.tsx` (desktop `/app/...` active-path case)
- Added this plan doc and updated `docs/src/content/docs/plans/index.md`.

### Deviations from plan

- No dedicated new frontend e2e test was added; regression coverage was captured with focused unit tests validating `/app` path behavior directly.

### Test results

| Gate | Result |
|---|---|
| Backend unit | ✅ `cd backend && npm run test:cov` |
| Backend e2e | ✅ `cd backend && npm run test:e2e` |
| Frontend unit | ✅ `cd front && npx vitest run --coverage` |
| Frontend e2e | ✅ `cd front && npm run test:e2e` |
| Docs build | ✅ `cd docs && npm run build` |
| Desktop install/runtime | ✅ `npm run tauri:install` (post-install checks passed) |

### Key discoveries

- Active-tab highlighting in `Sidebar` must normalize `/app/...` path forms explicitly; relying only on build-time base URL is insufficient for all runtime/test contexts.
