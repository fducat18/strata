![Strata logo](assets/logo.avif)

[![CI](https://github.com/francoiducat/strata/actions/workflows/main-backend-ci.yml/badge.svg)](https://github.com/francoiducat/strata/actions/workflows/main-backend-ci.yml)
[![codecov](https://codecov.io/gh/francoiducat/strata/graph/badge.svg)](https://codecov.io/gh/francoiducat/strata)
![Python](https://img.shields.io/badge/python-3.12-blue.svg)
[![Docs](https://img.shields.io/website?url=https%3A%2F%2Fstrata.ducatillon.net%2Fdocs%2F&label=docs)](https://strata.ducatillon.net/docs/)

# Strata — backend

Strata is a domain-driven FastAPI backend for organizing and managing assets (types, portfolios, snapshots, tags). This repository contains the backend application, migrations, tests and docs.

## Quick links
- Source: `backend/`
- Docs: `docs/` (MkDocs)
- **📚 Live Documentation:** https://strata.ducatillon.net/docs/ (deployed via GitHub Actions)
- Migrations: `backend/alembic/`
- Tests: `tests/unit/`

## Prerequisites
- Python 3.12
- Poetry (recommended for local development)
- Docker & Docker Compose (for containerized runs)

## Choose your database — SQLite or Postgres?

Strata works with both **SQLite** and **Postgres**. Both are fully supported. Pick the one that fits your workflow and stick to it — running migrations or the app against different databases at different times is the most common source of confusion.

| | SQLite | Postgres |
|---|---|---|
| Setup | Zero config, single file | Requires Docker (or a running Postgres instance) |
| Good for | Quick local dev, prototyping | Closer to production, multi-client access |
| Persistence | `backend/.data/strata.db` | Docker volume `pgdata` |

**To switch databases: edit one line in `backend/.env`.**

---

## Option A — SQLite (default)

### Running locally with Poetry

```bash
cd backend
poetry install
mkdir -p .data
```

Edit `backend/.env` and set:

```dotenv
DATABASE_URL=sqlite:////app/.data/strata.db
```

Then run migrations and start the app:

```bash
poetry run alembic -c alembic/alembic.ini upgrade head
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Running with Docker Compose (SQLite)

`backend/.env` already contains the SQLite URL by default. Start only the backend service (no Postgres container needed):

```bash
docker compose up -d backend
```

Open the API docs at `http://127.0.0.1:8000/swagger`.

---

## Option B — Postgres

### Running with Docker Compose (Postgres)

Edit `backend/.env` and set:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/strata
```

Then start both services:

```bash
docker compose up -d
```

Wait for Postgres to be healthy, then run migrations:

```bash
docker compose exec backend poetry run alembic -c alembic/alembic.ini upgrade head
```

### Running locally with Poetry (Postgres via Docker)

Start the Postgres container, then run the app on the host:

```bash
docker compose up -d postgres
```

Edit `backend/.env` and set:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/strata
```

> Note: the Postgres service is exposed on host port `5434` (see `docker-compose.yml`).

```bash
cd backend
poetry run alembic -c alembic/alembic.ini upgrade head
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## A note on `DATABASE_URL` and your shell

The app reads `DATABASE_URL` in this order (first one wins):

1. Exported shell variable (`export DATABASE_URL=...`) — affects all host commands.
2. Docker Compose `environment` / `env_file` — affects containerised commands.
3. `backend/.env` — the recommended place to set it.

**If you see the wrong database being used**, check whether `DATABASE_URL` was previously exported in your shell by you or an automation tool:

```bash
printenv | grep DATABASE_URL
# If an unwanted value appears, clear it:
unset DATABASE_URL
```

---

## Running tests

```bash
cd backend
poetry run pytest -q
```

## Database & migrations

Migrations live under `backend/alembic/versions/` and are managed by Alembic. Always run migrations against the same database the app is pointed at.

```bash
cd backend
poetry run alembic -c alembic/alembic.ini upgrade head
```

## Developer notes
- Project follows domain-driven layout: `app/adapters`, `app/application/use_cases`, `app/domain`.
- DB initialization & session management: `app/adapters/outgoing/persistence/database.py`.
- If you want to avoid local README auto-sync, remove or disable the local git hook (see `.git/hooks/`).

## Where to start reading the code
1. `backend/app/main.py` — app entry and router registration
2. `backend/app/adapters/outgoing/persistence` — models, database, repositories
3. `backend/alembic/` — migration scripts
4. `tests/` — unit tests and examples

---

For more detailed developer docs see the `docs/` folder.
