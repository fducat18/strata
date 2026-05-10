---
title: "Plan — Versioning Env Badge Fix"
description: "Fix docs version badge: docker:dev shows PROD, strata.ducatillon.net shows 0.0.0-dev DEV. Four file changes, zero dashboard config."
---

## Problem

Three surfaces, wrong labels:

| Surface | Currently shows | Should show |
|---|---|---|
| `docker:dev` → http://localhost:8001/docs/ | `v1.0.0 PROD` | `v1.0.0 DEV` |
| `docker:prod` | `v1.0.0 PROD` | `v1.0.0 PROD` ✅ |
| https://strata.ducatillon.net/docs | `v0.0.0-dev+062ec83 DEV` | `v1.0.0` (no badge) |

**Display rules (finalized):**
- DEV: full git describe + badge → `v1.0.0-3-gabc1234 — DEV`
- PROD: clean tag only, **no badge** → `v1.0.0`

## Root Cause Analysis

### docker:dev shows PROD

`docker:reset` / `docker:nuke` call `gen-version.mjs all`. On a clean tag (`v1.0.0`), git describe → `1.0.0` → `isClean=true` → `env=production`. That `version.ts` is `COPY`-ed into the docs Docker image. `docker:dev` = `docker-compose up` (no rebuild) → reuses image → shows PROD.

### strata.ducatillon.net shows 0.0.0-dev DEV

Cloudflare Pages does a shallow clone (depth=1). `git describe` finds no tags → falls back to `0.0.0-dev+sha`. Not a clean semver → `isClean=false` → `env=development`. Both version number and env label are wrong.

### Root fix — package.json fallback (zero dashboard config)

When git returns `0.0.0-dev` (no tags / shallow clone), read version from root `package.json`. Since `release.mjs` always bumps `package.json` in sync with git tags, it always holds the correct version string (e.g. `1.0.0`). A clean semver → `isClean=true` → `env=production` is **derived automatically**. No `STRATA_ENV` env var needed for Cloudflare Pages.

## AGENTS.md Compliance Checklist

| # | Convention | Check |
|---|---|---|
| 1 | Documentation | ✅ Update `versioning.md` with STRATA_ENV + fallback |
| 2 | All 4 test gates | ✅ Script/config changes only — run all gates for regression check |
| 3 | Self-review | ✅ See below |
| 4 | Endpoint coverage | n/a |
| 5 | Bug-to-Test | n/a — build-time display |
| 6 | Seed isolation | n/a |
| 7 | Transaction invariants | n/a |
| 8 | Plan history | ✅ This file |
| 9 | Infra test gate | ✅ Verify `node scripts/version.mjs --json` in all scenarios |
| 10 | Environment compat | ✅ Plain env var; synchronous `fs.readFileSync` |
| 11 | Do-no-harm | ✅ Verify docker:prod still shows `v1.0.0` (no badge) |
| 12 | Execution summary | ✅ Append after done |
| 13 | Doc Grep Rule | ✅ No paths renamed |

### Self-review

- `VERSION_OVERRIDE` path in `version.mjs` untouched — docker:prod still works ✅
- `STRATA_ENV` only overrides `env` field; version string always comes from git/package.json ✅
- package.json fallback triggers only when version starts with `0.0.0-dev` ✅
- Cloudflare Pages: `0.0.0-dev` → fallback → `1.0.0` → `isClean=true` → `env=production` → no badge shown ✅
- No circular deps; no runtime code changes

## Implementation

### 1. `scripts/version.mjs` — STRATA_ENV override + package.json fallback

Add `readFileSync` import and `readPkgVersion()` helper. Two additive changes:
- `STRATA_ENV` override: when set to `development`/`production`, force `env` field
- `package.json` fallback: when version starts with `0.0.0-dev`, replace with `package.json` version

### 2. root `package.json` — docker:reset + docker:nuke

Prepend `STRATA_ENV=development` to `gen-version.mjs all` call in both scripts. `docker:prod` unchanged.

### 3. `docs/src/components/DocsSiteTitle.astro`

- DEV: full `VERSION.version` + `— DEV` badge
- PROD: `VERSION.version.split('-')[0]` only, no badge
- Remove unused `.env-badge.prod` CSS rule

### 4. `docs/src/content/docs/versioning.md`

Document `STRATA_ENV` and `package.json` fallback behavior.

## Acceptance Criteria

- `npm run docker:reset` → http://localhost:8001/docs/ → `v1.0.0 — DEV` (or full sha if past tag)
- `npm run docker:prod` → `v1.0.0` (no badge)
- `node scripts/version.mjs --json` (no tags, shallow simulation) → `version=1.0.0, env=production`
- `STRATA_ENV=development node scripts/version.mjs --json` → `env=development`
- strata.ducatillon.net (after next CF Pages deploy) → `v1.0.0` (no badge)
- All backend unit + e2e tests pass
- All frontend unit + e2e tests pass
