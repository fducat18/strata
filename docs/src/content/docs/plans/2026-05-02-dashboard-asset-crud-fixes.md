---
title: "Dashboard & Asset CRUD Fixes — May 2026"
description: "Fixes Y-axis zeros on net worth chart, category/tag/acquisitionDate not saved on asset edit, and dashboard UI improvements (stats cards, allocation chart, time range filters)."
---

## Context

Beta testing revealed 4 backend/frontend mismatches and 2 UI gaps. This plan covers the second round of fixes following the May 2026 initial release.

## Design Decisions

- **One chart, two filter bars**: the "Net Worth" (previously "Total") mode already shows assets as positive areas and liabilities as negative areas when Y-axis is fixed. No second dedicated chart needed. Added time-range filters (`1D | 7D | 1M | 3M | YTD | 1Y | ALL`) to the existing chart.
- **Dashboard stat cards**: replaced the 3 generic cards with `Net Worth + Total Assets + Total Liabilities` for clearer financial context.
- **Allocation chart — assets only**: liabilities are not asset allocations. LIABILITIES group is excluded from the allocation pie chart.
- **`acquisitionDate` in API response**: exposed as a computed field (derived from the ACQUIRE transaction) rather than exposing the full transactions array.

## Bugs Fixed

| # | Bug | Root Cause | Fix |
|---|-----|-----------|-----|
| BUG-1 | Y-axis shows only €0 on Net Worth chart | `stackOffset="sign"` on AreaChart corrupts Y domain for non-stacked areas | Conditional `stackOffset` + `domain={['auto','auto']}` on YAxis |
| BUG-2 | Category/tag not saved on edit or after create | `PUT /assets/:id` controller passed only `name/quantity/assetTypeId` to service, omitting `categoryIds`, `tagIds`, `acquisitionDate` | Controller updated to pass all DTO fields |
| BUG-3 | Acquisition date empty in edit dialog | `AssetResponseDto` had no `acquisitionDate` field | Added computed `acquisitionDate` from ACQUIRE transaction to response |
| BUG-4 | Allocation chart included loan/liability assets | `allocationByType` built from all assets | Filter LIABILITIES group from allocation data |

## Improvements

| # | What |
|---|------|
| IMP-1 | Net Worth History: time range filter (1D/7D/1M/3M/YTD/1Y/ALL) |
| IMP-2 | Dashboard: Net Worth + Total Assets + Total Liabilities stat cards |
| CON-1 | AGENTS.md Convention #9 added: Full-Stack Coverage Rule |
