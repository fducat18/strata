---
title: "2026-05-09: Unify dev database — strata-dev.db across all dev modes"
date: 2026-05-09
---

## Problem

Three dev modes used three different database files:

| Mode | Database (before) |
|---|---|
| `npm run docker:dev` | `backend/.data/strata-dev.db` ✅ |
| `npm run tauri:dev` | `~/Library/Application Support/Strata-Dev/strata.db` ❌ |
| `cd backend && npm run start:dev` | `backend/.data/strata.db` ❌ |

**Naming convention violated:** `strata.db` is the production database name. All dev modes must use `strata-dev.db`.

**Sharing violated:** Tauri dev stored its database in the macOS app data directory, completely separate from Docker dev data — so changes made in Docker were invisible in Tauri and vice versa.

---

## Decision

All dev modes share `backend/.data/strata-dev.db`.
Production (Tauri release build) keeps `~/Library/Application Support/Strata/strata.db`.

---

## Files Changed

| File | Change |
|---|---|
| `backend/.env` | `strata.db` → `strata-dev.db` |
| `backend/.env.example` | Same |
| `src-tauri/src/lib.rs` | `data_dir()` dev branch → repo-relative `backend/.data/`; `ensure_data_dir()` dev → `strata-dev.db` |

### `src-tauri/src/lib.rs` — key change

```rust
fn data_dir() -> std::path::PathBuf {
    if is_dev_build() {
        // Repo-relative path shared with docker:dev and start:dev
        let manifest = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
        let repo_root = manifest.parent().expect("CARGO_MANIFEST_DIR has no parent");
        repo_root.join("backend").join(".data")
    } else {
        let mut dir = dirs::data_dir().expect("could not determine app data directory");
        dir.push("Strata");
        dir
    }
}

fn ensure_data_dir() -> String {
    let dir = data_dir();
    std::fs::create_dir_all(&dir).expect("could not create data directory");
    let db_file = if is_dev_build() { "strata-dev.db" } else { "strata.db" };
    format!("file:{}", dir.join(db_file).display())
}
```

---

## Execution Summary

**Commit:** see git log

### Actual changes
- `backend/.env` and `.env.example`: one-line change, `strata.db` → `strata-dev.db`
- `src-tauri/src/lib.rs`: `data_dir()` and `ensure_data_dir()` rewritten to use `CARGO_MANIFEST_DIR` for repo-relative dev path

### Deviations from plan
None — implemented exactly as designed.

### Test results

| Gate | Result |
|---|---|
| Backend unit | ✅ 265 tests passed |
| Backend e2e | ✅ 69 tests passed |
| Frontend unit | ⏭ skipped (not affected) |
| Frontend e2e | ⏭ skipped (not affected) |

### Key discoveries
- `CARGO_MANIFEST_DIR` (`src-tauri/`) is available at compile time in `lib.rs`, making a simple `manifest.parent()` sufficient to reach repo root — no runtime path gymnastics needed.
- The old `Strata-Dev/` macOS app data directory is now unused by dev builds. Existing data there can be migrated manually by copying `~/Library/Application Support/Strata-Dev/strata.db` to `backend/.data/strata-dev.db` if needed.
