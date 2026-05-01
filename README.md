![Strata logo](assets/logo.avif)

[![CI](https://github.com/francoiducat/strata/actions/workflows/main-backend-ci.yml/badge.svg)](https://github.com/francoiducat/strata/actions/workflows/main-backend-ci.yml)
[![codecov](https://codecov.io/gh/francoiducat/strata/graph/badge.svg)](https://codecov.io/gh/francoiducat/strata)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Docs](https://img.shields.io/website?url=https%3A%2F%2Fstrata.ducatillon.net%2Fdocs%2F&label=docs)](https://strata.ducatillon.net/docs/)

# Strata — Collect. Track. Grow.

Strata is a self-hosted personal asset manager that tracks your full net worth — bank accounts, investments, real estate, vehicles, collectibles, anything — across portfolios, snapshots, categories and tags. Backend is a NestJS + Prisma API over SQLite; frontend is an Astro + React + Tailwind UI; both ship in Docker so a fresh laptop is always one command away from a working install.

📚 **Live documentation:** <https://strata.ducatillon.net/docs/>

## Repository map

| Path | What lives here |
|---|---|
| [`backend/`](backend/) | NestJS 11 API, Prisma schema & migrations, Jest unit + e2e tests |
| [`front/`](front/) | Astro 6 + React 19 + Tailwind v4 UI, Vitest + Playwright tests |
| [`docs/`](docs/) | Astro Starlight documentation site (deployed to <https://strata.ducatillon.net/docs/>) |
| [`.bruno/Strata/`](.bruno/Strata/) | Bruno API collection — every endpoint, ready to run |
| [`docker-compose.yml`](docker-compose.yml) | Backend + frontend + docs, ready to `up` |
| `src-tauri/` | _(coming)_ Tauri desktop wrapper |

## 5-minute quickstart (Docker)

Requires Docker Desktop (or Docker + Compose v2).

```bash
git clone https://github.com/francoiducat/strata.git
cd strata
docker-compose up --build
```

| Service | URL |
|---|---|
| Backend API | <http://localhost:3000/api/v1> |
| Swagger UI | <http://localhost:3000/swagger> |
| Frontend | <http://localhost:4321> |
| Docs | <http://localhost:8001> |

The SQLite database persists in `backend/.data/strata.db`. To start fresh, delete that file (or the whole directory) and bring the stack back up.

## Local development

Each package has its own README with the full command table:

- **Backend** — see [`backend/README.md`](backend/README.md)
- **Frontend** — see [`front/README.md`](front/README.md)
- **Docs site** — `cd docs && npm install && npm run dev`

For architecture, data model, migrations workflow and recovery procedures, read the [docs site](https://strata.ducatillon.net/docs/).

## API exploration

Open the [Bruno](https://www.usebruno.com/) collection in `.bruno/Strata/` for a ready-to-run set of requests against `http://localhost:3000/api/v1`.

## License

Strata is released under the Apache-2.0 License. See [`LICENSE`](LICENSE).

## Community & governance

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
