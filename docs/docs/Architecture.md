# Architecture

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
│   ├── portfolios/      ← Portfolio CRUD components
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

## Data Flow

```
Browser → Astro Page → React Component → React Query Hook
                                              ↓
                                         API Client (Axios)
                                              ↓
                                     NestJS Controller
                                              ↓
                                     Application Service
                                              ↓
                                     Repository Port (abstract)
                                              ↓
                                     Prisma Repository (concrete)
                                              ↓
                                         SQLite DB
```