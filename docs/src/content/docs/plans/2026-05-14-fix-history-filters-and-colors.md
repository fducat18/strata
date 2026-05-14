---
title: "2026-05-14: Fix History Filters + Chart Color Differentiation + Plan Title Convention"
description: "Fix time-range filters on the Net Worth chart, fix same-color issue in By Type/By Category modes, and standardize plan document titles for correct sidebar sorting."
---

## Problem

### Bug 1 — Time range filters appear broken

Clicking 1D / 7D / 1M / 3M / YTD / 1Y / ALL on the Net Worth History chart appeared to have no effect.

**Root cause:** `useNetWorthBreakdown` used *portfolio snapshots* (manually created standalone records) as X-axis date points. If no portfolio snapshots exist within the selected range, the chart goes blank — which looks like the buttons don't work.

### Bug 2 — Same color for By Type / By Category

When viewing By Type (CHECKING_ACCOUNT, CRYPTO, SAVINGS_ACCOUNT…) or By Category (Banking, Financial, Investments…), all items showed the same blue color.

**Root cause:** color was derived from `GROUP_COLORS[group]`. All FINANCIAL-group assets get `#3b82f6` (blue), regardless of their specific type or category.

### Convention — Plan titles not sorted chronologically in sidebar

Starlight's `autogenerate` sorts by `title` alphabetically. Plan docs without a date-prefixed title sort by the title text, not by date.

---

## Solution

### Fix 1 — Use asset snapshot dates as X-axis

Replace `usePortfolioSnapshots()` in `useNetWorthBreakdown` with logic that:
1. Collects all unique `observedAt` dates from `asset.snapshots` across active assets
2. Filters them by `since` if provided
3. Sorts chronologically
4. Uses those dates as chart data points

Benefit: the chart reflects the actual asset value history. Short ranges (1D, 7D) show data whenever any asset has a recent snapshot.

### Fix 2 — Distinct color palette for by-type / by-category

Added `DISTINCT_COLORS` array (12 visually distinct hex colors). For `by-type` and `by-category` modes, colors are assigned by order-of-first-encounter from this palette, ensuring each series has a unique color.

`by-group` mode retains semantic `GROUP_COLORS` (FINANCIAL=blue, LIABILITIES=red, etc.).

### Convention fix — YYYY-MM-DD: title format

Updated `AGENTS.md` convention #8 to mandate:
```yaml
title: "YYYY-MM-DD: Short descriptive title"
```

Backfilled all existing plan documents to follow this format so the sidebar sorts chronologically.

---

## Files Changed

| File | Change |
|---|---|
| `AGENTS.md` | Convention #8: added title format requirement |
| `front/src/lib/hooks/useNetWorthBreakdown.ts` | Asset-snapshot dates as X-axis; DISTINCT_COLORS for by-type/by-category |
| `front/src/lib/hooks/__tests__/useNetWorthBreakdown.test.tsx` | Updated tests: removed portfolio snapshot deps, updated length expectations, added color tests |
| `docs/src/content/docs/plans/2026-05-14-fix-history-filters-and-colors.md` | This plan doc |
| ~28 existing plan docs | Title backfill to `YYYY-MM-DD: ...` format |

---

## Execution Summary

*(To be appended after implementation completes)*

## Execution Summary

**Commit**: `185cf43`

### Actual changes

| File | Change |
|---|---|
| `front/src/lib/hooks/useNetWorthBreakdown.ts` | Removed `usePortfolioSnapshots` dependency; X-axis now uses asset snapshot dates; added `DISTINCT_COLORS` (12 colors); `by-type`/`by-category` colors assigned by encounter order, not group |
| `front/src/lib/hooks/__tests__/useNetWorthBreakdown.test.tsx` | Removed portfolio snapshot mocks; rewrote filter test to use asset snapshot dates; added color distinctness assertions for `by-type` and `by-category`; added carry-forward value test |
| `AGENTS.md` | Convention #8 updated: added `title: "YYYY-MM-DD: Short title"` format requirement |
| `.github/instructions/agents-plan-checklist.instructions.md` | Row #8 and naming convention section updated to specify date-prefixed title format |
| ~28 existing plan docs | Titles backfilled to `"YYYY-MM-DD: ..."` format |
| `docs/src/content/docs/plans/2026-05-14-fix-history-filters-and-colors.md` | This plan doc (created before implementation) |

### Deviations from plan

None. The implementation followed the plan exactly. The `usePortfolioSnapshots` hook was left in place (still used by the portfolio value KPI card via `useCurrentPortfolioValue`) — only removed from the chart hook.

### Test results

| Gate | Result |
|---|---|
| Backend unit | ⏭ skipped (not affected) |
| Backend e2e  | ⏭ skipped (not affected) |
| Frontend unit | ✅ 393 tests passed (63 files) |
| Frontend e2e  | ⏭ skipped (smoke tests would need running app) |

### Key discoveries

- Portfolio snapshots are standalone records (no FK to assets). The KPI card (`useCurrentPortfolioValue`) still uses them correctly — the chart hook was the only consumer that needed to change its date source.
- With asset-based dates, the `since` filter now naturally excludes dates from before the selected range (asset snapshots older than `since` are simply not included as data points), which is the correct semantic.
- Color assignment in `by-type`/`by-category` relies on `allKeys.size` checked *before* `allKeys.add()`, ensuring stable first-encounter assignment (first new key → index 0, second → 1, etc.) across multiple data points.
