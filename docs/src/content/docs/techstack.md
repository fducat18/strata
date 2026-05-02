---
title: "Tech Stack"
---


## Backend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Runtime | Node.js 22+ | Server runtime |
| Framework | NestJS 11 | HTTP framework with DI |
| Language | TypeScript 5 | Type-safe development |
| ORM | Prisma | Database access & migrations |
| Database | SQLite | Embedded relational database |
| Validation | class-validator + class-transformer | DTO validation |
| API Docs | @nestjs/swagger | OpenAPI/Swagger generation |
| Testing | Jest + Supertest | Unit + E2E tests |

## Frontend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | Astro 6 | Static-first web framework |
| UI Library | React 19 | Interactive components |
| Styling | Tailwind CSS 4 | Utility-first CSS |
| Components | shadcn/ui-inspired | Accessible UI primitives |
| Charts | Recharts | Data visualization |
| Data Fetching | TanStack React Query | Server state management |
| HTTP Client | Axios | API communication |
| Testing | Vitest + Playwright | Unit + E2E tests |

## Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Containers | Docker + docker-compose | Development & deployment |
| API Collection | Bruno | API testing |
| Documentation | Astro Starlight | Developer docs |
| CI/CD | GitHub Actions | Automated testing |

## Desktop App

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Shell | Tauri v2 (Rust) | Native macOS window, system webview |
| Sidecar | NestJS + Astro | Backend and frontend spawned as child processes |
| Data dir | ~/Library/Application Support/Strata/ | Isolated SQLite for real data |

## Documentation

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | Astro 6 + Starlight 0.38 | Static docs site with built-in search |
| Search | Pagefind | Zero-JS client-side search, built at compile time |
| Diagrams | Mermaid.js | Architecture and data flow diagrams |
| Serving | nginx | Lightweight static file serving |

## Architecture Principles

- **Hexagonal Architecture** (Ports & Adapters) — domain logic is isolated from frameworks
- **Domain-Driven Design** — entities, value objects, repository interfaces
- **Dependency Injection** — NestJS module system wires implementations to abstractions
- **Layered Validation** — DTO → use case → domain → database
