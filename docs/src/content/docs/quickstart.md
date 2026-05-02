---
title: "Quick Start"
---

> 🚀 **How do I run Strata?** Choose Docker (recommended, 5 minutes), local development, or Tauri desktop app.

## Prerequisites

- **Docker** — for containerized development (recommended). Works with standalone `docker-compose` v2 OR Docker Desktop.
- **Node.js 22** — required only for local development without Docker. [nodejs.org](https://nodejs.org/)

:::tip[First time? Run the prerequisite check]
```bash
npm run setup
```
This checks your Node version, Docker status, and port availability before you do anything else.
:::

## Option 1: Docker (Recommended)

Strata ships **one** `docker-compose.yml` with two flavours toggled by env
vars. Two npm shortcuts at the repo root make this painless:

```bash
git clone https://github.com/francoiducat/strata.git
cd strata

# Dev mode (Swagger on, no restart policy, default)
npm run docker:dev

# Production-like mode (Swagger off, restart=always, NODE_ENV=production)
npm run docker:prod
```

:::note[Corporate / ZScaler proxy?]
If your machine intercepts HTTPS traffic (ZScaler, Netskope, Cisco Umbrella, …), the Docker build needs your root CA cert:

```bash
security find-certificate -a -c ZScaler -p /Library/Keychains/System.keychain \
  > backend/certs/zscaler-ca.crt
# Then rebuild:
npm run docker:dev
```

See `backend/certs/README.md` for other platforms and CA names.
:::

| Service | URL |
|---------|-----|
| Backend API | http://localhost:3000/api/v1 |
| Swagger UI | http://localhost:3000/swagger |
| Frontend | http://localhost:4321 |
| Docs | http://localhost:8001/docs/ |

## Option 2: Desktop App (Tauri)

For the "real" Strata experience — a native macOS window, menu bar, and an
isolated SQLite under `~/Library/Application Support/Strata/`.

```bash
# Dev: opens an unsigned dev build with hot reload, uses Strata-Dev/ data dir
./scripts/tauri-dev.sh

# Prod: builds Strata.app from a tagged commit (or current HEAD)
./scripts/tauri-build.sh
open src-tauri/target/release/bundle/macos/Strata.app
```

The window title shows the version (e.g. `Strata 1.4.2`). Untagged or dirty
builds show `(DEV)` and use a **separate** data folder so dev experiments
cannot corrupt your real data. See [Versioning](/docs/versioning/) and
[Recovery](/docs/recovery/) for the full story.

## Common Issues

### Port already in use

If `npm run docker:dev` or `docker:reset` fails because a port is already taken:

```bash
# Find what's occupying port 3000 (NestJS API)
lsof -i :3000
# PID shown in the second column — replace 12345 with the actual PID
kill 12345

# Same for the frontend (4321) and docs (8001) if needed
lsof -i :4321
lsof -i :8001
```

The most common cause is a **stale local NestJS process** from a previous `npm run start:dev` that wasn't stopped. The `docker:dev` and `docker:reset` commands include an automatic port check that prints the blocking PID and the exact `kill` command to run.

### Demo data not visible after `docker:dev`

`docker:dev` **keeps** the existing dev database — it will show whatever data was there before (including leftover test data). To get clean, freshly seeded demo data:

```bash
npm run docker:reset
```

This wipes `strata-dev.db`, rebuilds images from scratch, runs migrations, and re-seeds the 6 demo assets.

### Database is stale after backup import

After importing a backup via Settings → Import, the frontend may show old data from the React Query cache. Refresh the page (Cmd+R) to reload the latest data.

## Expected Build Warnings (Not Errors)

These messages appear in the Docker build output and are **safe to ignore**:

| Warning | Why it appears | Severity |
|---------|---------------|----------|
| `Entry docs → 404 was not found` | Astro Starlight always generates a 404 page — this log line is from Astro's build step, not an actual error | Safe to ignore |
| `npm warn deprecated glob@...` | Transitive dependency of build tools (not Strata's direct dep) — will go away when upstream tools update | Safe to ignore |
| `WARN Docker Compose requires buildx plugin` | Using standalone `docker-compose` v1/v2 instead of `docker compose` plugin — both work correctly | Safe to ignore |

## Running Tests

### Backend Tests

```bash
cd backend
npm test              # Unit tests (Jest)
npm run test:e2e      # E2E tests (Supertest)
```

### Frontend Tests

```bash
cd front
npm test              # Unit tests (Vitest)
npm run test:e2e      # E2E tests (Playwright)
```

## Project Structure

```
strata/
├── backend/           ← NestJS API (port 3000)
├── front/             ← Astro + React UI (port 4321)
├── docs/              ← Astro Starlight documentation
├── .bruno/            ← Bruno API collection (all endpoints)
└── docker-compose.yml
```

