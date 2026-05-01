---
title: "Frontend"
---


The Strata frontend is built with **Astro** and **React**, providing a clean, reactive asset management interface.

## Tech Stack

- **Astro 6** — page routing and SSR
- **React 19** — interactive UI components
- **Tailwind CSS 4** — utility-first styling
- **shadcn/ui-inspired** — accessible component primitives
- **Recharts** — charts and data visualization
- **TanStack React Query** — server state management
- **Axios** — HTTP client

## Pages

| Route | Description |
|-------|------------|
| `/` | Dashboard — net worth chart, allocation chart, recent snapshots |
| `/assets` | Asset list with search, filters, create |
| `/assets/:id` | Asset detail — snapshots, transactions, tags, categories |
| `/categories` | Category tree with CRUD |
| `/tags` | Tag list with CRUD |
| `/settings` | Theme toggle, backup export/import |

## Portfolio Snapshots

The dashboard's **Take Snapshot** button (or `POST /api/v1/portfolio-snapshots`) computes the current net worth by summing the latest `AssetSnapshot.value` for every non-disposed asset and saves the result as a `PortfolioSnapshot`. This record feeds the net worth timeline chart.

`GET /api/v1/portfolio-snapshots/current-value` returns the live computed value without persisting a snapshot — useful for displaying the current total in the UI without creating a new data point.

## Design System

- **Dark + Light themes** with system preference detection
- CSS custom properties for all colors via Tailwind `@theme`
- Consistent component API across all UI primitives
- Responsive layout with collapsible sidebar

## Data Flow

Pages are Astro routes that render React components as interactive islands:

```
Astro Page (.astro) → React Component (client:load)
                          ↓
                    React Query Hook (useAssets, usePortfolioSnapshots, etc.)
                          ↓
                    API Client (Axios → http://localhost:3000/api/v1)
```

## Running

```bash
cd front
npm install
npm run dev      # Development server at http://localhost:4321
npm run build    # Production build
npm run preview  # Preview production build
npm test         # Vitest unit tests
npm run test:e2e # Playwright E2E tests
```
