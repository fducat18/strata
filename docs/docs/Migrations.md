# Database Migrations

Strata uses **Prisma Migrate** for database schema management.

## Schema Location

The Prisma schema is at `backend/prisma/schema.prisma`. It defines all models, relations, and indexes.

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

The seed script at `backend/prisma/seed.ts` populates:

- **13 asset types** (Checking Account, Savings, Stocks, Crypto, Real Estate, etc.)
- **20+ categories** organized hierarchically (Banking, Investments, Real Estate, etc.)
- **13 tags** (high-yield, tax-advantaged, retirement, etc.)
- **1 demo portfolio** (My Portfolio, EUR)

Run with: `npx prisma db seed`
