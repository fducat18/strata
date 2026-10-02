---
title: "2026-10-02: Fix tauri:install startup error from Node resolution"
description: "Harden desktop Node binary resolution so Prisma migrate can run when GUI PATH is restricted, and add regression tests plus docs updates."
---

## Problem

`npm run tauri:install` can fail at startup with:

```
Database migration failed:
could not run prisma migrate: No such file or directory (os error 2)
Strata — startup error
```

Root cause: `src-tauri/src/lib.rs` resolves Node from a short hardcoded list (`/opt/homebrew/bin/node`, `/usr/local/bin/node`, `/usr/bin/node`) and then falls back to bare `node`. In GUI app launch context, PATH is restricted, so bare `node` may be unresolved.

## Scope and decisions

- **Scope**: hotfix only (no bundled-Node runtime implementation in this change).
- **Resolution level**: targeted hardening.
  - Add build-time absolute Node path fallback.
  - Add common user-level path support.
  - Keep bare `node` only as final fallback.

## Proposed implementation

1. Refactor Node resolution in `src-tauri/src/lib.rs` into explicit candidate ordering.
2. In `src-tauri/build.rs`, capture build-time Node absolute path and expose it as compile-time env metadata.
3. Validate Prisma script path before spawn and return actionable errors when missing.
4. Add Rust regression unit tests for resolver/path-validation behavior.
5. Update desktop docs to reflect actual Node dependency behavior and troubleshooting.
6. Run required validation gates.

## AGENTS.md planning checklist

| # | Convention | Check |
|---|---|---|
| 1 | Documentation | ✅ Plan + docs update included |
| 2 | All 4 test gates | ✅ Included in validation |
| 3 | Self-review | ✅ File map + acceptance mapping complete |
| 4 | Endpoint coverage | N/A |
| 5 | Bug-to-Test | ✅ Rust regression tests planned |
| 6 | Seed isolation | N/A |
| 7 | Transaction invariants | N/A |
| 8 | Plan history | ✅ This file created before implementation |
| 9 | Infra test gate | ✅ `npm run tauri:install` planned |
| 10 | Environment compatibility | ✅ Node path assumptions explicitly validated |
| 11 | Do-no-harm baseline | N/A |
| 12 | Plan Execution Summary | ⏳ Append after implementation |
| 13 | Doc Grep rule | ✅ Will grep/update stale path references if needed |
| 14 | Semver release rule | ⏳ Apply after implementation is complete |

## Execution Summary

**Commit**: `52c3349` (base HEAD used during implementation; changes are currently uncommitted)

### Actual changes

- `src-tauri/build.rs`
  - Added build-time Node path capture (`command -v node`) and exported it as `STRATA_NODE_PATH`.
  - Added `cargo:rerun-if-env-changed=PATH` so the embedded path refreshes when PATH changes.
- `src-tauri/src/lib.rs`
  - Replaced narrow `find_node()` lookup with ordered resolver:
    1) build-time `STRATA_NODE_PATH`, 2) system paths, 3) `~/.local/bin/node`, 4) bare `node`.
  - Added `ensure_prisma_cli_js()` guard for `backend/node_modules/prisma/build/index.js`.
  - Improved spawn/migrate/seed error messages to include the Node binary attempted.
  - Added Rust unit tests for resolver precedence and Prisma CLI path validation.
- `docs/src/content/docs/desktopapp.md`
  - Updated Node dependency limitation to reflect actual resolver behavior.
  - Added troubleshooting guidance for `could not run prisma migrate`.
- `docs/src/content/docs/plans/index.md`
  - Added this plan entry to the plans table.

### Deviations from plan

- No functional deviation in scope.
- Validation sequence needed one extra cleanup step: initial `tauri:install` retries failed due stale/rival local processes on port `3456` during verification, not because of resolver logic. Re-ran the gate after cleanup.

### Test results

| Gate | Result |
|---|---|
| Rust unit tests (`cd src-tauri && cargo test`) | ✅ 5 passed |
| Infra/runtime gate (`npm run tauri:install`) | ✅ passed (post-install checks succeeded) |
| Backend unit coverage (`cd backend && npm run test:cov`) | ✅ 35 suites, 350 tests, thresholds met |
| Backend e2e (`cd backend && npm run test:e2e`) | ✅ 10 suites, 75 tests |
| Frontend unit coverage (`cd front && npx vitest run --coverage`) | ✅ 74 files, 467 tests, thresholds met |
| Frontend e2e (`cd front && npm run test:e2e`) | ✅ 13 passed, 22 skipped |
| Docs build (`cd docs && npm run build`) | ✅ success |

### Key discoveries

- This machine resolves `node` to `/Users/fducat/.local/bin/node`, which was outside the prior hardcoded set and explains the original `os error 2` failure mode under GUI PATH restrictions.
- Tauri runtime health checks can produce false negatives when another local process is already bound to `:3456` with a mismatched desktop token.
