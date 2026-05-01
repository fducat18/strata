---
title: "Quick Start"
---


## Prerequisites

- **Node.js 22+** — [nodejs.org](https://nodejs.org/) (Astro 6 requires ≥22)
- **npm** — comes with Node.js
- **Docker** (optional) — for containerized development. Works with standalone `docker-compose` v2 OR Docker Desktop.

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
| Swagger UI (dev only) | http://localhost:3000/swagger |
| Frontend | http://localhost:4321 |
| Docs | http://localhost:8001/docs/ |

## Option 2: Local Development

### Backend

```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

The API is available at `http://localhost:3000/api/v1` and Swagger UI at `http://localhost:3000/swagger`.

### Frontend

```bash
cd front
npm install
npm run dev
```

The frontend is available at `http://localhost:4321`.

## Option 3: Desktop App (Tauri)

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

## Dev vs Prod configuration (same machine, different risk profile)

| Concern | Development mode | Production mode |
|---|---|---|
| Startup command | `npm run docker:dev` | `npm run docker:prod` |
| `NODE_ENV` | `development` | `production` |
| Swagger | Enabled (`/swagger`) | Disabled |
| Restart policy | Default/no forced restart | `always` |
| Purpose | Safe to iterate, break, reset | Keep real data stable |
| Desktop DB path | `~/Library/Application Support/Strata-Dev/strata.db` (when build marked dev) | `~/Library/Application Support/Strata/strata.db` |
| Docker DB path | `backend/.data/strata.db` | `backend/.data/strata.db` (same file unless you separate volumes) |

For long-term personal use, treat **prod** as the source of truth and keep recurring backups.

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
├── .bruno/            ← Bruno API collection
└── docker-compose.yml
```

## API Collection

A complete [Bruno](https://www.usebruno.com/) API collection is available in `.bruno/Strata/` with requests for all endpoints.

---

## Recovery — "fresh laptop, three years from now"

This section is the one you (or future-you) will be glad existed. Goal: from nothing but a GitHub URL and a backup file, get Strata running again.

### Prerequisites on the new machine

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose v2)
- `git`

That's it. No Node, no Python, no Prisma CLI required for recovery.

### Step 1 — Clone

```bash
git clone https://github.com/francoiducat/strata.git
cd strata
```

### Step 2 — Bring the stack up

```bash
docker-compose up --build -d
```

Wait until the backend logs show `Nest application successfully started`. The first run automatically:

1. Applies all Prisma migrations (`npx prisma migrate deploy`)
2. Seeds reference data — asset types, categories, tags, and demo assets (`npx prisma db seed`)
3. Starts the API on port `3000`, the frontend on `4321`, the docs on `8001`

At this point Strata is alive but **empty** (just seed data). If you have no backup, you're done — start using it.

### Step 3 (optional) — Restore from a JSON backup

If you exported a backup (Settings → Backup → Export) on your previous install, you'll have a file like `strata-backup-YYYY-MM-DD.json`.

Two options:

**Option A — UI (recommended once a UI restore endpoint is wired):**

1. Open <http://localhost:4321/settings>
2. Click *Import backup* and select the JSON file
3. Confirm the overwrite prompt

**Option B — Direct DB swap:**

If you also kept a copy of the SQLite file (`backend/.data/strata.db`), the fastest recovery is to drop it back in:

```bash
docker-compose down
cp /path/to/your/strata.db backend/.data/strata.db
docker-compose up -d
```

The migrations in step 2 are idempotent, so an existing DB is preserved as-is.

### Step 4 — Verify

```bash
curl http://localhost:3000/api/v1/assets | jq '. | length'
curl http://localhost:3000/api/v1/portfolio-snapshots | jq '. | length'
```

Should print the number of assets and portfolio snapshots you expect. Open <http://localhost:4321> and check the dashboard.

### Where everything lives (so future-you can find it)

| Thing | Location |
|---|---|
| Database file | `backend/.data/strata.db` (mounted from host) |
| Prisma schema | `backend/prisma/schema.prisma` |
| Migrations history | `backend/prisma/migrations/` |
| Seed script | `backend/prisma/seed.ts` |
| Backups (export) | Wherever you saved the JSON — **keep an off-machine copy** |

> 💾 **Backup hygiene:** export a JSON backup _and_ copy `backend/.data/strata.db` to cloud storage on a schedule. Either one is enough to restore; both is belt-and-braces.

---

## Dev Data & Database Reset

### What gets seeded on first start

When Strata starts for the first time (or after a reset), the seed script automatically creates:

- **6 demo assets** — checking account, savings account, apartment, home loan, and two vehicles
- **Categories and tags** — a realistic reference set
- **4 historical portfolio snapshots** — one per month for January–April 2025, so the dashboard net worth chart has data immediately

### Database files

| File | Purpose |
|---|---|
| `backend/.data/strata-dev.db` | Development database. Contains demo seed data. Safe to wipe at any time. |
| `backend/.data/strata.db` | Production database. Contains your real personal asset data. **Never auto-wiped.** |

### Resetting dev data

```bash
npm run docker:reset
```

This deletes `strata-dev.db` and restarts Docker. The seed will run again and recreate all demo data from scratch. Your production data in `strata.db` is never touched.

> **`npm run docker:reset`** wipes the dev database (`strata-dev.db`) and rebuilds Docker with `--no-cache`, then runs migrations and seeds. Use this for a completely clean slate.
> 
> **`npm run docker:dev`** is the day-to-day command for development (fast rebuild, preserves existing data).

### Why e2e tests don't pollute your dev data

E2e tests create a completely isolated temporary SQLite database — they never touch `strata-dev.db` or `strata.db`. Each test run is fully self-contained and leaves no trace in your development environment.

### Production backups

Use `npm run docker:prod` for production. Always back up `backend/.data/strata.db` before any major update. The Settings page in the app also provides an export/import feature for portable JSON backups.
