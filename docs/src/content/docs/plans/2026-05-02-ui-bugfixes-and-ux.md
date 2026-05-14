---
title: "2026-05-02: UI Bug Fixes title: "UI Bug Fixes & UX Improvements — May 2026" UX Improvements"
description: "Fixes blank page bug (QueryClient context), loan net worth inflation, missing snapshot duplicate guard, missing edit UI, chart improvements, and new snapshot editing feature."
---

## Context

Beta testing revealed 4 bugs and 6 UX improvements. This plan tracks all of them.

## Design Decisions

- **Loans in net worth**: Loans (LIABILITIES group) MUST reduce net worth. `Net Worth = Σ(assets) − Σ(liabilities)`. Backend subtracts LIABILITIES values from the computed sum.
- **Chart**: All modes use `AreaChart` + `Area` with dots. Total: single area. by-group/by-type/by-category: stacked area chart (`stackId="1"`).
- **Category + tag at creation**: Frontend-only two-step: create asset, then PUT with selected IDs if any.
- **Snapshot duplicates**: One snapshot per asset per day. Second creation for same day → 409 Conflict.

## Bugs Fixed

| # | Bug | Fix |
|---|---|---|
| BUG-1 | All pages blank (asset-types confirmed) | Wrap all 7 page components with `QueryProvider` |
| BUG-2 | Net worth inflated — loans added not subtracted | Backend: new group-aware repo methods + service subtraction |
| BUG-3 | No duplicate-snapshot validation | 409 check in `AssetSnapshotService.create()` |
| BUG-4 | No edit icon on asset list rows | Pencil + `AssetEditDialog` per row |

## Improvements Delivered

| # | What |
|---|---|
| IMP-1 | Net Worth History → AreaChart (stacked area for grouped modes, single area for total) |
| IMP-2 | Dashboard Asset Types card → clickable link to `/asset-types` |
| IMP-3 | Asset list EUR values → 0 decimal places |
| IMP-4 | New asset form → category + tag selectors |
| IMP-5 | Snapshot editing: PUT endpoint + frontend dialog |
| IMP-6 | Favicon PNGs updated to match custom SVG |
