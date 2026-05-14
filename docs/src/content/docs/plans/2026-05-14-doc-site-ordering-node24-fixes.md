---
title: "2026-05-14: Doc site ordering, Node 24 fixes, architecture diagram"
description: "Fix Plans/Releases sidebar to show newest first, update 7 stale Node 22 references to Node 24, and correct the architecture diagram to show docs available in dev mode."
---

## Problem

1. **Sidebar ordering** — Plans and Releases sidebar sections used `autogenerate` with default alphabetical sorting (oldest first). User wants newest first.
2. **Node 22 stale references** — Node 24 is the pinned version since a previous upgrade, but 7 occurrences of "Node 22" remained across 5 doc files.
3. **Architecture diagram incorrect** — Mermaid diagram showed the Docs site only inside the `prod` subgraph. But docs are also available in dev via `cd docs && npm run dev` on port 4321. The Services table also showed `8001` for the dev docs port (wrong — nginx only runs in prod).

## Plan

### D1 — `astro.config.mjs`: add `reversed: true`
Starlight supports `reversed: true` in `autogenerate`. Applied to both `releases` and `plans` blocks.

### D2 — Fix 7 Node 22 references across 5 files
| File | Fix |
|---|---|
| `backend.md` | `Node.js 22` → `Node.js 24` |
| `techstack.md` | `Node.js 22+` → `Node.js 24+` |
| `quickstart.md` | `Node.js 22` → `Node.js 24` |
| `recovery.md` | `Node 22+` → `Node 24+` |
| `desktopapp.md` | `Node.js 22+` → `Node.js 24+` |
| `dev-setup.md` (line 45) | `switch to Node 22` → `switch to Node 24` |
| `dev-setup.md` (line 51) | `nvm use 22` → `nvm use 24` |

Intentional ">=22 is fine" notes (minimum requirement) left intact.

### D3 — `architecture.md`: diagram + table
- Add `DevDocs` node inside `dev` subgraph
- Fix Services table: Docs dev port `4321 (manual)`, prod port `8001 (nginx)`

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
| 11 | Baseline run before changes | ✅ Passed |
| 12 | Execution summary | ✅ Below |
| 13 | Doc Grep Rule | ⏭ Changes ARE the docs |
| 14 | Patch release `v1.2.1` | ✅ |

## Execution Summary

**Commit**: TBD

### Actual changes
- `docs/astro.config.mjs` — `reversed: true` on `releases` + `plans` autogenerate blocks
- `docs/src/content/docs/backend.md` — Node.js 22 → 24
- `docs/src/content/docs/techstack.md` — Node.js 22+ → 24+
- `docs/src/content/docs/quickstart.md` — Node.js 22 → 24
- `docs/src/content/docs/recovery.md` — Node 22+ → 24+
- `docs/src/content/docs/desktopapp.md` — Node.js 22+ → 24+
- `docs/src/content/docs/dev-setup.md` — 2 lines: nvm use 22 → 24, auto-switch message
- `docs/src/content/docs/architecture.md` — DevDocs node + Services table fix

### Deviations from plan
None — implementation followed plan exactly.

### Test results
| Gate | Result |
|---|---|
| Docs build (baseline) | ✅ 71 pages, 0 errors |
| Docs build (after) | ✅ 72 pages, 0 errors |
| Backend unit | ⏭ Not affected |
| Backend e2e | ⏭ Not affected |
| Frontend unit | ⏭ Not affected |
| Frontend e2e | ⏭ Not affected |

### Key discoveries
- `backend.md` DID have a Node 22 reference (line 12 in the Stack table) — previous grep missed it because the search term was too strict. Full exhaustive grep found all 7 occurrences.
