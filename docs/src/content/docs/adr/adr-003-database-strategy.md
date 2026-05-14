---
title: "ADR-003: Dev vs Production Database Strategy"
description: How Strata separates development/demo data from real user data.
---

**Status:** Accepted  
**Date:** 2024

---

## Context

Strata is a personal asset tracker. It stores real financial data (account balances, property values, loan amounts). The risk of accidentally modifying or deleting real data during development is unacceptable. At the same time, the development workflow benefits from rich, realistic seed data for testing UI components and API behaviour.

---

## Decision

## Decision Summary

| Approach | Pros | Cons |
|----------|------|------|
| **Single DB file** | Simple; no mistakes possible | Risk of seeding over real data |
| **Two DB files: dev + prod (chosen)** | Complete isolation; `docker:reset` is always safe | Two files to document and manage |
| **DB flag / schema separation** | One file | Complex queries; risk of data leak between schemas |

**Two SQLite files, never mixed:**

| File | Used when | Contains |
|------|-----------|----------|
| `backend/.data/strata-dev.db` | `docker:dev`, `docker:reset`, automated tests | Seeded demo data (BNP Checking, Livret A, Paris Apt, BNP Loan, Toyota, Kangoo) |
| `backend/.data/strata.db` | `docker:prod`, Tauri desktop app | Real user data — never touched by scripts |

The active database is selected by the `DB_FILE` environment variable (default: `strata-dev.db` in development, `strata.db` in production). The docker-compose file reads this variable, and the NestJS `DATABASE_URL` is constructed at runtime from `DB_FILE`.

---

## Seed Data Philosophy

Demo seed data (`prisma/seed.ts`) is designed to be:

- **Realistic** — asset names and values reflect a plausible European personal balance sheet
- **Complete** — covers all supported asset types (checking, savings, real estate, loan, vehicles)
- **Positive and negative** — includes a loan (liability) to demonstrate net worth = assets − liabilities
- **Idempotent** — seeding twice does not duplicate data (upsert by unique fields)

Current demo assets (total net worth ≈ €239,200):

| Asset | Type | Value |
|-------|------|-------|
| BNP Compte Courant | CHECKING_ACCOUNT | €4,250 |
| Livret A | SAVINGS_ACCOUNT | €22,950 |
| Appartement Paris | REAL_ESTATE | €385,000 |
| Crédit Immo BNP | LOAN | −€180,000 |
| Toyota Yaris | VEHICLE | €5,000 |
| Renault Kangoo | VEHICLE | €2,000 |

---

## Workflow Commands

| Command | DB used | What happens |
|---------|---------|--------------|
| `npm run docker:dev` | `strata-dev.db` | Generates version (DEV), layer-cached build, starts Docker. **Keeps** existing dev DB (demo data + any manual additions). |
| `npm run docker:reset` | `strata-dev.db` | Destroys dev DB, rebuilds images from scratch, **re-seeds** fresh demo data. Use after migrations or when DB state is unknown. |
| `npm run docker:prod` | `strata.db` | Production mode. Swagger disabled. Real data never touched by seed. |

---

## Backup Strategy

Real data (`strata.db`) is a portable SQLite file. Three backup mechanisms:

1. **File copy** — copy `backend/.data/strata.db` anywhere (macOS Time Machine, cloud sync)
2. **JSON export** — Settings → Export Backup in the frontend (exports all entities as JSON)
3. **JSON import** — Settings → Import Backup in the frontend (replaces or merges data)

See the [Backup & Recovery](/docs/backup/) page for the complete procedure.

---

## Consequences

- Developers can run `docker:reset` freely without fear of losing real data
- The `.data/` directory is git-ignored — no accidental commit of database files
- Switching between dev and prod requires only changing the `DB_FILE` env var (or running the appropriate `npm run` command)
- In the Tauri desktop app, the database lives in `~/Library/Application Support/Strata/strata.db` (not in the repo)
