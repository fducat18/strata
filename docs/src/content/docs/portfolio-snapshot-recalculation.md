---
title: "Portfolio Snapshot Recalculation"
description: Technical details on how Strata automatically recalculates portfolio snapshots.
---

Every time an AssetSnapshot is created, updated, or deleted, Strata automatically recalculates portfolio snapshots. There is **no manual "Take Snapshot" button**.

## How it works

1. `AssetSnapshotService.create/update/delete` → synchronously calls `portfolioSnapshotService.recalculateFromDate(date)`
2. `recalculateFromDate(fromDate)` upserts a PortfolioSnapshot for `fromDate` and updates all existing PortfolioSnapshots with `observedAt > fromDate`

## Formula

For each date **D**, the portfolio total is:

```
totalValue(D) = SUM( latest AssetSnapshot.value per non-disposed asset where observedAt ≤ D )
```

## Why synchronous?

Strata runs on a personal laptop — not a server that stays running 24/7. A cron job or background worker would be unreliable. Synchronous recalculation is simple, testable, and always correct.

## Cascade example

You add an AssetSnapshot for Jan 1st. Strata recalculates the portfolio total for Jan 1st *and* all later dates that already have a PortfolioSnapshot (Feb 1st, Mar 1st…). Historical net worth is always consistent with your asset history.
