---
title: "Fix: tauri-build.sh — nest: command not found"
description: Fix the Tauri production build failing with `nest: command not found` by installing full backend dependencies (including devDependencies) before the build step.
---

## Problem

Running `npm run tauri:prod` (or `./scripts/tauri-build.sh` directly) fails with:

```
▸ Building backend …
sh: nest: command not found
```

## Root Cause

`scripts/tauri-build.sh` installs backend dependencies with `--omit=dev`:

```bash
npm ci --omit=dev 2>/dev/null || npm install --omit=dev
```

`@nestjs/cli` — which provides the `nest` binary used by `npm run build` → `nest build` — is in `devDependencies`. Skipping dev deps means `nest` is never installed.

`scripts/tauri-dev.sh` is unaffected: it uses a full `npm ci` (no `--omit=dev`).

## Database Routing (not affected)

`npm run tauri:prod` produces a **release** build. DB selection in `lib.rs`:

```rust
fn is_dev_build() -> bool {
    cfg!(debug_assertions) // false in release builds
}
// → db_file = "strata.db"
// → ~/Library/Application Support/Strata/strata.db  (production DB)
```

The fix does not affect this routing. Debug builds (`tauri dev`) continue using `strata-dev.db`.

## Fix

Remove `--omit=dev` from the backend install step in `scripts/tauri-build.sh`:

```bash
# Before:
npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# After:
npm ci 2>/dev/null || npm install
```

The `.app` loads from the host repo clone (not redistributable — see `bundle-node-runtime.md`), so having dev deps in `backend/node_modules` is acceptable. Dev tools are needed to compile TypeScript; they are not shipped inside the `.app` bundle.

## Files Changed

| File | Change |
|---|---|
| `scripts/tauri-build.sh` | Removed `--omit=dev` from backend `npm ci` |

## Execution Summary

**Commit**: _to be filled in_

### Actual changes

- `scripts/tauri-build.sh` line 21: changed `npm ci --omit=dev 2>/dev/null || npm install --omit=dev` → `npm ci 2>/dev/null || npm install`

### Deviations from plan

None.

### Test results

| Gate | Result |
|---|---|
| Backend unit | ⏭ not affected |
| Backend e2e  | ⏭ not affected |
| Frontend unit | ⏭ not affected |
| Frontend e2e  | ⏭ not affected |
| Infra (tauri-build.sh) | ✅ backend builds without `nest: command not found` |

### Key discoveries

None.
