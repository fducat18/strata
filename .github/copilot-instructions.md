# Strata — Copilot / AI Agent Instructions

Strata is a personal asset-tracking app: a **NestJS + Prisma (SQLite)** backend, an **Astro + React + Tailwind v4** frontend, a **Tauri v2 (Rust)** desktop wrapper that spawns both as sidecars, and an **Astro Starlight** documentation site. It tracks portfolios, assets, snapshots, transactions, categories and tags to compute net worth.

## Layout

```
backend/       NestJS (hexagonal: domain/ application/ infrastructure/ presentation/)
front/         Astro 6 + React 19 + Tailwind v4 (Zustand + react-query)
src-tauri/     Tauri v2 desktop shell (Rust); spawns backend (port 3456) + front (port 4321)
docs/          Astro Starlight docs site (Markdown-first)
scripts/       Repo-wide Node scripts (version.mjs, sync-readme.mjs, tauri-*.sh)
issues/        Lightweight in-tree tracker for deferred work
.bruno/Strata/ Bruno API request collection
```

All TypeScript packages use `nodenext` module resolution — **relative imports must include `.js`** (Jest `moduleNameMapper` strips it for tests).

## Build & Test

```bash
# Backend (cd backend)
npm install
npm run start:dev           # ts-node + watch on :3000
npm test                    # Jest unit (~69 tests)
npm run test:e2e            # Jest e2e under test/  (~48 tests)
npm run lint:ci             # zero-error gate
npx prisma migrate dev --name <change>   # after schema.prisma edit

# Frontend (cd front)
npm install
npm run dev                 # Astro on :4321
npm test                    # Vitest (~65 tests)
npm run test:e2e            # Playwright e2e
npm run build               # SSR via @astrojs/node

# Docs (cd docs)
npm install
npm run dev                 # Starlight on :4321
npm run build               # static → dist/

# Desktop (repo root)
./scripts/tauri-dev.sh      # tauri dev (system Node required)
./scripts/tauri-build.sh    # produces .app bundle

# Docker (repo root, single compose with profile)
docker compose up --build                  # dev profile (default)
docker compose --profile prod up --build   # prod profile
```

## Architecture

**Backend** uses hexagonal layering. **No framework imports allowed inside `domain/`**.

```
backend/src/
  modules/<bounded-context>/
    domain/         entities (plain TS), value objects, repository ports
    application/    use cases (one class per use case, .execute())
    infrastructure/ Prisma repositories implementing domain ports
    presentation/   NestJS controllers, DTOs, swagger decorators
```

**DI pattern**: each module declares providers with `useClass`/`useFactory`; controllers depend on use case classes; use cases depend on repository ports (string token bound to Prisma impl).

**Validation layering** (apply in this order):
1. Shape/types → class-validator on DTOs at the controller boundary
2. Existence → use case checks via repositories
3. Invariants → enforced in domain entity constructors / methods
4. Integrity → Prisma constraints; catch `PrismaClientKnownRequestError`

**Error mapping**: domain exceptions live in `domain/exceptions/`; an `HttpExceptionFilter` (or per-domain filter) maps them to HTTP codes (typically 404 / 409 / 422).

**Frontend** keeps server state in `react-query` and ephemeral UI state in **Zustand** stores under `front/src/stores/`. SSR pages live in `front/src/pages/`; islands live in `front/src/components/`.

**Tauri** spawns the NestJS backend on `127.0.0.1:3456` and the Astro SSR front on `127.0.0.1:4321` as sidecars. SQLite lives in `~/Library/Application Support/Strata/strata.db` (prod) or `Strata-Dev/` (dev). System Node is required (bundling deferred — see `issues/bundle-node-runtime.md`).

## Versioning (single source of truth: git tag)

`scripts/version.mjs` runs `git describe --tags --dirty --always`:
- `1.2.3` (clean tag) → **production**
- anything with `-dirty`, `-g`, or `0.0.0-dev` fallback → **development**

Build steps embed the result into the backend (`/api/v1/version`), the frontend footer/About, and the Tauri window title. To release: `git tag vX.Y.Z && git push --tags`.

## Decimal precision (financial data)

| Field type | Prisma | TS | Why |
|---|---|---|---|
| Monetary amounts | `Decimal @db.Decimal(20, 2)` | `Prisma.Decimal` | EUR/USD precision |
| Asset quantities | `Decimal @db.Decimal(20, 8)` | `Prisma.Decimal` | BTC satoshi precision |

**Never use `number`/`float` for money.** Convert to/from `Decimal` at the persistence boundary.

## Testing conventions

- **Unit tests** (`*.spec.ts` next to source): no real DB; mock repositories with `jest-mock-extended` or hand-written fakes.
- **E2E tests** (`backend/test/*.e2e-spec.ts`): full Nest app + an in-memory SQLite via Prisma; reset between tests; `app.dependency_overrides`-style overrides via `Test.createTestingModule({...}).overrideProvider(TOKEN)`.
- **Frontend e2e**: Playwright; Vitest config in `vitest.config.ts`.

## Endpoints (under `/api/v1`)

| Method | Path |
|---|---|
| GET/POST | `/portfolios` |
| GET/DELETE | `/portfolios/:id` |
| GET/POST | `/portfolios/:id/snapshots` |
| GET/POST | `/assets` |
| GET/PUT/DELETE | `/assets/:id` |
| GET | `/health` |
| GET | `/version` |

Use the Bruno collection at `.bruno/Strata/` for ready-to-run requests.

## Config

- `DATABASE_URL` controls the DB (defaults to `backend/prisma/dev.db` in dev, `~/Library/Application Support/Strata*/strata.db` in the desktop app).
- `backend/.env` for local overrides (loaded by NestJS `ConfigModule`). Never commit secrets.
- Docker compose mounts a host volume for SQLite persistence in both profiles.

## Doc map

- Live docs: <https://strata.ducatillon.net/docs/>
- Source: `docs/src/content/docs/*.md`
- Recovery / backup playbooks: `Recovery.md`, `Backup.md`
- Versioning philosophy: `Versioning.md`
- Desktop app deep-dive: `DesktopApp.md`
