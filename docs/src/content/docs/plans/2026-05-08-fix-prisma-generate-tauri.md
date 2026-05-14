---
title: "2026-05-08: Fix missing prisma generate in Tauri dev/build flow"
description: Add explicit prisma generate step to tauri-dev.sh, tauri-build.sh, and the backend prebuild script so the Prisma client is always generated before TypeScript compilation.
---

## Problem

Running `npm run tauri:dev` (or `tauri:build`) failed with **100 TypeScript compilation errors** because Prisma-generated types were missing:

```
Module '"@prisma/client"' has no exported member 'PrismaClient'
Module '"@prisma/client"' has no exported member 'Prisma'
Module '"@prisma/client"' has no exported member 'AssetTypeGroup'
Property 'asset' does not exist on type 'PrismaService'
… (100 errors total)
```

**Root cause:** `node_modules/.prisma/client/` (the generated Prisma client) was never created in the Tauri flow. Prisma 7 does **not** auto-generate the client on `npm install` — an explicit `prisma generate` call is required.

- **Docker** handles this correctly: the backend `Dockerfile` line 40 runs `RUN npx prisma generate` explicitly.  
- **`backend/.env`** has `DATABASE_URL` set, so local `prisma generate` works.  
- **`tauri-dev.sh` / `tauri-build.sh`**: ran `npm install` → `npm run build`, but **skipped `prisma generate`**.  
- **`backend/package.json`**: no `postinstall` or `prebuild` step for `prisma generate`.

---

## Decision: where to add `prisma generate`

Three options were considered:

| Option | Pros | Cons |
|---|---|---|
| `postinstall` in `package.json` | Automatic, universal | Docker sets `DATABASE_URL` *after* `npm ci` — `postinstall` would run before the env var is available and fail |
| Explicit step in shell scripts only | Simple, targeted | Doesn't cover `cd backend && npm run build` direct usage |
| `prebuild` in `package.json` + shell scripts | Covers all paths | `prebuild` is skipped in Docker (Docker calls `npx nest build` directly, not `npm run build`) — safe |

**Chosen: option 3 (belt + suspenders)** — add `prisma generate` to both the shell scripts and the `prebuild` npm script.

---

## Changes

### `scripts/tauri-dev.sh`

Added an explicit `npx prisma generate` step after `npm install` and before `npm run build` for the backend:

```bash
echo "▸ Generating Prisma client …"
npx prisma generate
```

### `scripts/tauri-build.sh`

Same addition after the `--omit=dev` install.

### `backend/package.json`

Changed `prebuild` from:
```json
"prebuild": "node ../scripts/gen-version.mjs backend"
```
To:
```json
"prebuild": "prisma generate && node ../scripts/gen-version.mjs backend"
```

This ensures `cd backend && npm run build` (direct developer usage outside the Tauri scripts) also generates the Prisma client automatically.

---

## Why this doesn't break Docker

The backend `Dockerfile` calls `RUN npx nest build` **directly** — it never calls `npm run build`. This means the `prebuild` npm lifecycle hook is **not triggered** in Docker. Docker continues to use its own explicit `RUN npx prisma generate` step (which runs after `DATABASE_URL` is set via `ENV`).

---

## Acceptance Criteria

1. `npm run tauri:dev` completes without TypeScript errors ✅  
2. `cd backend && npm run build` succeeds from cold state ✅  
3. Backend unit tests pass ✅  
4. Backend e2e tests pass ✅  
5. Docker build still works ✅  

---

## Execution Summary

**Commit:** `acf15f9`

### Actual changes

| File | Change |
|---|---|
| `scripts/tauri-dev.sh` | Added `echo "▸ Generating Prisma client …"` + `npx prisma generate` after backend `npm install` |
| `scripts/tauri-build.sh` | Same addition after `npm install --omit=dev` |
| `backend/package.json` | Changed `prebuild` to `"prisma generate && node ../scripts/gen-version.mjs backend"` |
| `docs/src/content/docs/plans/2026-05-08-fix-prisma-generate-tauri.md` | This plan doc (new file) |
| `docs/src/content/docs/dev-setup.md` | Added note about automatic `prisma generate` in the backend Step 2 section |

### Deviations from plan

None. The plan was followed exactly.

### Test results

| Gate | Result |
|---|---|
| Backend unit | ✅ 265 tests passed (28 suites) |
| Backend e2e  | ✅ 69 tests passed (8 suites) |
| Frontend unit | ⏭ skipped (not affected) |
| Frontend e2e  | ⏭ skipped (not affected) |

### Key discoveries

- `prisma generate` in `prebuild` works for local dev because `backend/.env` supplies `DATABASE_URL` via `import 'dotenv/config'` in `prisma.config.ts`.
- Docker calls `npx nest build` directly — never `npm run build` — so `prebuild` is not triggered in Docker. No conflict.
- The `tauri-dev.sh` change calls `npx prisma generate` from the `backend/` directory, which correctly picks up `prisma.config.ts` and `backend/.env`.

