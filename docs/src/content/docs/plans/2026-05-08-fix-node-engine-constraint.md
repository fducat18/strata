---
title: "2026-05-08 — Remove better-sqlite3 adapter + relax Node engine to >=22 + always-on Swagger"
description: Eliminate native C++ ABI constraint, support Node >=22, and simplify Swagger setup.
---

## Context

The project ran on Node 22 exclusively due to `better-sqlite3`, a native C++ SQLite adapter with Node ABI binding. When running on a machine with Node 26 (or any version other than 22), two hard-failure layers fired:

1. `backend/.npmrc engine-strict=true` + `engines.node: "22.x"` → `npm install` refused to run at all.
2. `backend/src/main.ts` → runtime check at startup that called `process.exit(1)` if Node ≠ 22.

Additionally, Swagger was conditionally disabled in the `docker:prod` profile via `ENABLE_SWAGGER=false`, adding unnecessary complexity — it should always be available.

## Decision

### Remove `@prisma/adapter-better-sqlite3`

The `better-sqlite3` driver adapter was opted-in for its synchronous, high-performance SQLite access. However, the performance benefit is irrelevant for a personal asset-tracking app, and the native ABI binding creates fragility: the module must be recompiled for each Node.js ABI version, and `npm install` failures cascade into broken dev workflows.

**Classic Prisma SQLite** (the Prisma Rust query engine binary) is platform-specific (darwin-arm64, linux-amd64, etc.) but entirely Node-version-agnostic. This removes the ABI constraint permanently.

### Relax Node engine to `>=22`

The project targets Node 22 LTS as the recommended/tested version (`.nvmrc` still specifies `22`; Docker still uses `node:22-alpine`). But blocking newer LTS versions at the npm level is unnecessary. The engine constraint is relaxed to `>=22`.

### Always-on Swagger

Swagger is a useful tool for development, debugging, and API exploration. Disabling it in production adds complexity without a clear benefit (Strata is a personal/local app, not a public API). The `shouldEnableSwagger()` conditional and `ENABLE_SWAGGER` env var are removed.

## Important Discovery

During implementation, it was discovered that **Prisma 7 requires a driver adapter** for all SQLite connections. The `PrismaClientOptions` type only accepts `adapter` or `accelerateUrl` — the classic "built-in" Prisma SQLite path (without adapters) was removed in Prisma 7.

Therefore `@prisma/adapter-better-sqlite3` is kept. The key insight is that the original problem was **not** that `better-sqlite3` is incompatible with Node 26 — it is perfectly compatible once `npm install` is allowed to run and rebuild it for the correct Node ABI. The actual culprits were:

1. `engine-strict=true` in `.npmrc` — blocked `npm install` on any Node ≠ 22, so the Node 22 binary was permanently stuck
2. `engines.node: "22.x"` — Node 26 was rejected at the npm level before any install could happen

## Changes

| File | Change |
|---|---|
| `backend/package.json` | Engine `"22.x"` → `">=22"` (adapter kept as-is) |
| `backend/.npmrc` | `engine-strict=true` → `engine-strict=false` |
| `backend/src/main.ts` | Removed Node 22 runtime gate; removed `shouldEnableSwagger()`, Swagger always on |
| `package.json` (root) | Removed `ENABLE_SWAGGER=false` from `docker:prod` |
| `docker-compose.yml` | Removed `ENABLE_SWAGGER` env var + updated comment |
| `scripts/check-prereqs.mjs` | `nodeVersion === 22` → `nodeVersion >= 22` |
| `docs/src/content/docs/dev-setup.md` | Updated Node requirement + Swagger always-on note |

## Trade-offs

- **`better-sqlite3` adapter kept**: Prisma 7 removed the "classic built-in" SQLite path — a driver adapter is mandatory. `better-sqlite3` remains the right choice for local SQLite; it works on any Node >=22 as long as `npm install` is allowed to run (which `engine-strict=false` now ensures).
- **Swagger in prod**: No security concern for a local/personal app. If needed in the future, an `ENABLE_SWAGGER` env var can be reintroduced.
