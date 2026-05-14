---
title: "2026-05-14: Doc site consistency fixes"
description: "Standardize release note titles, fix sidebar ordering (remove manual order overrides), delete badly named plan file, add plans index table, fix dev-setup Node 24 refs."
---

## Problem

Several inconsistencies discovered in the doc site after v1.2.1 was shipped:

1. **Sidebar not reversed**: Individual release note files had `sidebar: order: X` frontmatter overriding `reversed: true` in astro.config.mjs. Same issue in two plan files.
2. **Release note title inconsistency**: Older files used `"Release Notes — v1.X.X"` prefix; v1.2.1 used plain `"v1.2.1"`.
3. **Badly named plan file**: `2025-01-beta-feedback-plan.md` (missing day DD) was a duplicate of the correctly named `2026-05-01-beta-feedback-plan.md`.
4. **Plans index.md had no table**: Unlike `releases/index.md` which lists all releases, `plans/index.md` had only a brief description.
5. **dev-setup.md still mentioned Node 22**: Tip header (`Node >=22 LTS — Node 24 recommended`) and line 103 (`Node ≥ 22 — already required`) were still pointing to Node 22.

## Plan

- **F1** Remove `sidebar: order:` from `v1-0-0`, `v1-1-0`, `v1-1-1`, `v1-1-2`, `v1-2-0` + `2026-05-01-beta-feedback-plan.md`
- **F2** Standardize all release titles to `"v1.X.X"` (5 files)
- **F3** Delete `2025-01-beta-feedback-plan.md` (badly named duplicate)
- **F4** Rebuild `plans/index.md` with full table of all plans, newest first
- **F5** `dev-setup.md`: update tip header + line 103 to say Node 24

## AGENTS.md Checklist

| # | Convention | Status |
|---|---|---|
| 1 | Doc site IS the deliverable | ✅ |
| 2 | All 4 test gates | ⏭ No code change |
| 3 | Self-review complete | ✅ |
| 4 | Endpoint coverage | ⏭ N/A |
| 5 | Bug-to-Test | ⏭ N/A |
| 6 | Seed isolation | ⏭ N/A |
| 7 | Transaction invariants | ⏭ N/A |
| 8 | Plan history | ✅ This file |
| 9 | `cd docs && npm run build` before + after | ✅ |
| 10 | Local Node 24, no Docker | ✅ |
| 11 | Baseline before changes | ✅ Passed (73 pages) |
| 12 | Execution summary | ✅ Below |
| 13 | Doc Grep Rule | ⏭ Changes ARE the docs |
| 14 | Patch release `v1.2.2` | ✅ |

## Execution Summary

**Commit**: TBD

### Actual changes
- `releases/v1-0-0.md`, `v1-1-0.md`, `v1-1-1.md`, `v1-1-2.md`, `v1-2-0.md` — removed `sidebar: order:` block + updated title to `"v1.X.X"` format
- `plans/2026-05-01-beta-feedback-plan.md` — removed `sidebar: order:` block
- `plans/2025-01-beta-feedback-plan.md` — deleted (badly named duplicate)
- `plans/index.md` — rebuilt with full table listing all 36 plans newest-first
- `dev-setup.md` — tip header + line 103 updated to Node 24

### Deviations from plan
None.

### Test results
| Gate | Result |
|---|---|
| Docs build (baseline) | ✅ 73 pages |
| Docs build (after) | ✅ 73 pages (1 deleted + 1 created = net 0) |
| Backend unit | ⏭ Not affected |
| Backend e2e | ⏭ Not affected |
| Frontend unit | ⏭ Not affected |
| Frontend e2e | ⏭ Not affected |

### Key discoveries
- `sidebar: order:` in individual files silently overrides `reversed: true` in astro.config.mjs — this was the root cause of sidebar ordering not working.
