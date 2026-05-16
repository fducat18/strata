---
title: "2026-05-16: Desktop no-localhost frontend + clean shutdown"
description: "Harden Tauri desktop mode so frontend pages are not served on localhost, backend localhost API is desktop-auth protected, and sidecars always stop on app close."
---

## Problem

Two desktop-only issues:

1. Running the installed `.app` still exposes Strata pages on localhost.
2. Closing the app must always stop child services and release localhost ports.

Additional invariant:
- Keep shared DB model unchanged:
  - Dev: `backend/.data/strata-dev.db`
  - Prod: `backend/.data/strata.db`

## Plan

### T1 — Desktop frontend transport hardening
- Stop running Astro frontend as desktop localhost sidecar.
- Bundle desktop frontend assets into `src-tauri/frontend-dist/app`.
- Keep root `frontend-dist/index.html` as Tauri-only loader and redirect to bundled `/app/` (no localhost page URL).

### T2 — Desktop backend access hardening
- Add desktop-only backend auth middleware enabled by env var.
- Tauri generates per-launch token and injects it to backend env.
- Tauri loader stores token + backend URL in session storage for bundled frontend client.
- Frontend API client sends desktop token header when present.

### T3 — Sidecar lifecycle reliability
- Keep existing shutdown hooks and make cleanup idempotent.
- Add stale-process cleanup on startup (PID file + best-effort kill).
- Verify app quit releases desktop localhost listeners.

### T4 — Documentation parity
- Update desktop/quickstart/architecture/config docs to reflect:
  - no localhost frontend pages in desktop mode
  - desktop backend protected and not browser-usable
  - DB sharing invariant remains unchanged.

## AGENTS.md checklist

| # | Convention | Status |
|---|---|---|
| 1 | Docs parity | ✅ Planned |
| 2 | Backend/front gates | ✅ Planned |
| 3 | Plan self-review | ✅ This file |
| 4 | Endpoint + Bruno + Swagger | ✅ N/A |
| 5 | Bug-to-test | ✅ Planned (desktop lifecycle/auth checks) |
| 6 | Seed isolation | ✅ N/A |
| 7 | Transaction invariants | ✅ N/A |
| 8 | Plan history before implementation | ✅ This file |
| 9 | Infra gate | ✅ If infra touched |
| 10 | Env compatibility | ✅ Planned |
| 11 | Do-no-harm baseline | ✅ N/A |
| 12 | Execution summary | ✅ Completed |
| 13 | Doc grep rule | ✅ Planned |
| 14 | Semver release + notes | ✅ Completed |

## Execution Summary

**Commits**: `12f573d`, `044d5d9`

### Actual changes

- Desktop runtime no longer launches Astro localhost sidecar; it serves bundled frontend assets from `src-tauri/frontend-dist/app`.
- Added desktop-only backend auth middleware requiring `x-strata-desktop-token` when `STRATA_DESKTOP_API_TOKEN` is set.
- Tauri now generates per-launch token, passes it to backend env, emits it to loader, and frontend API client attaches token automatically.
- Added startup stale-process cleanup (pid-file based) and hardened shutdown flow for backend sidecar lifecycle.
- Updated desktop scripts (`tauri-build.sh`, `tauri-dev.sh`) to produce and sync desktop static frontend bundle.
- Updated docs (`desktopapp`, `quickstart`, `architecture`, `configuration`, `recovery`, `techstack`, ADR/config instructions) to reflect no-localhost desktop frontend + shared DB invariant.

### Deviations from plan

- Asset detail routing changed from dynamic `/assets/:id` to static-friendly `/assets/detail?id=...` to unblock desktop static Astro build (dynamic route prevented static output).

### Test results

| Gate | Result |
|---|---|
| Backend unit | ✅ `npm run test:cov` |
| Backend e2e | ✅ `npm run test:e2e` |
| Frontend unit | ✅ `npx vitest run --coverage` |
| Frontend e2e | ✅ `npm run test:e2e` |
| Docs build | ✅ `cd docs && npm run build` |
| Desktop build | ✅ `./scripts/tauri-build.sh` |

### Key discoveries

- Desktop static bundling required removing Astro dynamic route generation; the asset detail page needed a static-compatible route to complete `STRATA_DESKTOP_STATIC=1` builds.
