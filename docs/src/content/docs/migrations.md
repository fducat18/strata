---
title: "Database Migrations"
---


Strata uses **Prisma Migrate** for database schema management.

## Schema Location

The Prisma schema is at `backend/prisma/schema.prisma`. It defines all models, relations, and indexes.

## Current Migration History

The `init` migration creates the original accounting schema. Later migrations add schema changes, including `20260928120000_financing_scenarios`, which adds the standalone `financing_scenarios` table. There is **no `portfolio` table** — the schema never had one. Both `PortfolioSnapshot` and `FinancingScenario` are standalone records without accounting foreign keys.

## Common Commands

All commands run from `backend/`:

```bash
# Apply pending migrations (production/CI)
npx prisma migrate deploy

# Create a new migration after schema changes (development)
npx prisma migrate dev --name describe_your_change

# Reset database (drops + re-creates + seeds)
npx prisma migrate reset

# Generate Prisma Client (after schema changes)
npx prisma generate

# Seed the database
npx prisma db seed

# Open Prisma Studio (visual DB editor)
npx prisma studio
```

## Workflow

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your_change`
3. Prisma generates a SQL migration in `prisma/migrations/`
4. Review the generated SQL
5. Commit both the schema and migration files

## Seed Data

The seed entrypoint is `backend/prisma/seed.ts`, which dispatches by profile:

- **Development profile** (`STRATA_SEED_PROFILE=development`, default fallback):
  - 13 asset types
  - hierarchical categories
  - tags
  - demo assets
  - seeded snapshot history
- **Production profile** (`STRATA_SEED_PROFILE=production`):
  - 13 asset types
  - hierarchical categories
  - no demo assets/tags/snapshots

Run with:

```bash
npx prisma db seed
# Optional explicit override:
STRATA_SEED_PROFILE=production npx prisma db seed
```
