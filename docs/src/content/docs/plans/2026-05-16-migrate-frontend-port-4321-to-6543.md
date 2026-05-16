---
title: "2026-05-16: Migrate frontend port 4321 to 6543"
description: "Apply frontend port migration across web, Docker, Tauri sidecar, tests, scripts, and documentation; then validate with full quality gates."
---

## Problem

After running `npm run docker:prod` and `npm run docker:reset`, frontend still serves on `http://localhost:4321`. Root cause: migration was planned but never implemented; repository still hardcodes `4321` across runtime and docs.

## Scope

- Apply `4321 → 6543` for frontend in **all** relevant surfaces: web, Docker, and Tauri sidecar.
- Keep docs nginx endpoint unchanged (`http://localhost:8001/docs/`).

## Plan

### T1 — Runtime/config migration
- Update frontend defaults and Docker wiring:
  - `front/astro.config.mjs`
  - `front/Dockerfile`
  - `docker-compose.yml`
- Update backend CORS default:
  - `backend/src/main.ts`
- Update Tauri sidecar frontend port/origin wiring:
  - `src-tauri/src/lib.rs`
  - `src-tauri/frontend-dist/index.html` (if required by committed runtime fallback)

### T2 — Tooling/tests migration
- Update local/frontend tooling:
  - `front/playwright.config.ts`
  - `scripts/check-ports.mjs`
  - `scripts/check-prereqs.mjs`

### T3 — Documentation parity
- Update current operational docs and readmes referencing active frontend port:
  - `README.md`, `front/README.md`
  - `docs/src/content/docs/{architecture,quickstart,dev-setup,frontend,configuration,desktopapp,recovery,backup,docs-site}.md`
  - `.github/copilot-instructions.md`
- Preserve historical release/plan docs unless they must reflect current operational instructions.

### T4 — Verification gates
- Environment/infra checks:
  - `docker buildx version`
  - `docker compose version`
  - `docker compose build front`
- Backend quality gates:
  - `cd backend && npm run test:cov`
  - `cd backend && npm run test:e2e`
- Frontend quality gates:
  - `cd front && npx vitest run --coverage`
  - `cd front && npm run test:e2e`
- Behavioral checks:
  - `npm run docker:reset` and verify frontend on `http://localhost:6543`
  - `npm run docker:prod` and verify expected prod endpoint behavior
- Docs build:
  - `cd docs && npm run build`

## AGENTS.md Checklist

| # | Convention | Status |
|---|---|---|
| 1 | Documentation parity | ✅ Planned in T3 |
| 2 | Backend+frontend unit/e2e quality gates | ✅ Planned in T4 |
| 3 | Plan self-review | ✅ This document |
| 4 | Endpoint + Bruno + Swagger | ✅ N/A |
| 5 | Bug-to-test | ✅ Existing test/runtime checks updated in T2/T4 |
| 6 | Seed/test isolation | ✅ N/A |
| 7 | Transaction invariants | ✅ N/A |
| 8 | Plan history before implementation | ✅ This file |
| 9 | Infra test gate | ✅ Planned in T4 |
| 10 | Environment compatibility checks | ✅ Planned in T4 |
| 11 | Do-no-harm baseline | ✅ N/A |
| 12 | Execution summary append | ✅ Pending completion |
| 13 | Doc grep rule | ✅ Planned in T3 |
| 14 | Semver release + release notes | ✅ Pending completion |

## Execution Summary

**Commit**: _Not committed in this workspace yet_

### Actual changes

| File | Change |
|---|---|
| `front/astro.config.mjs` | Frontend dev server port set to `6543` |
| `front/Dockerfile` | Runtime `PORT`, `EXPOSE`, and healthcheck switched to `6543` |
| `docker-compose.yml` | Front service port mapping changed to `6543:6543` |
| `backend/src/main.ts` | Default CORS origin changed to `http://localhost:6543` |
| `src-tauri/src/lib.rs` | Tauri sidecar frontend port + ALLOWED_ORIGINS updated to `6543` |
| `src-tauri/frontend-dist/index.html` | Startup redirect/poll target updated to `http://localhost:6543` |
| `front/playwright.config.ts` | Playwright base URL/webServer URL updated to `6543` |
| `scripts/check-ports.mjs` | Frontend port checks/logs updated to `6543` |
| `scripts/check-prereqs.mjs` | Frontend prerequisite port check updated to `6543` |
| `README.md`, `front/README.md`, `docs/README.md` | Frontend/local URLs updated to `6543` (docs remains `8001`) |
| `docs/src/content/docs/{architecture,quickstart,dev-setup,frontend,configuration,desktopapp,recovery,backup,docs-site}.md` | Current-behavior port references updated to `6543` and conflict wording corrected |
| `docs/src/content/docs/plans/index.md` | Added this plan entry |
| `front/e2e/theme.spec.ts` | Added hydration wait in second test to remove deterministic click race in e2e gate |

### Deviations from plan

- Added one small e2e test stabilization (`front/e2e/theme.spec.ts`) because the mandated `front` e2e gate failed before completion; root cause was a missing hydration wait in one test case.

### Test results

| Gate | Result |
|---|---|
| Docker compatibility | ⚠️ `docker buildx` unavailable in environment (legacy docker-compose v5.1.3) |
| Infra build | ✅ `docker-compose build front` |
| Backend unit coverage | ✅ 30 suites, 319 tests (`npm run test:cov`) |
| Backend e2e | ✅ 8 suites, 70 tests (`npm run test:e2e`) |
| Frontend unit coverage | ✅ 64 files, 406 tests (`npx vitest run --coverage`) |
| Frontend e2e | ✅ 9 passed, 17 skipped (`npm run test:e2e`) |
| Docker dev behavior | ✅ reset flow verified frontend on `6543`, `4321` down |
| Docker prod behavior | ✅ frontend on `6543`, `4321` down, docs on `8001/docs/` |
| Docs build | ✅ `cd docs && npm run build` |

### Key discoveries

- The previous `4321 → 6543` work had not been applied; all key runtime surfaces still pointed to `4321`.
- Frontend e2e suite had a deterministic race in one theme test unrelated to port migration; fixed with condition-based hydration wait.
