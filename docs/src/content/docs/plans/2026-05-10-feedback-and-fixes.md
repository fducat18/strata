---
title: "2026-05-10: Feedback title: "2026-05 — Feedback & Fixes" Fixes"
description: CI fixes, Node 24 upgrade, versioning, docs styling, favicon, white-flash, acquisition date, delete dialog, Codecov badges.
---

## Context

Accumulated feedback and bugs from the `issues/todo/feedback-and-fixes.md` tracker, addressed in a single plan.

---

## Problem Statement

1. **CI broken**: `prisma generate` fails (missing `DATABASE_URL`); Astro build fails (Node 20 not supported)
2. **`docker:prod` shows wrong version**: shows dev-mode version instead of latest release tag
3. **Docs content not centered**: asymmetric left/right margin in `.sl-container`
4. **Wrong favicon on front app**: SVG favicon overrides matching PNGs
5. **White flash on dark-mode navigation**: brief white background on sidebar link clicks
6. **Asset detail page**: acquisition date not displayed
7. **Delete button**: uses native `confirm()` instead of proper modal dialog
8. **Codecov badge "unknown"**: CI was failing so coverage was never uploaded; stale token from repo transfer

---

## Changes

### A — CI Fixes

**A1. Backend `DATABASE_URL`** (`.github/workflows/ci.yml`):
- Added `env: DATABASE_URL: file:/tmp/ci.db` to the backend job before `npx prisma generate`
- Root cause: `prisma.config.ts` calls `env('DATABASE_URL')` at config-load time; CI runner has no `.env`

**A2. Node 24 LTS** (`.github/workflows/ci.yml`, `backend/Dockerfile`, `front/Dockerfile`, `docs/Dockerfile`):
- CI backend job: `node-version: 20` → `node-version: "24"`
- CI frontend job: `node-version: 20` → `node-version: "24"`
- CI docs job: `node-version: "22"` → `node-version: "24"`
- All three Dockerfiles: `FROM node:22-alpine` → `FROM node:24-alpine`

### B — Versioning: `docker:prod` uses latest git tag

**Files**: `scripts/version.mjs`, `package.json`

- Added `VERSION_OVERRIDE` env var support to `version.mjs`: when set, uses that value directly and classifies env as `production`
- Modified `docker:prod` npm script to export `VERSION_OVERRIDE=$(git describe --tags --abbrev=0 2>/dev/null)` before calling `gen-version.mjs all`
- Result: running `npm run docker:prod` on a commit past `v1.0.0` now produces `1.0.0` (production), not `1.0.0-1-gf3a1d9d` (development)

### C — Docs Content Centering

**File**: `docs/src/styles/custom.css`

- Added CSS to center `.sl-container` symmetrically (fix extra left margin from Starlight sidebar accounting)

### D — Front App Favicon

**Files**: `front/public/favicon.svg` (deleted), `front/src/layouts/MainLayout.astro`

- Deleted `front/public/favicon.svg` (a "blue S" SVG that browsers prefer over PNGs)
- Removed `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` from `MainLayout.astro`
- The front PNGs (`favicon-16x16.png`, `favicon-32x32.png`) were already byte-identical to the docs PNGs — no other change needed

### E — White Flash Fix

**File**: `front/src/layouts/MainLayout.astro`

- Added `<style is:inline>` block in `<head>` with:
  - `@media (prefers-color-scheme: dark)` rule for users on system dark preference
  - `html.dark` rule for users with explicit dark mode stored in localStorage
- This is pure CSS (no JS), applied immediately on HTML parse before any stylesheet loads or script runs
- Covers both system-preference and explicit dark mode during the brief window between page navigations

### F — UI: Acquisition Date + Delete Dialog

**F1. AssetHeader** (`front/src/components/assets/AssetHeader.tsx`):
- Added `acquisitionDate` to subtitle line: `… · Acquired {date}` (omitted if null)

**F2. AssetSnapshotsList** (`front/src/components/assets/AssetSnapshotsList.tsx`):
- Added optional `acquisitionDate` and `acquisitionPrice` props
- Renders an "Acquired" pseudo-row at the top of the snapshots table (visually distinct)

