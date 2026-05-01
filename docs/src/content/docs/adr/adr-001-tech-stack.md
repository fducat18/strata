---
title: "ADR-001: Technology Stack"
description: Technology choices and rationale for the Strata stack.
---

# ADR-001: Technology Stack

**Status:** Accepted  
**Date:** 2024

---

## Context

Strata is a personal, single-user, local-first asset tracker. The primary constraints are:

- Must run as a desktop application on macOS (no always-on server required)
- Developer-owned SQLite file doubles as a full backup
- Small, auditable codebase that one person can maintain long-term
- Strong TypeScript end-to-end to catch regressions quickly

---

## Decisions

### Backend: NestJS over FastAPI (Python)

**Chosen:** NestJS (TypeScript)  
**Rejected:** FastAPI (Python)

**Rationale:** The project started with FastAPI but was migrated to NestJS to achieve full-stack TypeScript. With a single developer, context-switching between Python and TypeScript creates overhead. NestJS provides solid dependency injection, decorator-based routing, and first-class Swagger integration—all idiomatic in TypeScript.

### Backend architecture: Hexagonal over NestJS Feature Modules

**Chosen:** Hexagonal / Ports-and-Adapters in `domain/application/infrastructure/presentation/`  
**Rejected:** Standard NestJS `users/users.module.ts` feature modules

**Rationale:** Hexagonal architecture makes the core domain logic completely free of framework imports. Each layer has a single responsibility and can be tested in isolation. The app is simple enough that hexagonal does not add meaningful boilerplate complexity, but the clear layering prevents accidental coupling between persistence logic and business rules.

### ORM: Prisma over TypeORM / Drizzle

**Chosen:** Prisma 7  
**Rejected:** TypeORM, Drizzle

**Rationale:** Prisma provides an excellent schema-first workflow, auto-generated type-safe client, and mature migration tooling. TypeORM's decorator-heavy approach conflicts with hexagonal architecture (domain entities would need ORM decorators). Drizzle is promising but was less mature when the decision was made. Prisma 7's `prisma.config.ts` cleanly separates the DB URL from the schema.

### Database: SQLite over PostgreSQL

**Chosen:** SQLite via `better-sqlite3`  
**Rejected:** PostgreSQL

**Rationale:** Strata is a personal, single-user app. A SQLite file is the database, the backup, and the portable export all in one. There is no concurrent write workload. SQLite eliminates the need for a database server process and simplifies Docker setup to a single container.

### Frontend: Astro + React over Next.js / Remix

**Chosen:** Astro (SSR) + React islands  
**Rejected:** Next.js, Remix

**Rationale:** Astro produces small, fast pages with explicit hydration boundaries. For a data-driven SPA, the React islands (`client:load`) pattern still works—most pages are fully interactive. Astro's simpler mental model (pages = files, no `/app` router complexity) reduces boilerplate.

### Desktop: Tauri over Electron

**Chosen:** Tauri v2  
**Rejected:** Electron

**Rationale:** Tauri uses the OS webview (WKWebView on macOS) rather than bundling Chromium, resulting in dramatically smaller bundles (~10 MB vs ~200 MB). Rust-based system shell is more secure than Node.js-based Electron main process. The Tauri sidecar mechanism allows spawning the NestJS and Astro processes as child processes of the Tauri binary.

---

## Consequences

- All code is TypeScript end-to-end (backend + frontend + scripts)
- SQLite file portability enables simple backup strategy (see ADR-003)
- Tauri binary ships both NestJS and Astro pre-built
- Hexagonal architecture requires explicit mappers at each boundary (Prisma model ↔ domain entity)
