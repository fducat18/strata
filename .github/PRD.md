---
title: Strata — Product Requirements Document
version: 0.1
last_updated: 2026-03-06
status: active
doc_type: prd
audience: ai-agent, engineering
---

# Strata — PRD

## 1. Purpose

Single source of truth for AI agents and contributors. For deep-dive documentation, follow the links in section 9.

---

## 2. Problem Statement

Most personal finance / inventory apps are domain-specific: they track investments OR collections OR household inventory. Users who own diverse assets — financial, physical, collectibles, personal property, liabilities — have no single tool to see their complete net worth and organise everything with flexible taxonomy.

---

## 3. Product Summary

**Strata** is a universal asset tracking backend. It lets you catalogue *anything you own or owe*, attach values over time, organise with hierarchical categories and flat tags, and compute net worth across all asset types.

> "Your wealth isn't just money — it's everything you value."

---

## 4. Target Personas

| Persona | Core need |
|---------|-----------|
| **Investor** | Track stocks, crypto, real estate, cash accounts; see total net worth in one view |
| **Collector** | Catalogue LEGO, books, art, vintage items with acquisition cost and current value |
| **Homeowner** | Manage household inventory (furniture, electronics, heirlooms) with valuations |
| **Fashion enthusiast** | Organise wardrobe by type/season/occasion, track purchase price vs. current value |
| **Anyone** | Know what they own and what it is worth |

---

## 5. Core Domain Concepts

### 5.1 Asset Types (accounting classification, 1 per asset)

Fixed reference list (seeded via Alembic migration):

`CHECKING_ACCOUNTS` · `SAVINGS_ACCOUNTS` · `CASH` · `REAL_ESTATE` · `LOAN` · `STOCKS_AND_FUNDS` · `CRYPTO` · `PERSONAL_ITEMS` · `COLLECTIONS` · `OTHER`

Users may also create custom types.

### 5.2 Categories (WordPress-style, many-to-many)

- Hierarchical: `Real Estate > Residential > Apartments`
- Cross-cutting: `Income Generating Assets`, `Primary Residence`
- An asset can belong to **multiple** categories simultaneously.

### 5.3 Tags (flat labels, many-to-many)

Additional metadata for filtering: `paris`, `vintage`, `unopened`.

### 5.4 Transactions

| Type | Meaning |
|------|---------|
| `ACQUIRE` | Buying / receiving (increases quantity) |
| `DISPOSE` | Selling / giving away (decreases quantity) |
| `ADJUST` | Manual correction |

Liabilities use negative `unit_price` on `ACQUIRE` (e.g., taking a loan).

### 5.5 Snapshots

- **AssetSnapshot**: manually entered value at a point in time.
- **PortfolioSnapshot**: auto-calculated total across all assets at a point in time.
- Portfolio valuation uses the **latest** snapshot per asset.

### 5.6 Net Worth formula

```
Net Worth = Σ (latest AssetSnapshot.value for each asset)
```

Positive assets increase it; liabilities (LOAN, MORTGAGE) have negative values and decrease it.

---

## 6. Functional Requirements

### Must Have

- [ ] CRUD for **Portfolio** (name, base_currency)
- [ ] CRUD for **Asset** (linked to a portfolio and asset type)
- [ ] CRUD for **AssetSnapshot** (value + observed_at per asset)
- [ ] CRUD for **Transaction** (ACQUIRE / DISPOSE / ADJUST)
- [ ] CRUD for **Category** with hierarchical parent/child support
- [ ] CRUD for **Tag** and asset↔tag association
- [ ] Read-only **AssetType** reference data (seeded)
- [ ] Portfolio total value computation (latest snapshot per asset)

### Should Have

- [ ] Filter assets by category, tag, asset type, disposed flag
- [ ] Portfolio snapshot recording and history
- [ ] Asset disposal workflow (set `disposed = true`)

### Out of Scope (current version)

- Real-time market price feeds
- Multi-user / authentication
- Frontend / mobile clients

---

## 7. Technical Constraints

| Area | Decision |
|------|----------|
| **Backend language** | TypeScript (Node 22) |
| **Backend framework** | NestJS + class-validator |
| **ORM** | Prisma |
| **Migrations** | Prisma Migrate |
| **Database** | SQLite (default); Prisma supports PostgreSQL/MySQL |
| **Dependency mgmt** | npm |
| **Architecture** | Hexagonal (Ports & Adapters) + DDD |
| **Frontend** | Astro 6 + React 19 + Tailwind v4 (SSR via @astrojs/node) |
| **Desktop** | Tauri v2 (Rust shell, Node sidecars) |
| **Docs site** | Astro Starlight (static) |
| **Container** | Docker / Docker Compose (single file, profiles) |
| **Versioning** | git tag (`git describe --tags --dirty`) |

---

## 8. Architecture Rules (for agents modifying code)

1. **Domain layer is pure** — no NestJS, Prisma, or I/O imports inside `domain/`.
2. **Use cases orchestrate** — business logic lives in `application/`, not in controllers.
3. **Adapters are thin** — controllers parse request → call use case → map result to response.
4. **Validation is layered**:
   - Shape / types → class-validator DTOs (presentation layer)
   - Existence checks → use case
   - Business invariants → domain entity constructors / methods
   - Data integrity → Prisma constraints; catch `PrismaClientKnownRequestError`
