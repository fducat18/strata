---
title: "2026-09-28: Financing savings asset eligibility"
description: "Restrict financing sources to assets classified in the savings group and enforce the same rule in the API."
---

# Financing savings asset eligibility

## Problem

The Financing form labels its source list “Savings assets” but currently displays every active asset. The type taxonomy groups savings accounts, checking accounts, cash, investments, and bonds together as `FINANCIAL`, so that group cannot safely define eligible source assets.

## Decision

Add a dedicated `SAVINGS` asset-type group. Seed `SAVINGS_ACCOUNT` in that group, and let custom savings products use the same group. The group determines which assets appear as candidates; the user still confirms whether each listed asset is available for a particular purchase.

## Implementation and acceptance criteria

1. Add `SAVINGS` to the backend asset-type group enum and asset-type management UI. Keep the broad `FINANCIAL` group for checking, cash, and investments.
2. Show only active `SAVINGS`-group assets in the Financing form; retain per-asset availability choices and detached scenario snapshots.
3. Reject new API inputs containing non-savings assets; keep already-saved detached scenarios readable.
4. Update the financing domain context, feature documentation, architecture, and data-model group table.
5. Add regression coverage for frontend filtering and backend enforcement.

## Verification

- Run targeted frontend and backend tests for filtering, asset-type group handling, and API validation.
- Run the full frontend and backend test suites and build the documentation site.

## Execution Summary

### Actual changes

- Added the `SAVINGS` asset-type group, moved the seeded `SAVINGS_ACCOUNT` type into it, and added a migration for existing databases.
- The Financing form now lists active `SAVINGS`-group assets only. The API enforces the same candidate rule; the user still confirms per-scenario availability.
- Updated asset-type management, chart colors, Swagger descriptions, and the data-model and financing documentation.
- Added frontend filtering, backend validation, asset-type API, and browser regression coverage.

### Deviations

The API rejects every non-savings asset in a new scenario input, including entries marked unavailable, because the input list now represents only savings candidates. Previously saved detached scenarios remain readable and recalculable.

### Test results

- Backend unit: 35 suites, 348 tests passed; 97.33% statement and 97.91% line coverage.
- Backend E2E: 9 suites, 73 tests passed.
- Frontend unit: 74 files, 464 tests passed; 95.02% statement and line coverage.
- Frontend E2E: both financing browser tests passed. The full suite without an API had 13 passes and 22 backend-dependent skips. A follow-up against an isolated seeded API reported unrelated failures in asset, dashboard, category, and tag flows; it stopped making progress and was terminated. Those flows are outside this change.
- NestJS, frontend Astro, and Starlight documentation builds passed. Prisma validation, client generation, and migration deployment to a temporary SQLite database passed.

### Commit and release

No commit SHA: the changes remain uncommitted for review. The current latest tag is `v1.4.0`, so the patch candidate is `v1.4.1`. A release was not created because `.git` is read-only here and the worktree already contains hundreds of unrelated changes; publishing from this mixed worktree would include changes outside this fix. The release tag and release notes remain outstanding.

### Key discovery

`FINANCIAL` includes checking accounts, cash, and investments, so it cannot define savings candidates. A distinct group supports both the seeded Livret A and custom savings products without using asset names as classification rules.
