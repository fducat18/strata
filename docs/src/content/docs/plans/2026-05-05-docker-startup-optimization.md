---
title: "2026-05-05: Docker Startup Optimization"
---

## Problem

`npm run docker:reset` took 4–6 minutes, making the development reset loop painful. The root causes:

| # | Bottleneck | Time cost |
|---|---|---|
| 1 | `--no-cache` forces 3× full `npm ci` from scratch | ~2-3 min |
| 2 | Native module compilation (`better-sqlite3` needs `python3 make g++`) | ~30-45s |
| 3 | Sequential service builds (backend → front → docs) | ~1 min extra vs parallel |
| 4 | Prisma engine binary re-download (~60 MB) | ~20-30s |
| 5 | Frontend waits for backend healthcheck (`start_period=20s`, `interval=30s`) | ~20-50s |
| 6 | `prisma migrate deploy` ran twice (Dockerfile CMD + `main.ts`) | ~5-10s |

## Key Insight

Docker `--no-cache` discards **layer** cache but does NOT clear BuildKit `--mount=type=cache` volumes. These are separate persistent cache volumes keyed by path, not by image layer. This means npm packages, Prisma engine binaries, and Astro build caches can survive even full `--no-cache` rebuilds — making warm `docker:reset` near-instant for the install step.

## Changes

### 1. BuildKit cache mounts (all three Dockerfiles)

Added `# syntax=docker/dockerfile:1.7` to `backend/Dockerfile` and `docs/Dockerfile` (already present in `front/Dockerfile`).

Added `--mount=type=cache` to:

- `npm ci` in all three builders → npm package cache persists
- `prisma generate` in backend builder → Prisma engine binary persists
- `astro build` in front and docs builders → Astro incremental cache persists

### 2. Fixed duplicate `prisma migrate deploy`

Removed `prisma migrate deploy` from the backend Dockerfile CMD. `main.ts` already calls it via `execSync` before the NestJS app boots. In Docker, it was running twice — once in the CMD and once inside the Node process.

New CMD: `npx prisma db seed && node dist/main.js`

### 3. Healthcheck tuning (`docker-compose.yml`)

Reduced backend healthcheck:

- `start_period`: 20s → 10s (NestJS + SQLite starts in ~3-5s)
- `interval`: 30s → 15s (faster initial healthy signal to unblock `front`)

### 4. `gen-version.mjs` — `all` target

Added `all` as a valid target to `scripts/gen-version.mjs`. Running `node scripts/gen-version.mjs all` regenerates version files for backend, front, and docs in a single Node process instead of three sequential invocations.

### 5. Full npm script matrix

| Script | Purpose |
|---|---|
| `docker:dev` | Start stack, keep DB, use existing images (no rebuild) |
| `docker:reset` | Rebuild images + fresh DB, BuildKit cache preserved |
| `docker:nuke` | Rebuild images + fresh DB, BuildKit cache cleared |
| `docker:prod` | Rebuild images for production + start all services, keep DB |
| `docker:down` | Stop all containers |
| `tauri:dev` | Rebuild app + launch dev mode (devtools on), keep DB |
| `tauri:reset` | Rebuild app + fresh DB, Astro cache preserved |
| `tauri:nuke` | Rebuild app + fresh DB, Astro cache cleared |
| `tauri:build` | Build distributable .app bundle, does not launch |
| `tauri:prod` | Build .app bundle + launch in production mode, keep DB |
| `release` | Tag + push a semver release (`npm run release -- X.Y.Z`) |

**New Tauri scripts**: `scripts/tauri-reset.sh`, `scripts/tauri-nuke.sh`
**New release script**: `scripts/release.mjs`

### 6. `docker:dev` behavior change

Previously `docker:dev` ran `docker-compose up --build` (rebuild with layer cache), then was changed to
`docker-compose up` (start existing images, no rebuild) for ~10s daily startup.

**As of 2026-05-14**, `docker:dev` was reverted to always regenerate version files and rebuild images
(layer-cached) before starting. This ensures:
- Version always shows `DEV` label regardless of how images were last built
- Code changes are always picked up without needing to remember to run `docker:reset`

Updated behavior table:

| Command | Gen version | Build | DB | Use case |
|---|---|---|---|---|
| `docker:dev` | ✅ DEV | ✅ layer-cached | Preserved | Daily dev start — always fresh code, keeps data |
| `docker:reset` | ✅ DEV | ✅ layer-cached | **Wiped** | After migrations, unknown DB state |
| `docker:nuke` | ✅ DEV | ✅ no-cache | **Wiped** | Full clean rebuild |
| `docker:prod` | ✅ PROD | ✅ build | `strata.db` | Production deployment |

### 7. `tauri:prod` for beta testing

Added `tauri:prod` = `tauri:build` + `open Strata.app`. Mirrors `docker:prod` for the desktop context. The .app auto-spawns NestJS (port 3456) and Astro (port 4321) as sidecars.

### 8. `npm run release` versioning helper

New `scripts/release.mjs`:

1. Validates semver format
2. Checks git working tree is clean
3. Creates and pushes `vX.Y.Z` git tag

## Results

| Scenario | Before | After |
|---|---|---|
| `docker:reset` warm (2nd run+) | ~4-6 min | ~1-2 min |
| `docker:reset` cold (first ever) | ~4-6 min | ~4-6 min |
| `docker:dev` (layer-cached build + start) | ~2-3 min | ~1-2 min |
| Frontend ready after backend up | ~30-50s | ~15-20s |

## Files Changed

- `backend/Dockerfile`
- `front/Dockerfile`
- `docs/Dockerfile`
- `docker-compose.yml`
- `scripts/gen-version.mjs`
- `scripts/tauri-reset.sh` (new)
- `scripts/tauri-nuke.sh` (new)
- `scripts/release.mjs` (new)
- `package.json`
- `docs/src/content/docs/quickstart.md`
