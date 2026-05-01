---
title: "Architecture"
---


Strata follows **Hexagonal Architecture** (Ports & Adapters) with four layers.

## Directory Structure

```
backend/src/
├── domain/              ← Pure TypeScript — no framework imports
│   ├── entities/        ← Business entities (Portfolio, Asset, etc.)
│   ├── ports/           ← Repository interfaces (abstract classes)
│   └── exceptions/      ← Domain-specific exceptions
├── application/         ← Use cases as @Injectable() services
│   └── services/        ← PortfolioService, AssetService, etc.
├── infrastructure/      ← Framework & persistence implementations
│   ├── prisma/          ← PrismaService, PrismaModule
│   └── repositories/    ← Prisma repository implementations
└── presentation/        ← HTTP layer
    ├── controllers/     ← NestJS @Controller() with Swagger decorators
    ├── dto/             ← Request DTOs (class-validator)
    │   └── responses/   ← Response DTOs (@ApiProperty)
    └── filters/         ← Domain exception → HTTP error mapping
```

## Layer Rules

| Layer | Can Import | Cannot Import |
|-------|-----------|---------------|
| Domain | Nothing (pure TS) | NestJS, Prisma, any framework |
| Application | Domain | Infrastructure, Presentation |
| Infrastructure | Domain, Application | Presentation |
| Presentation | Domain, Application | Infrastructure (via DI) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/assets` | List all assets |
| POST | `/api/v1/assets` | Create asset |
| GET | `/api/v1/assets/:id` | Get asset by ID |
| PUT | `/api/v1/assets/:id` | Update asset |
| DELETE | `/api/v1/assets/:id` | Delete asset |
| GET | `/api/v1/asset-snapshots` | List asset snapshots |
| POST | `/api/v1/asset-snapshots` | Create asset snapshot |
| DELETE | `/api/v1/asset-snapshots/:id` | Delete asset snapshot |
| GET | `/api/v1/portfolio-snapshots` | List all portfolio snapshots |
| GET | `/api/v1/portfolio-snapshots/current-value` | Compute current net worth |
| POST | `/api/v1/portfolio-snapshots` | Create snapshot (auto-computes value if omitted) |
| DELETE | `/api/v1/portfolio-snapshots/:id` | Delete portfolio snapshot |
| GET | `/api/v1/categories` | List categories |
| POST | `/api/v1/categories` | Create category |
| GET | `/api/v1/tags` | List tags |
| POST | `/api/v1/tags` | Create tag |
| GET | `/api/v1/admin/backup` | Export full backup (JSON) |
| POST | `/api/v1/admin/restore` | Restore from backup |

Swagger UI (dev only): `http://localhost:3000/swagger`

> **Note:** `PUBLIC_API_URL` is a **build-time argument** (not a runtime env var). It is baked into the frontend at `npm run build` time. Rebuild the frontend if the API URL changes.

## Dependency Injection

NestJS modules wire abstract ports to concrete implementations:

```typescript
// app.module.ts
{
  provide: IAssetRepository,        // abstract class (port)
  useClass: PrismaAssetRepository,  // concrete implementation
}
```

Controllers receive services via constructor injection. Services receive repository ports via constructor injection. The DI container resolves the full dependency graph.

## Frontend Architecture

```
front/src/
├── components/
│   ├── ui/              ← Reusable UI primitives (Button, Card, Table, etc.)
│   ├── layout/          ← AppShell, Sidebar, Header
│   ├── dashboard/       ← Dashboard-specific components
│   ├── assets/          ← Asset CRUD components
│   ├── categories/      ← Category tree components
│   ├── tags/            ← Tag management components
│   └── settings/        ← Settings & backup components
├── pages/               ← Astro page routes
├── layouts/             ← Astro layouts (MainLayout)
├── lib/                 ← API client, React Query hooks, utilities
└── styles/              ← Global CSS + Tailwind theme
```

The frontend uses **Astro** for routing and page rendering, with **React islands** (`client:load`) for interactive components. Data fetching uses **TanStack React Query** with typed hooks wrapping the Axios API client.

## Documentation Site (Astro Starlight)

The documentation lives in `docs/`. It is built with [Astro Starlight](https://starlight.astro.build/) and served as a static site via nginx. In development (`docker:dev`), it is available at `http://localhost:8001/docs/`. In production (`docker:prod`), it is served at `http://localhost:8001/docs/` as well — the docs image is rebuilt with the latest content on every deploy.

## Request tracing (X-Request-ID)

Backend HTTP requests pass through `RequestIdMiddleware` (`backend/src/infrastructure/middleware/request-id.middleware.ts`).

- If the client sends `X-Request-ID`, Strata reuses it.
- Otherwise, Strata generates one.
- The value is attached to the request context and echoed in response headers.
- Error filters include this ID in JSON error payloads for easier debugging and support.

This enables end-to-end correlation across browser logs, API logs, and error responses.

## Data Flow

```
User (Browser / Tauri Shell)
        ↓
    Astro + React Frontend (port 4321 in dev)
        ↓ HTTP/REST
    NestJS Backend (port 3000 in dev)
        ↓ Prisma ORM
    SQLite Database (strata-dev.db in dev / strata.db in prod)
```

## Dev vs Production Configuration

| | Development (`docker:dev`) | Production (`docker:prod`) |
|---|---|---|
| DB file | `strata-dev.db` | `strata.db` |
| Swagger UI | ✅ `http://localhost:3000/swagger` | ❌ disabled |
| NODE_ENV | `development` | `production` |
| Seed data | Demo assets seeded on first start | Real personal data |
| Version badge | Shows `DEV` badge | Shows clean version |
| Reset DB | `npm run docker:reset` | ⚠️ Manual only (backup first!) |
