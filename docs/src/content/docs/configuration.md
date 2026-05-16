---
title: "Configuration"
description: How Strata separates development and production environments, DB files, and environment variables.
---

Strata runs on the same machine in two distinct modes. This page documents the differences.

## Dev vs Production at a Glance

| | Development | Production |
|---|---|---|
| Command | `npm run docker:dev` | `npm run docker:prod` |
| DB file | `backend/.data/strata-dev.db` | `backend/.data/strata.db` |
| NODE_ENV | `development` | `production` |
| Swagger UI | ✅ `http://localhost:3000/swagger` | ✅ `http://localhost:3000/swagger` |
| Seed data | Demo assets seeded on first start | Real personal data — never auto-seeded |
| Version badge | Shows `DEV` badge | Shows clean version number |
| Docker restart policy | none | `always` |
| Reset DB | `npm run docker:reset` | ⚠️ Manual only — backup first! |
| Desktop app data dir | `backend/.data/` | `backend/.data/` |

## How to Access Strata

In **development mode** (`npm run docker:dev`), you can access the app in two ways:

| Access method | Where | When to use |
|---|---|---|
| Web browser | `http://localhost:6543` | Day-to-day dev — fast reload, browser devtools, React hot update |
| Tauri Desktop App | `./scripts/tauri-dev.sh` | Test native macOS window/menu bar while sharing dev DB |

Web browser mode uses backend on `http://localhost:3000/api/v1` (Docker).
`tauri:dev` runs a desktop-auth-protected backend sidecar on `http://localhost:3456/api/v1` and uses bundled frontend assets (no localhost frontend URL). Web mode still uses Docker backend on `http://localhost:3000/api/v1`.

In **production mode** (`npm run docker:prod`):
- Use `./scripts/tauri-build.sh` to build the Tauri `.app` bundle — the full native experience with your real data in `backend/.data/strata.db`
- Or use `docker:prod` if you want a headless server scenario (e.g., running on a NAS or cloud VM)

## Environment Variables

| Variable | Description | Dev default | Prod default |
|---|---|---|---|
| `NODE_ENV` | Runtime mode | `development` | `production` |
| `DATABASE_URL` | Prisma connection string | `file:../backend/.data/strata-dev.db` | `file:../backend/.data/strata.db` |
| `DB_FILE` | DB filename inside `.data/` | `strata-dev.db` | `strata.db` |
| `PUBLIC_API_URL` | Frontend build-time API base URL | `http://localhost:3000/api/v1` | `http://localhost:3000/api/v1` |
| `ENABLE_SWAGGER` | Set to `false` to disable Swagger UI | _(on by default)_ | _(on by default)_ |

> `PUBLIC_API_URL` is a **build-time variable** — it is baked into the Astro frontend at build time. Rebuilding the frontend image is required if the API URL changes.

## Two Database Files, Never Mixed

The most important rule in Strata operations: **dev and prod data never mix**.

| File | Purpose |
|---|---|
| `backend/.data/strata-dev.db` | Development & demo data. Safe to wipe at any time. |
| `backend/.data/strata.db` | Your real personal financial data. **Never auto-wiped.** |

Both files are git-ignored. The `.data/` directory must exist before running Docker (it is created automatically if missing).

See [ADR-003: Database Strategy](/docs/adr/adr-003-database-strategy/) for the full rationale.

## Seed Data

When you run `docker:reset` or start with an empty dev DB, the seed script creates:

- 6 demo assets (checking account, savings account, apartment, home loan, two vehicles)
- Categories and tags reflecting a realistic European personal balance sheet
- 4 historical portfolio snapshots (January–April 2025) so the net worth chart has data immediately

Seed data is **idempotent** — running it twice does not duplicate records.

## Resetting the Dev Environment

```bash
npm run docker:reset
```

This deletes `strata-dev.db`, rebuilds Docker images with `--no-cache`, applies migrations, and re-seeds. Use this after migrations or when the dev DB state is unknown.

Your production data in `strata.db` is **never touched** by `docker:reset`.
