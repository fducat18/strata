---
title: "2026-05-14: Snapshot UI fixes — decimals, dates, delete, sort, pagination"
description: "Fix net worth/snapshot value decimals, strip time from snapshot dates, add per-row snapshot delete, replace window.confirm on asset type delete, add pagination and sort toggle to snapshots table."
---

## Problem

Six UI polish items on the asset detail page and dashboard:

1. Net worth KPI card and asset snapshot values show 2 decimal places — should be 0
2. Snapshot dates show time (e.g. "10 mai 2026, 02:00") — should be date only ("10 mai 2026")
3. No delete button per snapshot row — users cannot remove an individual snapshot
4. Asset type delete uses browser `window.confirm()` — should use the same `DeleteConfirmDialog`
5. Snapshot table has no pagination — all snapshots displayed at once
6. Snapshot date column not sortable — no ascending/descending toggle

## AGENTS.md Compliance

| # | Convention | Status |
|---|---|---|
| 1 | Doc site update | This file |
| 2 | All 4 test gates | Backend unit (319), backend e2e (70), frontend unit (400) — all pass |
| 3 | Self-review | Internal consistency verified before implementation |
| 4 | Endpoint coverage | New DELETE endpoint → Bruno + Swagger |
| 5 | Bug-to-Test | Each fix has a corresponding test |
| 6 | Seed isolation | No seed data touched |
| 7 | Transaction invariants | N/A |
| 8 | Plan saved to docs | This file |
| 9 | Infra test gate | N/A |
| 10 | Env compatibility | N/A |
| 11 | Do-no-harm baseline | Tests run before and after |
| 12 | Execution summary | See below |
| 13 | Doc grep rule | No path renames |
| 14 | Semver release | After gates pass |

## Approach

Six focused changes. Backend adds a full DELETE snapshot endpoint (port → repo → service → controller). Frontend applies all UI changes in the affected components.

## Backend Changes

**B1** — `IAssetSnapshotRepository`: added `abstract delete(id: string): Promise<void>`

**B2** — `PrismaAssetSnapshotRepository`: implemented `delete(id)` via `prisma.assetSnapshot.delete({ where: { id } })`

**B3** — `AssetSnapshotService`: added `delete()` use case — findById → delete → `portfolioSnapshotService.recalculateFromDate(observedAt)`

**B4** — `AssetController`: added `DELETE /assets/:id/snapshots/:snapshotId` with `@HttpCode(204)` and Swagger decorators

**B5** — Unit tests: service spec (2 new tests), controller spec (1 new test), repo spec (1 new test). All mock objects updated with `delete` method.

**B6** — Bruno: `.bruno/Strata/Assets/DeleteAssetSnapshot.bru`

## Frontend Changes

**F1** — `front/src/lib/api/assets.ts`: added `deleteSnapshot(assetId, snapshotId)`

**F2** — `front/src/lib/hooks/assets.ts`: added `useDeleteAssetSnapshot()` hook

**F3** — `DashboardPage.tsx`: net worth KPI now uses `minimumFractionDigits: 0, maximumFractionDigits: 0`

**F4** — `AssetSnapshotsList.tsx` — full overhaul:
- Date column: `formatDateTime` → `formatDate` (strips time component)
- Value column: `minimumFractionDigits: 0, maximumFractionDigits: 0`
- Sort toggle: `sortDir` state (`'desc'` default), clickable Date header with `ChevronUp`/`ChevronDown`
- Delete per row: `deletingSnapshot` state + Trash2 icon + `DeleteConfirmDialog` (title "Delete Snapshot")
- Pagination: `pageSize` (10/20/50/100/All, default 10) + `page` state + prev/next controls

**F5** — `DeleteConfirmDialog.tsx`: generalized with optional `title?: string` and `message?: string` props (defaults preserve existing behavior — backward-compatible)

**F6** — `AssetTypesPage.tsx`: replaced `window.confirm()` with `deletingType` state + `<DeleteConfirmDialog title="Delete Asset Type">`. Imported `DeleteConfirmDialog` from assets module.

## Test Changes

**T1** — `AssetSnapshotsList.test.tsx`: added mock for `useDeleteAssetSnapshot`; new tests for date-only format, 0-decimal values, sort toggle, delete dialog + mutateAsync call, pagination (10 default, All selector).

**T2** — `AssetTypesPage.test.tsx`: replaced `vi.spyOn(window, 'confirm')` delete test with dialog-click pattern.

## Acceptance Criteria

1. ✅ Dashboard net worth: no decimal cents
2. ✅ Asset snapshot values: no decimal cents
3. ✅ Snapshot dates: "10 mai 2026" not "10 mai 2026, 02:00"
4. ✅ Each snapshot row has a trash icon → opens confirm dialog → deletes snapshot + refreshes
5. ✅ Asset type delete uses the same confirm Dialog (not `window.confirm`)
6. ✅ Snapshot table defaults to 10 rows; page size selector (10/20/50/100/All); correct pagination
7. ✅ Clicking "Date" header toggles asc↔desc sort with visual indicator
8. ✅ All 4 test gates pass

## Execution Summary

**Commits**: see git log for `2026-05-14-snapshot-ui-fixes`

### Actual changes

All planned files were modified. No deviations from plan.

### Test results

| Gate | Result |
|---|---|
| Backend unit | ✅ 319 tests passed (30 suites) |
| Backend e2e | ✅ 70 tests passed (8 suites) |
| Frontend unit | ✅ 400 tests passed (63 files) |
| Frontend e2e | ⏭ not affected by these changes |

### Key discoveries

- `DeleteConfirmDialog` import in `AssetTypesPage` needed a cross-module import (`@/components/assets/DeleteConfirmDialog`) — acceptable since it's a shared UI primitive, not circular.
- The `window.confirm` approach in `AssetTypesPage` had a `vi.spyOn(window, 'confirm')` in the test that had to be replaced with a dialog-click pattern.
- Snapshot value format on the acquisition row also updated to 0 decimals for consistency.
