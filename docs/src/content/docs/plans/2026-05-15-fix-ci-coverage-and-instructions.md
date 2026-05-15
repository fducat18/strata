---
title: "2026-05-15: Fix CI coverage failure and improve agent instructions"
description: "Fix frontend functions coverage below 90% threshold (5 untested functions), improve agent instruction files to prevent recurrence."
---

## Problem

CI Frontend job fails on every push to `main`:

```
ERROR: Coverage for functions (89.06%) does not meet global threshold (90%)
```

**Five untested functions** across three frontend files:

| File | Lines | Untested function(s) |
|---|---|---|
| `front/src/lib/api/assets.ts` | 29, 31 | `updateSnapshot`, `deleteSnapshot` |
| `front/src/lib/theme.ts` | 25–33 | `initTheme` |
| `front/src/lib/hooks/assets.ts` | 79–95 | `useUpdateAssetSnapshot`, `useDeleteAssetSnapshot` |

**Secondary cause**: Agent instruction files do not specify which command enforces coverage thresholds. Agents run `npm test` which does **not** enforce thresholds. Only `npm run test:cov` (backend) and `npx vitest run --coverage` (frontend) do.

## Thresholds (both backend and frontend)

| Metric | Threshold |
|---|---|
| Statements | 90% |
| Branches | 80% |
| Functions | 90% |
| Lines | 90% |

## Plan

### T0 — Plan history doc (this file)
Save before implementation starts.

### T1 — Fix: `lib/api/__tests__/assets.test.ts`
Add 2 tests: `updateSnapshot` calls `PUT`, `deleteSnapshot` calls `DELETE`.

### T2 — Fix: `lib/__tests__/theme.test.ts`
Add 2 tests for `initTheme`: registers `matchMedia` listener when theme=`system`, skips it for `dark`/`light`.
Mock `window.matchMedia` (jsdom does not implement it).

### T3 — Create: `lib/hooks/__tests__/assets.test.ts`
New test file. `renderHook` + `QueryClientProvider` wrapper. Mock `assetApi`. 1 test each for `useUpdateAssetSnapshot` and `useDeleteAssetSnapshot`.

### T4 — `nestjs.instructions.md`
Add `## Coverage Gate (CI-Enforced — MANDATORY)` section with exact thresholds, correct command (`npm run test:cov`), excluded patterns, rule.

### T5 — `astro.instructions.md`
Same section adapted for frontend (`npx vitest run --coverage`).

### T6 — `agents-plan-checklist.instructions.md`
Update test gate commands block to show threshold-enforcing commands explicitly.

### T7 — Verify
`npx vitest run --coverage` → exit 0, all thresholds pass.

### T8 — Release v1.2.4 (patch)

## AGENTS.md Checklist

| # | Convention | Status |
|---|---|---|
| 1 | Docs | ✅ Plan doc saved. No feature change → no additional docs needed. |
| 2 | All 4 test gates | ✅ T7 confirms frontend coverage gate |
| 3 | Self-review | ✅ All uncovered lines verified against coverage report |
| 4 | Bruno/Swagger | ✅ N/A |
| 5 | Bug-to-Test | ✅ This plan IS the bug-to-test for the CI failure |
| 6 | Seed isolation | ✅ N/A |
| 7 | Transaction invariants | ✅ N/A |
| 8 | Plan history | ✅ This file |
| 9 | Infra gate | ✅ N/A |
| 10 | Env compat | ✅ N/A |
| 11 | Do-no-harm baseline | ✅ Backend coverage passes locally before any change |
| 12 | Execution summary | ✅ Will append after T7 |
| 13 | Doc grep | ✅ N/A — no renames |
| 14 | Semver release | ✅ T8 — patch v1.2.4 |
