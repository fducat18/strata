# Strata Backend

NestJS 11 + Prisma 6 + SQLite API for the [Strata](../README.md) asset manager.

For architecture (hexagonal, ports & adapters), data model and validation strategy, see the [docs site](https://strata.ducatillon.net/docs/).

## Prerequisites

- Node.js 20+
- npm 10+

## Quickstart

```bash
cd backend
npm install
cp .env.example .env 2>/dev/null || echo 'DATABASE_URL="file:./.data/strata.db"' > .env
mkdir -p .data
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

API: <http://localhost:3000/api/v1> · Swagger UI: <http://localhost:3000/swagger>

## Commands

| Command | Purpose |
|---|---|
| `npm run start` | Run the compiled app (after `npm run build`) |
| `npm run start:dev` | Watch-mode dev server (auto reload) |
| `npm run start:prod` | Production process (`node dist/main`) |
| `npm run build` | Compile TypeScript via `nest build` |
| `npm run lint` | ESLint with autofix |
| `npm run format` | Prettier write |
| `npm test` | Jest unit tests |
| `npm run test:cov` | Jest unit tests with coverage |
| `npm run test:e2e` | Supertest e2e suite |
| `npx prisma migrate dev --name <change>` | Create + apply a new migration locally |
| `npx prisma migrate deploy` | Apply pending migrations (CI / prod / containers) |
| `npx prisma migrate reset` | Drop, re-create and re-seed the DB |
| `npx prisma generate` | Regenerate the typed Prisma client |
| `npx prisma db seed` | Run `prisma/seed.ts` (asset types, categories, tags, demo portfolio) |
| `npx prisma studio` | Visual DB editor at <http://localhost:5555> |

## Configuration

`DATABASE_URL` is the only required env var. Defaults to `file:./.data/strata.db` (SQLite). Set it in `backend/.env`; Docker Compose passes `file:/app/.data/strata.db`.

## Where to read more

- Live docs: <https://strata.ducatillon.net/docs/> — Architecture, Data Model, Migrations, Validation
- Source layout: `src/{domain,application,infrastructure,presentation}/`
- Migrations: `prisma/migrations/`
- Bruno API collection: `../.bruno/Strata/`
