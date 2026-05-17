---
title: "2026-05-17: Fix tauri-install loader marker race"
description: "Fix false failure in desktop post-install checks by waiting for readiness marker with a bounded timeout and deterministic log window."
---

## Problem

`npm run tauri:install` could fail with:

```
❌ Post-install check failed: loader readiness marker missing in desktop log.
Expected: Backend ready — navigating to bundled frontend
```

even when startup actually completed.

## Root cause

Post-install validation in `scripts/tauri-install.sh` had race-prone marker logic:

- initial one-shot check read marker too early (before it was logged), causing false failure
- first patch switched to polling, but started scanning from the current end-of-file line
- if marker was already logged before waiter began, polling ignored it and still false-failed

## Plan

1. Extract reusable log-wait helpers (`scripts/lib/tauri-install-checks.sh`).
2. Add TDD regression script reproducing delayed and pre-existing marker cases.
3. Pass deterministic `log_lines_before` snapshot captured before app launch into marker waiter.
4. Keep strict marker-only readiness requirement.
5. Re-run full quality gates + `npm run tauri:install`.

## AGENTS.md checklist

| # | Convention | Check |
|---|---|---|
| 1 | Documentation parity | ✅ Plan + release notes updates |
| 2 | 4 test gates | ✅ Executed |
| 3 | Plan self-review | ✅ This file |
| 4 | Endpoint + Bruno + Swagger | ✅ N/A |
| 5 | Bug-to-Test | ✅ Added automated shell regression test |
| 6 | Seed isolation | ✅ N/A |
| 7 | Transaction invariants | ✅ N/A |
| 8 | Plan history before implementation | ✅ This file |
| 9 | Infra test gate | ✅ `npm run tauri:install` |
| 10 | Environment compatibility | ✅ macOS assumptions unchanged |
| 11 | Do-no-harm baseline | ✅ Failure reproduced before fix, success after |
| 12 | Execution summary | ✅ Appended below |
| 13 | Doc grep rule | ✅ No path/command renames |
| 14 | Semver release + notes | ✅ Completed in release section/commits |

## Execution Summary

**Commit**: `TBD`

### Actual changes

- Added `scripts/lib/tauri-install-checks.sh` with:
  - `new_logs_since_line`
  - `wait_for_log_marker(log_path, timeout, marker, from_line)`
- Updated `scripts/tauri-install.sh`:
  - capture `log_lines_before` before launching app
  - pass snapshot into marker wait
  - retain strict marker requirement and timeout diagnostics
- Added `scripts/test-tauri-install-marker-wait.sh` regression script with two scenarios:
  - delayed marker appears after waiter starts
  - marker already present when waiter starts

### Deviations from plan

- None.

### Test results

| Gate | Result |
|---|---|
| Backend unit | ✅ `cd backend && npm run test:cov` |
| Backend e2e | ✅ `cd backend && npm run test:e2e` |
| Frontend unit | ✅ `cd front && npx vitest run --coverage` |
| Frontend e2e | ✅ `cd front && npm run test:e2e` |
| Docs build | ✅ `cd docs && npm run build` |
| Desktop install/runtime | ✅ `npm run tauri:install` |
| Script regression | ✅ `bash scripts/test-tauri-install-marker-wait.sh` |

### Key discoveries

- Marker polling must use a launch-time log snapshot (`log_lines_before`) to avoid both early-read and already-emitted-marker races.
