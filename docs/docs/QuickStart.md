# Quick Start

## Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org/)
- **npm** — comes with Node.js
- **Docker** (optional) — for containerized development

## Option 1: Docker (Recommended)

```bash
git clone https://github.com/francoiducat/strata.git
cd strata
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Backend API | http://localhost:3000/api/v1 |
| Swagger UI | http://localhost:3000/swagger |
| Frontend | http://localhost:4321 |
| Docs | http://localhost:8001 |

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
├── docs/              ← MkDocs documentation
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
docker compose up --build -d
```

Wait until the backend logs show `Nest application successfully started`. The first run automatically:

1. Applies all Prisma migrations (`npx prisma migrate deploy`)
2. Seeds reference data — asset types, categories, tags, demo portfolio (`npx prisma db seed`)
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
docker compose down
cp /path/to/your/strata.db backend/.data/strata.db
docker compose up -d
```

The migrations in step 2 are idempotent, so an existing DB is preserved as-is.

### Step 4 — Verify

```bash
curl http://localhost:3000/api/v1/portfolios | jq '. | length'
```

Should print the number of portfolios you expect. Open <http://localhost:4321> and check the dashboard.

### Where everything lives (so future-you can find it)

| Thing | Location |
|---|---|
| Database file | `backend/.data/strata.db` (mounted from host) |
| Prisma schema | `backend/prisma/schema.prisma` |
| Migrations history | `backend/prisma/migrations/` |
| Seed script | `backend/prisma/seed.ts` |
| Backups (export) | Wherever you saved the JSON — **keep an off-machine copy** |

> 💾 **Backup hygiene:** export a JSON backup _and_ copy `backend/.data/strata.db` to cloud storage on a schedule. Either one is enough to restore; both is belt-and-braces.
