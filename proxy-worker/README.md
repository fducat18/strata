# Proxy Worker

Cloudflare Worker used in production to serve docs at:

`https://strata.ducatillon.net/docs`

The worker routes `/docs*` to the docs Cloudflare Pages origin and lets non-doc routes pass through unchanged.

## When is this worker needed?

**Production only.** No worker needed for local dev or Docker local stack.

| Mode | Docs URL | Worker needed? |
|------|----------|---------------|
| Local dev (`cd docs && npm run dev`) | `http://localhost:8001/docs/` | ❌ No |
| Local Docker | `http://localhost:8001/docs/` | ❌ No |
| Production domain | `https://strata.ducatillon.net/docs/` | ✅ Yes |

## Routing behavior

```
Browser request: GET /docs/quickstart
    ↓
Worker route: strata.ducatillon.net/docs*
    ↓
Fetches: https://strata-eep.pages.dev/docs/quickstart
    ↓
Returns docs page under strata.ducatillon.net
```

## Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DOCS_ORIGIN` | Docs Pages origin URL (no trailing slash) | `https://strata-eep.pages.dev` |

## One-time Cloudflare setup

1. Create worker `strata-docs-proxy`.
2. Add variable `DOCS_ORIGIN` if your docs Pages origin differs from default.
3. Add trigger route:
   - Route: `strata.ducatillon.net/docs*`
   - Zone: `ducatillon.net`
4. Keep main domain/custom domain on your app Pages project as-is.

## Deploy

```bash
cd proxy-worker
npx wrangler deploy
```
