---
title: "Fix: Docker prod re-seeds database on every startup"
---

## Problem

Running `npm run docker:prod` showed both user-created assets **and** seeded demo assets. Same issue occurred after deleting a demo asset — the next `docker:prod` restart re-created it.

**Root cause:** `backend/Dockerfile` CMD ran `npx prisma db seed` unconditionally on every container startup:

```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main.js"]
```

The seed script uses `findFirst({ where: { name } })` guards — if a demo asset was deleted by the user, the guard returns `null` → seed re-creates it. This is identical to the Tauri startup bug fixed in `2026-05-09-fix-tauri-reseed-on-startup.md`.

## AGENTS.md Compliance

| # | Convention | Check |
|---|---|---|
| 1 | Documentation | ✅ `backend.md`, `dev-setup.md` updated |
| 2 | All 4 test gates | n/a — Dockerfile-only change |
| 3 | Self-review | ✅ Check DB path before migrate, seed only if fresh |
| 5 | Bug-to-Test | n/a — infra-level, verified manually per Conv #9 |
| 8 | Plan history | ✅ This doc |
| 9 | Infra test gate | ✅ Run `npm run docker:reset` to verify |
| 12 | Execution summary | ✅ Below |
| 13 | Doc Grep Rule | ✅ Grepped docs; updated backend.md + dev-setup.md |

## Fix

Create `backend/docker-start.sh` — checks if DB file exists **before** `prisma migrate deploy` (which creates the file on fresh install). Seed runs only when `IS_FRESH=1`.

```sh
DB_PATH=$(echo "$DATABASE_URL" | sed 's|^file:||')
if [ ! -f "$DB_PATH" ]; then
  npx prisma migrate deploy
  npx prisma db seed        # Fresh install only
else
  npx prisma migrate deploy # Schema updates; no seed
fi
exec node dist/main.js
```

Dockerfile CMD changed from:
```
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main.js"]
```
to:
```
CMD ["./docker-start.sh"]
```

## Files Changed

| File | Change |
|---|---|
| `backend/docker-start.sh` | New startup script with conditional seed |
| `backend/Dockerfile` | COPY + exec `docker-start.sh`; chmod in same RUN |
| `docs/src/content/docs/backend.md` | Clarify seed runs only on first start |
| `docs/src/content/docs/dev-setup.md` | Note: seed is automatic on first Docker start |

## Execution Summary

**Commit**: TBD

### Actual changes
Matches plan exactly.

### Deviations from plan
None.

### Test results

| Gate | Result |
|---|---|
| Backend unit | ⏭ not affected |
| Backend e2e  | ⏭ not affected |
| Frontend unit | ⏭ not affected |
| Frontend e2e  | ⏭ not affected |
| Infra (docker:reset) | ✅ verified — fresh DB seeds; existing DB skips seed |

### Key discoveries
- The Tauri `lib.rs` fix (2026-05-09) and this Docker fix are the same pattern: check DB existence before calling seed.
- `ensure_data_dir()` in Rust only creates the directory (not the file), so checking `db_filename.exists()` before it correctly detects fresh install. In Docker, `prisma migrate deploy` creates the DB file — so checking before migrate is the right guard.
