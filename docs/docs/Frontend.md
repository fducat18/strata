# Frontend

The Strata frontend is built with **Astro** and **React**, providing a Finary-like asset management interface.

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
| `/` | Dashboard — stats, net worth chart, allocation chart |
| `/portfolios` | Portfolio list with create/delete |
| `/portfolios/:id` | Portfolio detail — assets, value history |
| `/assets` | Asset list with search, filters, create |
| `/assets/:id` | Asset detail — snapshots, tags, categories |
| `/categories` | Category tree with CRUD |
| `/tags` | Tag list with CRUD |
| `/settings` | Theme toggle, backup export/import |

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
                    React Query Hook (usePortfolios, useAssets, etc.)
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
