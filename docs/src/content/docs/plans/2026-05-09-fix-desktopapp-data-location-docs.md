---
title: "2026-05-09: Fix desktopapp.md stale data location references"
---

## Problem

`docs/src/content/docs/desktopapp.md` documented the **old** dev data location from before commit `1cfb676`.  
That commit changed `src-tauri/src/lib.rs` so dev builds use `<repo>/backend/.data/strata-dev.db` (repo-relative, shared with docker:dev), but the doc was not updated.

**Why it was missed:** Convention #1 (doc parity with code) was not enforced during the path-change commit. A `grep -r 'Strata-Dev' docs/` would have caught every stale reference immediately.

**Prevention:** Convention #13 (Doc Grep Rule) was added to `AGENTS.md` and the planning checklist as a direct result of this miss.

---

## Stale references fixed

| Location | Old value | New value |
|---|---|---|
| Data Location table — dev row | `~/Library/Application Support/Strata-Dev/strata.db` | `<repo>/backend/.data/strata-dev.db` |
| Data Location table — logs row | `~/Library/Logs/Strata/` | `~/Library/Logs/net.ducatillon.strata/Strata.log` |
| Dev vs prod table — Data folder row | `Strata-Dev/` | `backend/.data/` (repo-relative, shared with docker:dev) |
| Dev vs prod table — explanation | "prevents accidental corruption" | Added: also shared with docker:dev |
| Architecture diagram | `~/Library/App Sup…` | `dev: backend/.data/ / prod: ~/Library/App Sup…` |
| Launch sequence step 1 | single path for all modes | dev path vs prod path clarified |
| Smoke checklist item 2 | `Strata-Dev/` | `backend/.data/` (dev) |
| Menu Items table | `~/Library/Application Support/Strata/` only | dev vs prod path noted |
| Troubleshooting — log path | `~/Library/Logs/Strata/` | `~/Library/Logs/net.ducatillon.strata/Strata.log` |

---

## Files Changed

| File | Change |
|---|---|
| `docs/src/content/docs/desktopapp.md` | All 9 stale references updated |
| `AGENTS.md` | Convention #13 (Doc Grep Rule) added |
| `.github/instructions/agents-plan-checklist.instructions.md` | Row 13 added to mandatory checklist |

---

## Execution Summary

**Commit**: `839572e`

### Actual changes
All 9 stale references in `desktopapp.md` updated as planned. Also added Convention #13 to `AGENTS.md` and the planning checklist to prevent this class of omission in the future.

### Deviations from plan
None.

### Test results

| Gate | Result |
|---|---|
| Backend unit | ⏭ not affected |
| Backend e2e | ⏭ not affected |
| Frontend unit | ⏭ not affected |
| Frontend e2e | ⏭ not affected |
| Docs build | ✅ `cd docs && npm run build` passes |

### Key discoveries
- Log path is `~/Library/Logs/net.ducatillon.strata/Strata.log` (bundle identifier, not product name)
- `reveal_data_folder()` in `lib.rs` calls `data_dir()` → already returns `backend/.data/` for dev builds correctly
- Architecture diagram in ASCII art also contained an implicit stale reference
