# Strata Docs

Astro Starlight site, served at <https://strata.ducatillon.net/docs/>.

## Local

```bash
cd docs
npm install
npm run dev    # http://localhost:4321/docs/
npm run build  # static output → dist/
```

## Authoring

Drop `.md` (or `.mdx`) files into `src/content/docs/`. The slug is the lowercase filename (`quickstart.md` → `/docs/quickstart`). Sidebar order is configured in `astro.config.mjs`.

Each page needs frontmatter:

```yaml
---
title: "Page title"
---
```

## Build & deploy

The site is built into `dist/` as a static site. The repo `docs/Dockerfile` produces an nginx image serving the built site on port 8000 (matches the rest of the stack).

Production publish target is Cloudflare Pages (root directory `docs`, output `dist`), served through `https://strata.ducatillon.net/docs` with a `/docs*` Worker proxy route.
