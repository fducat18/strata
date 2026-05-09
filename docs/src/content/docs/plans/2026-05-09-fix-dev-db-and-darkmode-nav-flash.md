---
title: "Plan — fix dev DB consistency + web dark-mode navigation flash"
---

## Context

Two issues in scope:

1. Deleting asset in Docker dev then opening Tauri dev can show deleted asset again.
2. Intermittent dark-mode flash appears in web app during route navigation.

Additional doc request:
- Remove Google Drive development guidance from active docs (historical plan docs excluded).

## AGENTS.md checklist

| # | Convention | Applies | Plan handling |
|---|---|---|---|
| 1 | Documentation parity | Yes | Update active docs for DB behavior and remove Google Drive guidance |
| 2 | 4 test gates required | Yes | Run backend build+unit+e2e and frontend unit+e2e |
| 3 | Self-review before implementation | Yes | File list and acceptance mapping included below |
| 4 | Endpoint coverage (Bruno + Swagger) | No | No new endpoint |
| 5 | Bug-to-Test rule | Yes | Add regression test(s) for dark-mode navigation behavior |
| 6 | Seed/test data isolation | Yes | Keep tests independent from seeded records |
| 7 | Transaction invariants | No | No asset transaction rule change planned |
| 8 | Plan history doc before implementation | Yes | This file |
| 9 | Infra test gate | Yes | Re-run affected Docker/Tauri scripts and verify behavior |
| 10 | Environment compatibility | Yes | Keep commands compatible with standalone docker-compose setup |
| 11 | Do-no-harm baseline | Yes | Reproduce baseline before/after for key behavior |
| 12 | Execution Summary required | Yes | Append section after implementation and test gates |
| 13 | Doc grep rule for renamed paths | Yes | Run grep on old path references and update active docs |

## Planned changes

1. **Tauri runtime mode fix** (`src-tauri/src/lib.rs`)
   - Decouple dev/prod DB path selection from git-tag cleanliness.
   - Ensure `tauri:dev` always uses `backend/.data/strata-dev.db`.

2. **Docker dev hardening** (`package.json`)
   - Force `DB_FILE=strata-dev.db` in `docker:dev`, `docker:reset`, `docker:nuke`.

3. **Tauri reset helpers alignment** (`scripts/tauri-reset.sh`, `scripts/tauri-nuke.sh`)
   - Delete `backend/.data/strata-dev.db` (shared dev DB), not legacy `Strata-Dev` path.

4. **Dark-mode flash fix** (`front/src/layouts/MainLayout.astro`, related frontend files as needed)
   - Make dark theme application deterministic before paint across route navigation.

5. **Regression tests**
   - Add/adjust frontend automated tests to cover dark mode persistence on navigation.

6. **Active docs cleanup**
   - Remove Google Drive guidance from active docs pages.
   - Update active docs still referencing stale dev data paths.

## Acceptance criteria mapping

| Acceptance criterion | Planned item(s) |
|---|---|
| Docker dev + Tauri dev share same dev DB in practice | 1, 2, 3 |
| Deleted asset does not reappear when switching Docker dev → Tauri dev | 1, 2, 3 |
| Dark mode does not flash light during navigation | 4, 5 |
| Active docs no longer mention Google Drive dev workflow | 6 |
| Required test gates all pass | 5 + test gate run |

## Execution Summary

**Commit**: not committed yet (working tree changes only)

### Actual changes

- Tauri runtime mode now uses build profile (`debug_assertions`) instead of git-tag cleanliness to choose dev/prod DB paths (`src-tauri/src/lib.rs`).
- Docker dev scripts now force `DB_FILE=strata-dev.db` for `docker:dev`, `docker:reset`, and `docker:nuke` (`package.json`).
- Tauri reset helpers now target shared dev DB at `backend/.data/strata-dev.db` (`scripts/tauri-reset.sh`, `scripts/tauri-nuke.sh`).
- Dark-theme prepaint logic now sets class + color-scheme + fallback colors before paint to reduce navigation flash (`front/src/layouts/MainLayout.astro`, `front/src/lib/theme.ts`, `front/src/stores/themeStore.ts`).
- Added regression coverage for dark mode navigation persistence (`front/e2e/theme.spec.ts`) and stabilized smoke heading assertions for existing async/hydration timing (`front/e2e/smoke.spec.ts`).
- Removed Google Drive guidance from active docs and aligned active DB-path docs with shared dev DB behavior (`configuration.md`, `desktopapp.md`, `quickstart.md`, `recovery.md`).

### Deviations from plan

- Added `front/src/test-setup.ts` storage polyfill so frontend unit tests run reliably in current Node/Vitest environment.
- Stabilized existing smoke e2e assertions (`front/e2e/smoke.spec.ts`) because full test gate surfaced pre-existing heading timing/strict-locator failures unrelated to core feature logic.

### Test results

| Gate | Result |
|---|---|
| Backend build | ✅ passed |
| Backend unit | ✅ 265 passed |
| Backend e2e | ✅ 69 passed |
| Frontend unit | ✅ 381 passed |
| Frontend e2e | ✅ 9 passed, 17 skipped |

### Key discoveries

- Git-describe-based env labeling is not safe as a runtime mode switch for `tauri:dev`; clean tagged checkouts can be misclassified.
- In this environment, Playwright browser binaries were missing and required `npx playwright install` before e2e tests could run.
