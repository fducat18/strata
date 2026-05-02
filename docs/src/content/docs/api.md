---
title: API Reference
description: How to access the Strata API documentation
---

> 🔌 **What can Strata do?** A REST API for managing assets, snapshots, categories, tags and backups — always documented live in Swagger UI.

Strata's API is documented live via **Swagger UI** — the authoritative, always-up-to-date reference for all endpoints, request/response schemas, and examples.

## Accessing Swagger

| Environment | Swagger URL |
|-------------|-------------|
| Docker (dev/reset) | [http://localhost:3000/swagger](http://localhost:3000/swagger) |
| Desktop App | [http://localhost:3456/swagger](http://localhost:3456/swagger) |

Swagger is enabled automatically in development mode and disabled in production builds (`ENABLE_SWAGGER=false`).

## API Base URL

All endpoints are prefixed with `/api/v1`.

## Key API Groups

| Group | Base Path | Description |
|-------|-----------|-------------|
| Assets | `/api/v1/assets` | Create, read, update, delete, dispose assets |
| Asset Snapshots | `/api/v1/assets/:id/snapshots` | Record asset values over time |
| Portfolio Snapshots | `/api/v1/portfolio-snapshots` | Record total net worth snapshots |
| Categories | `/api/v1/categories` | Hierarchical asset classification |
| Tags | `/api/v1/tags` | Flexible asset tagging |
| Asset Types | `/api/v1/asset-types` | Reference data (13 types) |
| Admin | `/api/v1/admin` | Backup, restore, health check |
| Version | `/api/v1/version` | Application version info |
