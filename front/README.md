# Strata Frontend

Astro 6 + React 19 + Tailwind v4 UI for the [Strata](../README.md) asset manager.

For pages, design system and data flow, see [Frontend](https://strata.ducatillon.net/docs/Frontend/) on the docs site.

## Prerequisites

- Node.js 20+
- npm 10+
- A running Strata backend (see [`../backend/README.md`](../backend/README.md))

## Quickstart

```bash
cd front
npm install
PUBLIC_API_URL=http://localhost:3000/api/v1 npm run dev
```

UI: <http://localhost:6543>

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Astro dev server with HMR |
| `npm run build` | Production build (output in `dist/`) |
| `npm run preview` | Preview the production build |
| `npm run check` | `astro check` (TS + Astro diagnostics) |
| `npm test` | Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright e2e tests (needs a running stack) |

## Environment variables

| Variable | Default | Notes |
|---|---|---|
| `PUBLIC_API_URL` | `http://localhost:3000/api/v1` | Backend base URL. **Baked into the client bundle at build time** — must be set before `npm run build` (or via `--build-arg PUBLIC_API_URL=...` for Docker). Changing it at runtime in a built artifact has no effect. |

> ⚠️ **Build-time vs runtime:** Astro inlines `PUBLIC_*` vars into the static client bundle when `astro build` runs. If you need a different API URL per environment, rebuild the image (compose passes the value through `services.front.build.args.PUBLIC_API_URL`).

## Where to read more

- Live docs: <https://strata.ducatillon.net/docs/Frontend/>
- Tech stack overview: <https://strata.ducatillon.net/docs/TechStack/>
