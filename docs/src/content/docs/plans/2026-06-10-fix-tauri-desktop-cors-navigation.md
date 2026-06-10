---
title: "2026-06-10: Fix Tauri desktop CORS and navigation issues"
description: "Resolve endless 'Starting services...' spinner when clicking assets in the desktop app — caused by CORS misconfiguration and wrong navigation base URL."
---

## Problem

When launching Strata from `/Applications/Strata.app` and clicking on an asset from the Asset List page, the app displayed an endless "Starting services…" spinner and never loaded the asset detail page.

## Root Cause Analysis

Two distinct bugs were found:

### Bug 1 — CORS blocked all API requests in Tauri dev mode

The Tauri Rust code (`src-tauri/src/lib.rs`) hardcoded `ALLOWED_ORIGINS=tauri://localhost` when spawning the backend sidecar. In Tauri dev mode, the frontend runs on `http://127.0.0.1:1430` (or `:1431`, `:1432`, … — the port increments if busy). This origin was not in the allowlist, so every API preflight returned 204 with no CORS headers, blocking all requests.

Additionally, `app.enableCors()` (NestJS built-in) was being overridden by Helmet, so even the web-mode origins were not working correctly.

### Bug 2 — Asset detail navigation resolved to the Tauri loader page

The asset name link in `AssetListPage.tsx` used a hardcoded absolute path:
```tsx
<a href={`/assets/detail?id=${asset.id}`}>
```

In desktop mode, the Astro bundle is served under `/app/` (base: `/app/`). An absolute `/assets/detail` path resolves to the root `frontend-dist/index.html` — the Tauri loader — showing "Starting services…" indefinitely.

## Changes

### `backend/src/main.ts`
- Replaced `app.enableCors()` with a custom Express middleware (`createCorsMiddleware`) that correctly sets CORS headers before Helmet runs.
- Added support for origin prefix matching (`http://127.0.0.1:`) so any Tauri dev port is accepted.
- Added `X-Request-ID` and `X-Strata-Desktop-Token` to `Access-Control-Allow-Headers`.
- Added `crossOriginResourcePolicy: false` to Helmet config.
- Expanded `DEFAULT_ALLOWED_ORIGINS` to include `http://127.0.0.1:6543` and `http://127.0.0.1:1430` (sentinel for prefix matching).

### `src-tauri/src/lib.rs`
- In dev builds (`cfg!(debug_assertions)`), pass a broader `ALLOWED_ORIGINS` that includes `http://127.0.0.1:1430` (which the backend treats as a sentinel to enable `http://127.0.0.1:` prefix matching).
- In production builds, keep `tauri://localhost` only.

### `front/src/components/assets/AssetListPage.tsx`
- Changed asset detail link from `/assets/detail?id=...` to `${import.meta.env.BASE_URL}assets/detail?id=...` so it resolves correctly under both `/` (web) and `/app/` (desktop).

### `front/src/components/portfolios/PortfolioListPage.tsx`
- Same fix for `/portfolios/${p.id}` link.

## Execution Summary

**Commits**: `4f33a43`, `ddc41e3`, `3925786`

### Actual changes

Exactly as planned above. No deviations.

### Test results

| Gate | Result |
|---|---|
| Backend unit | ✅ 323 tests passed |
| Backend e2e | ✅ 70 tests passed |
| Frontend unit | ✅ passed with coverage |
| Frontend e2e | ⏭ skipped (navigation fix is desktop-specific, covered by manual verification) |

### Key discoveries

- Tauri dev server dynamically increments the port (1430, 1431, …) if the previous port is busy — requiring prefix-based CORS matching rather than exact port matching.
- `app.enableCors()` in NestJS is silently overridden when Helmet is applied afterwards — a known interaction that requires custom middleware.
- `import.meta.env.BASE_URL` is the correct way to build base-aware links in React islands within an Astro project.
