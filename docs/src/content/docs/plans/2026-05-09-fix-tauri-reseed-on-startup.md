---
title: "Fix: Tauri re-seeds deleted demo assets on every startup"
---

## Problem

Deleting a demo asset (e.g. "Home Loan — BNP") via the web UI persists to `backend/.data/strata-dev.db`. But when Tauri starts next time, the deleted asset reappears.

**Root cause:** `src-tauri/src/lib.rs` calls `run_prisma_seed()` on **every** Tauri startup — unconditionally. The seed script guards by `findFirst({ where: { name } })`. If the asset was deleted, the guard returns null → seed recreates the asset.

```
Tauri startup
  → run_prisma_migrate  (always correct)
  → run_prisma_seed     (always ran — BUG)
        "Home Loan — BNP" not found in DB → CREATE  ← user's delete is undone
```

The database path is shared correctly between Docker and Tauri (both use `backend/.data/strata-dev.db`). The bug is purely in when `run_prisma_seed` is called.

---

## Fix

Check whether the DB file exists on disk **before** `ensure_data_dir()` creates the directory. Only seed if the DB is freshly created.

```rust
let db_filename = if is_dev_build() { "strata-dev.db" } else { "strata.db" };
let is_fresh_db = !data_dir().join(db_filename).exists();

let database_url = ensure_data_dir();
// … run_prisma_migrate …
if is_fresh_db {
    run_prisma_seed(&backend_path, &database_url);
} else {
    log::info!("Existing database detected — skipping seed.");
}
```

**Correct behaviour:**
- Fresh DB (new install or after `docker:reset`) → seed runs, demo data created
- Existing DB → migrate runs (schema updates), seed skipped, user data preserved

---

## Files Changed

| File | Change |
|---|---|
| `src-tauri/src/lib.rs` | Check DB existence before `ensure_data_dir()`; conditional seed |

---

## Execution Summary

**Commit**: TBD

### Actual changes
Surgical change at the startup sequence in `lib.rs`: compute `is_fresh_db` flag before `ensure_data_dir()`, gate `run_prisma_seed()` on it.

### Deviations from plan
None.

### Test results

| Gate | Result |
|---|---|
| Backend unit | ⏭ not affected |
| Backend e2e | ⏭ not affected |
| Frontend unit | ⏭ not affected |
| Frontend e2e | ⏭ not affected |
| Manual smoke | ✅ verified below |

**Manual smoke test:**
1. Run `npm run docker:reset` → fresh DB with demo assets
2. Delete "Home Loan — BNP" via web UI → 200 OK
3. Stop Docker
4. Start `npm run tauri:dev`
5. Confirm "Home Loan — BNP" does NOT reappear

### Key discoveries
- VS Code crash (`code: 5`) seen in screenshot is unrelated to Strata — it's a VS Code process SIGABRT, likely memory pressure from running Docker + Tauri concurrently.
- `ensure_data_dir()` only creates the **directory**, not the DB file. The DB file is created by `prisma migrate deploy`. So checking `data_dir().join(db_filename).exists()` before `ensure_data_dir()` correctly detects a fresh install.
