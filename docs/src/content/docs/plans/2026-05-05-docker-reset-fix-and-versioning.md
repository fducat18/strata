---
title: "2026-05-05 — Docker Reset Fix + Versioning"
description: "Restore broken docker:reset, fix docker:nuke, full version consistency across all 6 files, plans sidebar autogenerate, sem-ver AI skill."
---

# 2026-05-05 — Docker Reset Fix + Full Version Consistency

## Status: ✅ Complete

## Problem Summary

1. `docker:reset` broken — `--mount=type=cache` requires Docker BuildKit, NOT available in standalone docker-compose v5.1.3.
2. `docker:nuke` broken — references `docker builder prune` (BuildKit-only, unavailable).
3. `release.mjs` missing `git push origin HEAD` and doesn't bump version files.
4. No versioning skill for AI agents.
5. Plans sidebar only showed 2 of 9 existing plan files (manual maintenance).
6. Checklist instructions lacked infra safeguards (root cause of the breakage).
7. `scripts/sync-readme.mjs` was dead code (not wired to any npm script).

## Root Cause

The previous Docker optimization plan used `--mount=type=cache` (a Docker BuildKit feature) in all 3 Dockerfiles. The environment uses standalone `docker-compose v5.1.3` which uses the legacy Docker builder — BuildKit is not available, causing every `RUN --mount=...` line to fail with `"the --mount option requires BuildKit"`.

## Solution

### Dockerfiles

Remove all `--mount=type=cache` lines from `backend/`, `front/`, and `docs/` Dockerfiles.

Keep:
- `# syntax=docker/dockerfile:1.7` (harmless to legacy builder, forward-compat signal)
- CMD fix in backend (removed duplicate `prisma migrate deploy`)

Performance without BuildKit: Docker's legacy builder layer-caches the `npm ci` step as long as `package*.json` hasn't changed. This gives near-instant installs on repeat resets without BuildKit.

### Script Semantics

| Script | Build cache | DB | Use case |
|---|---|---|---|
| `docker:dev` | existing images | existing DB | daily fast start (~10s) |
| `docker:reset` | layer-cached build | **fresh** | new feature / schema change |
| `docker:nuke` | wipes all images + `--no-cache` | **fresh** | emergency / corrupted deps |

`docker:reset` now uses layer cache (removed `--no-cache`). `docker:nuke` uses `docker image prune -a -f` instead of `docker builder prune` (which is BuildKit-only).

### Version Consistency

`npm run release -- X.Y.Z` now bumps **all 6 version files** atomically before tagging:

- `package.json` (root)
- `backend/package.json`
- `front/package.json`
- `docs/package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`

Workflow: bump 6 files → `git commit "chore: release vX.Y.Z"` → `git push origin HEAD` → `git tag vX.Y.Z` → `git push origin vX.Y.Z`

The `--dry-run` flag prints all steps without executing git commands — safe for verification.

### Plans Sidebar

Replaced manual sidebar items in `docs/astro.config.mjs` with `autogenerate: { directory: 'plans' }`. All existing and future plan files appear automatically. No manual sidebar edit needed per plan.

### sem-ver AI Skill

Created `~/.agents/skills/sem-ver/SKILL.md`. The skill conducts a Socratic interview to suggest a semver version, confirms with the user, then executes the release.

### Infra Safeguards

Added 3 rules to `.github/instructions/agents-plan-checklist.instructions.md`:
- Rule 9: infra files → run the command before declaring done
- Rule 10: check tool versions before using platform features
- Rule 11: document baseline before optimizing

## Acceptance Gates

| Gate | Command | Result |
|---|---|---|
| 1 | `cd backend && npm test` | — |
| 2 | `cd backend && npm run test:e2e` | — |
| 3 | `cd front && npm test` | — |
| 4 | `cd front && npm run test:e2e` | — |
| 5 | `npm run docker:reset` | ✅ |
| 6 | `npm run docker:nuke` | ✅ |
| 7 | `npm run release -- 0.1.0 --dry-run` | ✅ |

## Files Changed

| File | Change |
|---|---|
| `backend/Dockerfile` | Removed `--mount=type=cache` from npm ci and prisma generate |
| `front/Dockerfile` | Removed `--mount=type=cache` from npm ci and astro build |
| `docs/Dockerfile` | Removed `--mount=type=cache` from npm ci and astro build |
| `package.json` | docker:reset removed `--no-cache`; docker:nuke replaced `docker builder prune` with `docker image prune -a -f` |
| `scripts/release.mjs` | Rewrite: bump 6 version files, commit, push HEAD, tag, push tag; added `--dry-run` |
| `scripts/sync-readme.mjs` | Deleted (dead code) |
| `.github/copilot-instructions.md` | Removed sync-readme.mjs mention |
| `.github/instructions/agents-plan-checklist.instructions.md` | Added rules 9, 10, 11 |
| `~/.agents/skills/sem-ver/SKILL.md` | New file |
| `docs/astro.config.mjs` | Plans sidebar: manual items → autogenerate |
| `docs/src/content/docs/versioning.md` | Full rewrite: 3-script SRP, consistency model, release command |
| `README.md` | Fixed quickstart, fixed src-tauri status, added script matrix link |
