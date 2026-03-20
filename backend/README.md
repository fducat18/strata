# Backend — developer notes

See the root [README.md](../README.md) for full setup instructions, including how to choose between SQLite and Postgres.

## Quick reference

| Task | Command |
|---|---|
| Install deps | `cd backend && poetry install` |
| Run migrations | `poetry run alembic -c alembic/alembic.ini upgrade head` |
| Start app (local) | `poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload` |
| Run tests | `poetry run pytest -q` |
| Start with Docker | `docker compose up -d` (from repo root) |

## Choosing a database

Edit **one line** in `backend/.env` before running migrations or starting the app:

```dotenv
# SQLite (default, no extra services needed)
DATABASE_URL=sqlite:////app/.data/strata.db

# Postgres (requires the postgres Docker Compose service)
# DATABASE_URL=postgresql://postgres:postgres@postgres:5432/strata
```

Pick one and stick to it. Running migrations against SQLite then starting the app against Postgres (or vice versa) leads to schema mismatches.

## Common pitfall — exported shell variable

If `DATABASE_URL` is exported in your shell, it overrides `backend/.env` for any command you run on the host (poetry, alembic, uvicorn). Check and clear it if needed:

```bash
printenv | grep DATABASE_URL
unset DATABASE_URL
```
