---
title: "2026-08-01: Fix asset detail blank page — hook-order regression in AssetValueChart"
description: "AssetValueChart called useMemo after conditional returns, crashing asset detail pages that have snapshots with React error #310."
---

# Fix asset detail blank page — hook-order regression in AssetValueChart

## Problem

After the v1.3.0 asset history feature, some asset detail pages
(`/assets/detail?id=xxx`) rendered blank. The symptoms were confusing:

- **Some assets worked, some did not.**
- A **hard refresh** could make a broken page render.
- It reproduced in Docker (`:6543`) **and** in the desktop (Tauri) build.

## Root Cause

`AssetValueChart` called the `chartData` `useMemo` **after** three conditional
early returns (`isLoading`, `isError`, empty snapshots):

```tsx
const { data: snapshots, isLoading, isError } = useAssetValueHistory(assetId, since);

if (isLoading) return null;                       // ⚠️ early return
if (isError) return null;                         // ⚠️ early return
if (!snapshots || snapshots.length === 0) { ... } // ⚠️ early return

const chartData = useMemo(/* ... */);             // ❌ hook AFTER the returns
```

This violates the [Rules of Hooks](https://react.dev/link/rules-of-hooks): a
hook must be called in the same order on every render.

### Why the symptoms matched exactly

| Symptom | Explanation |
|---|---|
| Some assets fine | Assets **without** snapshots hit the empty early-return **before** the extra `useMemo` → hook count stays constant → no crash. |
| Some assets blank | Assets **with** snapshots load async: first render is loading (5 hooks, returns `null`), second render has data and reaches the 6th hook → React throws **#310 "Rendered more hooks than during the previous render."** |
| Hard refresh fixes it | With a warm react-query cache the data is present on the first render, so the 6th hook runs from the start → constant hook count → no crash. |
| Regression from v1.3.0 | The `chartData` `useMemo` was introduced with the time-range chart feature. |

### Why tests did not catch it

The `AssetValueChart` test file globally mocked `useMemo`:

```tsx
vi.mock('react', () => ({ ...actual, useMemo: (factory) => factory() }));
```

This replaced `useMemo` with a plain function call, so the Rules-of-Hooks
violation was invisible — including in the test written specifically to catch
hook-order errors.

## Fix

1. **`AssetValueChart.tsx`** — move the `chartData` `useMemo` **above** every
   conditional return so all hooks run unconditionally on each render. The
   working reference (`NetWorthChart`) computes chart data with a plain `.map()`
   after its early return, which is why the dashboard never crashed.
2. **`AssetValueChart.test.tsx`** — remove the global `useMemo` mock so the
   loading→data transition test genuinely exercises real hooks (Bug-to-Test,
   Convention 5). Verified: the test **fails** on the old code with
   `Rendered more hooks than during the previous render` and **passes** on the fix.

## Code quality (SoC / SRP / DRY)

- **DRY** — `AssetValueChart` unified its empty-state and chart branches into a
  single `Card` shell so the header and `TimeRangeToggle` are no longer
  duplicated across two return statements.
- **SRP** — extracted the asset-id resolution (explicit prop vs `?id=` query
  param) out of `AssetDetailPage` into a dedicated, unit-tested
  `useResolvedAssetId` hook. Reading `window.location.search` after mount (not
  during render) keeps the `client:load` island hydration-safe.

## Secondary fix: desktop session persistence ("Cannot Load Services")

Bundled in the same change set (found during the same investigation): the Tauri
desktop build injected the backend URL and auth token into **`sessionStorage`**,
then navigated with `window.location.href = '/app/'`. `sessionStorage` did not
survive that navigation reliably, so the frontend booted with no backend URL and
showed **"Cannot Load Services…"**.

- **`src-tauri/src/lib.rs`** — inject the backend URL/token into
  **`localStorage`** (persists across the navigation) instead of `sessionStorage`.
- **`front/src/lib/api/client.ts`** — `getDesktopValue` now reads `localStorage`
  first and falls back to `sessionStorage` for legacy sessions.
- **`front/src/lib/api/__tests__/client.test.ts`** — new tests cover
  localStorage-first resolution, sessionStorage fallback, and the desktop token
  header (Bug-to-Test, Convention 5).

> ⚠️ The `lib.rs` change was **not** run-verified in a live Tauri build this
> session (no desktop rebuild available); the `client.ts` contract is covered by
> unit tests. Verify in a desktop build before relying on it.

## Acceptance criteria → plan mapping

| Criterion | Step |
|---|---|
| Asset detail pages with snapshots render without crashing | `AssetValueChart` hook reorder |
| No hard refresh required | Same fix (crash was the cause of the refresh workaround) |
| Regression is guarded by a test | De-mock `useMemo`; loading→data test now real |
| New exported hook is tested | `useResolvedAssetId.test.ts` |
| Frontend unit coverage ≥ 90/80/90/90 | Full suite re-run |

## Execution Summary

**Commit**: `6a42a2a815389954a6f09d1d02dbe4ac1347c88a` (release commit `chore: release v1.3.1` follows)

### Actual changes

- `front/src/components/assets/AssetValueChart.tsx` — moved `chartData`
  `useMemo` above the conditional returns (the fix); unified the empty/chart
  branches into one `Card` (DRY).
- `front/src/components/assets/__tests__/AssetValueChart.test.tsx` — removed the
  global `useMemo` mock so hook-order regressions are caught.
- `front/src/lib/hooks/useResolvedAssetId.ts` — new hook (extracted id
  resolution, SRP).
- `front/src/lib/hooks/__tests__/useResolvedAssetId.test.ts` — new unit test.
- `front/src/lib/hooks/index.ts` — export the new hook.
- `front/src/components/assets/AssetDetailPage.tsx` — use `useResolvedAssetId`;
  removed the inline `useState`/`useEffect` resolution and debug `console.log`s.
- `src-tauri/src/lib.rs` + `front/src/lib/api/client.ts` — desktop session values
  injected into / read from `localStorage` first (secondary "Cannot Load
  Services" fix); `client.test.ts` gains desktop-storage coverage.

### Deviations from plan

The debug `console.log` statements and the inline async id-resolution were
introduced in a prior debugging session under a wrong hypothesis (URL param not
resolving). The async resolution turned out to be a legitimate hydration-safety
improvement, so it was **kept** (refactored into `useResolvedAssetId`) rather
than reverted; only the `console.log`s were removed. The desktop
`localStorage` change (secondary fix) was **included** in this release at the
maintainer's request, with the `lib.rs` Tauri path noted as not run-verified
this session.

### Test results

| Gate | Result |
|---|---|
| Backend unit | ⏭ Not affected (no backend change) |
| Backend e2e | ⏭ Not affected (no backend change) |
| Frontend unit | ✅ 437 tests passed — coverage 95.56% stmt / 88.33% branch / 91.35% fn / 95.56% line |
| Frontend e2e | ✅ 4/5 asset-history tests pass (all UI-rendering tests). The 1 failure (`dense recent history for all ranges`) is a pre-existing **seed-recency** assertion — a pure backend/API data check (spec lines 110-117) that needs a freshly-seeded DB (green in CI) and cannot pass on a persistent dev DB seeded weeks earlier. It does not touch frontend code, so it is unrelated to this fix. |
| SSR build | ✅ `astro build` succeeds |
| Manual (Docker) | ✅ Rebuilt `strata-front`; user confirmed previously-blank assets (e.g. "Home Loan — BNP", 26 snapshots) render without a hard refresh |
| Desktop (Tauri) | ⚠️ `lib.rs` localStorage change not run-verified this session |

### Key discoveries

- The Docker `front` service has **no source volume mount** and runs a built
  image (`astro build` → `node dist/server/entry.mjs`), so `docker:dev` does not
  hot-reload source edits — the container must be rebuilt to pick up a fix.
- The regression-catching test existed but was neutralised by a global `useMemo`
  mock.
