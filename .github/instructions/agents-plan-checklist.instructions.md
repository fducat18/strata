---
applyTo: '**/*'
description: 'AGENTS.md — mandatory planning checklist for all AI agents working on Strata'
---

# AGENTS.md Mandatory Checklist

Before presenting any plan and before making any code change, go through this checklist. Every item that applies MUST be addressed. Show this table in every plan.

> Full prose: see `AGENTS.md` at repo root.

## Planning checklist (run through before EVERY plan)

| # | Convention | Check |
|---|---|---|
| 1 | **Documentation**: every feature/fix/decision must update the Astro Starlight doc site (`docs/src/content/docs/`) | Does this change need a doc update? |
| 2 | **All 4 test gates**: backend unit (≥90%) + backend e2e + frontend unit (≥90%) + frontend e2e must ALL pass | Are all 4 gates in acceptance criteria? |
| 3 | **Self-review**: before presenting plan, verify internal consistency, cross-ref all files, map every acceptance criterion to a concrete step | Show a self-review table in the plan |
| 4 | **Endpoint coverage**: every NEW API endpoint → Bruno collection (`.bruno/Strata/`) + Swagger decorators | Adding new endpoints? |
| 5 | **Bug-to-Test**: every bug found via manual/Docker testing → new automated test (unit or e2e) that would have caught it | Is this a bug fix? Write the test first |
| 6 | **Seed isolation**: tests use own data, never touch seeded demo records, clean up after themselves | Do new tests respect this? |
| 7 | **Transaction invariants**: every asset has exactly 1 ACQUIRE and 0 or 1 DISPOSE (service-level, not DB constraint) | Touching asset transactions? |
| 8 | **Plan history**: save plan to `docs/src/content/docs/plans/YYYY-MM-DD-<short-title>.md` BEFORE implementation starts | Plan saved to doc site? |

## Naming convention for plan docs
`docs/src/content/docs/plans/YYYY-MM-DD-<short-title>.md`  
Example: `2026-05-02-fix-assettype-group-enum-cast.md`

## Test gate commands
```bash
# Backend
cd backend && npm run build        # TypeScript compile
cd backend && npm test             # unit tests (≥90% coverage)
cd backend && npm run test:e2e     # e2e tests

# Frontend
cd front && npm test               # unit tests (≥90% coverage)
cd front && npm run test:e2e       # e2e (Playwright)
```