5. **Schema changes** require a Prisma migration (`npx prisma migrate dev --name <change>`).
6. **Never hardcode secrets** — use environment variables / `.env`.
7. **Imports use `.js` extensions** — `nodenext` module resolution (Jest config strips for tests).

---

## 9. Codebase Map

| Concern | Path |
|---------|------|
| Domain entities | `backend/src/modules/<context>/domain/` |
| Repository ports | `backend/src/modules/<context>/domain/ports/` |
| Use cases | `backend/src/modules/<context>/application/` |
| Controllers / DTOs | `backend/src/modules/<context>/presentation/` |
| Persistence (Prisma) | `backend/src/modules/<context>/infrastructure/` |
| Prisma schema | `backend/prisma/schema.prisma` |
| DB migrations | `backend/prisma/migrations/` |
| Unit tests | next to source (`*.spec.ts`) |
| E2E tests | `backend/test/*.e2e-spec.ts` |
| App entry | `backend/src/main.ts` |
| Frontend | `front/src/` (pages, components, stores, lib) |
| Desktop shell | `src-tauri/src/lib.rs` |
| Docs site | `docs/src/content/docs/*.md` |

**Entities:** `Portfolio` · `Asset` · `AssetType` · `AssetSnapshot` · `PortfolioSnapshot` · `Transaction` · `Category` · `Tag`

**Repository ports:** `IAssetRepository` · `IPortfolioRepository` · `ICategoryRepository` · `IAssetSnapshotRepository` · `IPortfolioSnapshotRepository` · `IAssetTypeRepository` · `ITagRepository` · `ITransactionRepository`

---

## 10. API Surface (current)

Base URL: `http://localhost:3000/api/v1`  
Swagger UI: `http://localhost:3000/swagger` (dev profile only)

| Domain | Controller |
|--------|-----------|
| Assets | `backend/src/modules/asset/presentation/asset.controller.ts` |
| Portfolios | `backend/src/modules/portfolio/presentation/portfolio.controller.ts` |
| Health / Version | `backend/src/modules/system/presentation/` |

---

## 11. Data Model Quick Reference

See [datamodel.md](../docs/src/content/docs/datamodel.md) for ER and class diagrams.

Key relationships:
- `Portfolio` 1→N `Asset`
- `Asset` N→1 `AssetType`
- `Asset` N→N `Category` (via `ASSET_CATEGORY`)
- `Asset` N→N `Tag` (via `ASSET_TAG`)
- `Asset` 1→N `Transaction`
- `Asset` 1→N `AssetSnapshot`
- `Portfolio` 1→N `PortfolioSnapshot`

---

## 12. Dev Commands

```bash
# Docker (single compose, profiles)
docker compose up --build                   # dev profile (default)
docker compose --profile prod up --build    # prod profile

# Backend locally (cd backend)
npm install
npx prisma migrate dev
npm run start:dev      # :3000

# Backend tests
npm test               # unit
npm run test:e2e       # e2e
npm run lint:ci        # zero-error gate

# Schema changes
npx prisma migrate dev --name <describe-change>

# Frontend (cd front)
npm install && npm run dev   # :4321
npm test                     # Vitest
npm run test:e2e             # Playwright

# Desktop (repo root)
./scripts/tauri-dev.sh       # dev with hot reload
./scripts/tauri-build.sh     # produce .app
```

---

## 13. Acceptance Criteria (agent checklist)

When implementing or modifying a feature, verify:

- [ ] Domain entity stays pure (no NestJS / Prisma imports)
- [ ] Use case has a corresponding `*.spec.ts` unit test
- [ ] Controller is thin (parse → use case → response)
- [ ] DTO with class-validator validates input at the boundary
- [ ] Any DB schema change has a Prisma migration
- [ ] `npm test`, `npm run test:e2e`, and `npm run lint:ci` pass
- [ ] Frontend `npm test` + `npm run test:e2e` pass when UI changed
- [ ] No secrets committed

---

## 14. Reference Documentation

| Doc | Content |
|-----|---------|
| [StrataApp.md](../docs/docs/StrataApp.md) | Product overview, personas, philosophy |
| [Features.md](../docs/docs/Features.md) | Feature list |
| [MentalModel.md](../docs/docs/MentalModel.md) | Asset Type / Category / Tag mental model |
| [DataModel.md](../docs/docs/DataModel.md) | ER diagram + class diagram |
| [Architecture.md](../docs/docs/Architecture.md) | Hexagonal architecture, directory structure |
| [Validation.md](../docs/docs/Validation.md) | Layered validation strategy with examples |
| [UseCases.md](../docs/docs/UseCases.md) | Concrete examples (bank account, wardrobe, real estate…) |
| [Alembic.md](../docs/docs/Alembic.md) | Migration workflow |
| [TechStack.md](../docs/docs/TechStack.md) | Full tech stack list |
| [QuickStart.md](../docs/docs/QuickStart.md) | Setup and run instructions |
