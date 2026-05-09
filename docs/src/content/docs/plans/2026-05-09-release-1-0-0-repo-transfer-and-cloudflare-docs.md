---
title: "Plan — Release 1.0.0, Repo Transfer, Cloudflare Docs Proxy"
description: "Implementation plan for v1.0.0 release notes, repo canonicalization to fducat18/strata, and Cloudflare /docs proxy setup."
---

## Context

Strata is preparing `v1.0.0` with:

1. Release notes documenting the historical migration from Python to full Node.js stack (NestJS backend + Astro frontend/docs).
2. Canonical repository moved to `fducat18/strata` (transfer already done).
3. Docs hosted via Cloudflare Pages at `https://strata.ducatillon.net/docs` with `/docs*` proxy routing.

## AGENTS.md planning checklist

| # | Convention | Applies | Planned handling |
|---|---|---|---|
| 1 | Documentation parity | Yes | Release note + docs updates included |
| 2 | 4 test gates | Yes | Backend unit/e2e + frontend unit/e2e run before closure |
| 3 | Self-review | Yes | Files/flows verified before implementation |
| 4 | Endpoint+Bruno+Swagger | No | No new backend endpoint planned |
| 5 | Bug-to-test | Conditional | Any discovered bug gets automated test |
| 6 | Seed isolation | Conditional | New tests use isolated data only |
| 7 | Transaction invariants | No | Not touching transaction service logic |
| 8 | Plan history | Yes | This plan file created before implementation |
| 9 | Infra run gate | Yes | Workflow/Cloudflare-related changes validated |
| 10 | Environment compatibility | Yes | Keep existing CI/tooling assumptions explicit |
| 11 | Baseline before optimization | No | Not an optimization task |
| 12 | Execution Summary | Yes | Append after implementation and tests |
| 13 | Doc Grep Rule | Yes | Update all stale references for repo/domain/path changes |

## Current state snapshot

- Repo transfer completed to canonical repository `fducat18/strata`.
- Cloudflare Pages project created.
- Existing docs deploy workflow targets GitHub Pages and must be retired/reworked for Cloudflare.
- `proxy-worker/` existed with legacy naming/defaults and needed Strata alignment.
- Multiple repository references still pointed to the former repository slug.

## Implementation phases

### Phase 1 — Release note (v1.0.0)

- Add a docs release-note page for `v1.0.0`.
- Explain the historical shift from Python-era stack to NestJS + Astro full-Node architecture.
- Include impact for users/contributors and release context.

### Phase 2 — Canonical repo reference updates

- Update URLs to canonical `fducat18/strata` in:
  - root/package metadata
  - README and badges
  - docs links and social metadata
  - any setup docs with old clone URL

### Phase 3 — Cloudflare docs proxy worker adaptation

- Adapt `proxy-worker/` from legacy naming/defaults to Strata:
  - worker name
  - default `DOCS_ORIGIN`
  - comments/docs/routes for `strata.ducatillon.net/docs*`
- Keep pass-through behavior for non-doc routes.
- Document deploy/update procedure.

### Phase 4 — GitHub workflow rationalization

- Keep `.github/workflows/ci.yml` (core CI checks).
- Keep `.github/workflows/desktop-build.yml` (manual desktop build artifacts).
- Retire GitHub Pages docs deploy workflow after Cloudflare cutover (CI docs build checks remain covered in `ci.yml`).

### Phase 5 — Verification and closure

- Run required test gates:
  - backend build + unit + e2e
  - frontend unit + e2e
- Confirm docs build succeeds.
- Append `## Execution Summary` to this file with actual changes, deviations, test results, commit SHA(s), discoveries.

## Execution Summary

**Commit SHA(s)**: _Not committed in this session_

### Actual changes

- Added release notes page: `docs/src/content/docs/releases/v1-0-0.md` and linked it in docs sidebar.
- Updated canonical repository references to `fducat18/strata` in root metadata and documentation surfaces.
- Adapted `proxy-worker/` configuration and docs for Strata (`strata-docs-proxy`, `DOCS_ORIGIN`, `/docs*` route guidance).
- Applied routing hotfix in `proxy-worker/index.ts`: strip `/docs` prefix before fetching `DOCS_ORIGIN` so custom-domain `/docs/*` maps to origin root paths.
- Retired GitHub Pages docs deploy workflow by removing `.github/workflows/main-docs-ci.yml`.
- Updated docs-site documentation to reflect Cloudflare Pages + Worker proxy production model.

### Deviations from plan

- Planned "retire or repurpose" docs deploy workflow; implementation chose full retirement because `ci.yml` already covers docs build validation.

### Test results

| Gate | Result |
|---|---|
| Backend unit | ✅ 265 passed (28 suites) |
| Backend e2e | ✅ 69 passed (8 suites) |
| Frontend unit | ✅ 381 passed (62 files) |
| Frontend e2e | ✅ 9 passed, 17 skipped (26 total) |
| Docs build | ✅ `astro build` completed |

### Key discoveries

- `proxy-worker/` already existed in this repository with legacy naming/defaults and required only adaptation, not greenfield creation.
- With `base: '/docs'`, generated HTML links use `/docs/*`, but Cloudflare Pages origin files are emitted at root paths (`/_astro/*`, `/quickstart/*`), so worker must strip `/docs` before origin fetch.