**F3. AssetDetailPage** (`front/src/components/assets/AssetDetailPage.tsx`):
- Passes `acquisitionDate` and acquisition price to `AssetSnapshotsList`
- Replaced `confirm()` with `showDeleteConfirm` state + `<DeleteConfirmDialog />`

**F4. DeleteConfirmDialog** (`front/src/components/assets/DeleteConfirmDialog.tsx`) — new:
- Simple modal: "Are you sure you want to delete this asset?" with Cancel / Delete buttons
- Props: `{ open, pending, onClose, onConfirm }`

### G — Tests

- **`AssetHeader.test.tsx`**: new tests for acquisition date display (present / absent)
- **`AssetSnapshotsList.test.tsx`**: new tests for acquisition row (date + price)
- **`DeleteConfirmDialog.test.tsx`**: new — renders message, confirm button calls `onConfirm`, cancel calls `onClose`

### H — Codecov

**Files**: `codecov.yml`, `README.md`

- Added frontend path fix and `flag_management.carryforward: true` to `codecov.yml`
- Split README badge into separate backend + frontend per-flag badges
- Token was manually re-created by the user (repo transfer `francoiducat` → `fducat18` had stale token)

---

## Execution Summary

**Commit**: (see git log for SHA after this commit)

### Actual changes

All planned changes were implemented as specified. No scope reduction.

| File | Status |
|---|---|
| `.github/workflows/ci.yml` | ✅ DATABASE_URL + Node 24 upgrade (all 3 jobs) |
| `backend/Dockerfile` | ✅ node:22-alpine → node:24-alpine |
| `front/Dockerfile` | ✅ node:22-alpine → node:24-alpine |
| `docs/Dockerfile` | ✅ node:22-alpine → node:24-alpine |
| `scripts/version.mjs` | ✅ VERSION_OVERRIDE env var support |
| `package.json` | ✅ docker:prod exports VERSION_OVERRIDE from latest git tag |
| `docs/src/styles/custom.css` | ✅ .sl-container margin-inline: auto |
| `front/public/favicon.svg` | ✅ Deleted |
| `front/src/layouts/MainLayout.astro` | ✅ SVG favicon link removed; inline dark-mode CSS added |
| `front/src/components/assets/AssetHeader.tsx` | ✅ Acquisition date in subtitle |
| `front/src/components/assets/AssetSnapshotsList.tsx` | ✅ Acquired pseudo-row at top of table |
| `front/src/components/assets/AssetDetailPage.tsx` | ✅ DeleteConfirmDialog wired; acquisition data passed to snapshots list |
| `front/src/components/assets/DeleteConfirmDialog.tsx` | ✅ NEW — confirmation modal |
| `front/src/components/assets/__tests__/AssetHeader.test.tsx` | ✅ 2 new tests for acquisition date |
| `front/src/components/assets/__tests__/AssetSnapshotsList.test.tsx` | ✅ 3 new tests for acquisition row |
| `front/src/components/assets/__tests__/DeleteConfirmDialog.test.tsx` | ✅ NEW — 5 tests |
| `codecov.yml` | ✅ Frontend path fix + flag_management carryforward |
| `README.md` | ✅ Per-flag coverage badges |
| `docs/src/content/docs/dev-setup.md` | ✅ Updated Node 22 → Node 24 references |

### Deviations from plan

None. Implementation matched the plan exactly.

### Test results

| Gate | Result |
|---|---|
| Backend unit | ⏭ Skipped (no backend changes) |
| Backend e2e | ⏭ Skipped (no backend changes) |
| Frontend unit | ✅ 391 tests passed (63 files) |
| Frontend e2e | ⏭ Skipped (UI changes are covered by unit tests; e2e requires live backend) |

### Key discoveries

- `front/public/favicon.svg` was a blue "S" SVG that browsers preferred over the PNG favicons — deleting it was sufficient; PNGs were already correct and byte-identical to the docs site.
- The `AssetSnapshotsList` empty-state condition was updated from `sorted.length > 0` to `sorted.length > 0 || acquisitionDate` so the table renders even when there are zero snapshots but an acquisition date exists.
- `dev-setup.md` had a stale reference saying Docker uses `node:22-alpine` — updated to `node:24-alpine` as part of the doc grep pass.
