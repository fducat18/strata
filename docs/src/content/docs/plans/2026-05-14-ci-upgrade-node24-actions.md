---
title: "2026-05-14: Upgrade GitHub Actions to Node.js 24 + consolidate agent instructions"
description: "Replace deprecated Node.js 20 action runtimes with Node.js 24 compatible versions, and restructure AGENTS.md + checklist instructions to eliminate duplication."
---

## Context

GitHub will force all JavaScript actions to run on Node.js 24 by default starting June 2, 2026, and will remove Node.js 20 from runners on September 16, 2026. Three CI jobs (Documentation, Backend, Frontend) emitted deprecation warnings on every run.

## Root Cause

Three actions use `runs.using: node20` internally:

| Action | Old | Runtime | Replacement | Runtime |
|---|---|---|---|---|
| `actions/checkout` | `@v4` | node20 | `@v5` | node24 |
| `actions/setup-node` | `@v4` | node20 | `@v5` | node24 |
| `codecov/codecov-action` | `@v4` | node20 | `@v5` | composite |

Verified by reading each action's `action.yml` directly from GitHub.

Additionally, `desktop-build.yml` was using `node-version: 20` for the installed Node version, inconsistent with the rest of the project which uses Node 24.

## Agent Instructions Restructure

Discovered two gaps while working on this plan:

1. `AGENTS.md` was missing Conventions 10 and 11 (they only existed in the instructions file).
2. Both files were injected into AI context, duplicating prose redundantly.

**New structure:**
- `AGENTS.md` = complete prose for all 14 conventions (authoritative law)
- `agents-plan-checklist.instructions.md` = compact actionable checklist (no prose duplication)

**New Convention 14 (Semver Release Rule):** every completed plan must trigger a semver release via `npm run release -- X.Y.Z`.

## Changes

- `.github/workflows/ci.yml` — 8 action version bumps
- `.github/workflows/desktop-build.yml` — 2 action bumps + `node-version: 20` → `"24"`
- `AGENTS.md` — add C10, C11, C14; fix Summary
- `.github/instructions/agents-plan-checklist.instructions.md` — compact checklist, add C14

## Execution Summary

**Commit**: `d419233`

### Actual changes

- Updated `.github/workflows/ci.yml`: all 3 jobs now use `actions/checkout@v5`, `actions/setup-node@v5`, and `codecov/codecov-action@v5`
- Updated `.github/workflows/desktop-build.yml`: `actions/checkout@v5`, `actions/setup-node@v5` with `node-version: "24"`
- Rewrote `AGENTS.md`: added prose for C10, C11, C14; updated Summary to 14 conventions
- Rewrote `agents-plan-checklist.instructions.md`: stripped prose duplication, compact table, added C14

### Deviations from plan

None.

### Test results

| Gate | Result |
|---|---|
| Backend unit | ⏭ not affected |
| Backend e2e | ⏭ not affected |
| Frontend unit | ⏭ not affected |
| Frontend e2e | ⏭ not affected |
| CI infra | ✅ verified by CI run after push |

### Key discoveries

- `actions/checkout@v4` tag points to a commit labeled "v6 auth style cleanup" — the v4 tag itself still uses `node20`. Must use `@v5` for `node24`.
- `codecov/codecov-action@v5` is a composite action (shell scripts), so node runtime deprecation does not apply to it.
- `AGENTS.md` had a numbering gap (10, 11 missing) — these were silently living only in the instructions checklist file.
