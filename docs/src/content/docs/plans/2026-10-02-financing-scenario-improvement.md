---
title: "2026-10-02: Financing scenario improvement"
description: "Add insurance fee assumptions, update financing defaults, replace repeated cards with a comparison table, and clarify glossary terms."
---

# Financing scenario improvement

## Scope

- Add an insurance-fee assumption to financing scenarios (`% of purchase price`), applied one time to loan options only (`CUSTOM_DOWN_PAYMENT`, `FULL`).
- Set new-scenario defaults in the financing form:
  - Annual Loan Rate: `6%`
  - Insurance Fee: `0.5%`
  - Standard Loan Duration: `5 years`
- Replace repeated per-option metric cards with a single comparison table:
  - rows = metrics
  - columns = financing options
  - include reserve warning row
- Add a glossary section at the bottom of the financing page for:
  - Monthly Available Amount (EUR)
  - Funding Shortfall
- Keep existing behavior for legacy saved scenarios by defaulting missing insurance input to `0` when loading old snapshots.

## Planned changes

- **Backend**
  - Extend financing scenario input contract with `insuranceFeePercent`
  - Extend calculation output with per-option `insuranceFee`
  - Include insurance in financing cost for loan options
  - Keep legacy snapshot compatibility in repository mapping
  - Update backend tests (calculator/service/controller/e2e)
- **Frontend**
  - Extend financing request/response types with insurance fields
  - Update form defaults and add insurance input
  - Replace option cards with comparison table
  - Add glossary block in financing page
  - Update unit + e2e tests
- **API/docs**
  - Update Bruno create/update payload examples
  - Update financing docs and glossary definitions

## Validation plan

- Backend: `npm run test:cov` and `npm run test:e2e`
- Frontend: `npx vitest run --coverage` and `npm run test:e2e`
- Docs: `npm run build`

## Execution Summary

**Commits**: `5d14eee`, `9e68a35`

### Actual changes

- Implemented insurance-fee assumptions end-to-end across backend contracts, calculator logic, and frontend request/response types.
- Added loan-option insurance-fee contribution to financing cost, plus per-option `insuranceFee` output.
- Updated financing form defaults (6% rate, 0.5% insurance fee, 5 years duration) for new scenarios.
- Replaced repeated option metric cards with a scenario comparison table (metrics rows, option columns) including reserve-warning row.
- Added glossary section on financing page with definitions for Monthly Available Amount and Funding Shortfall.
- Updated backend/frontend tests, Bruno financing samples, financing docs, plan index, and release docs.
- Included and pushed pre-existing modified/untracked workspace updates as requested.

### Deviations from plan

- `npm run test:e2e` (frontend default Playwright config) could not run with bundled Chromium in this environment because browser installation repeatedly stalled and left incomplete extraction.
- To preserve e2e validation, full frontend e2e was executed with a temporary Playwright config targeting installed system Chrome (`channel: "chrome"`), then temporary config was removed.

### Test results

| Gate | Result |
|---|---|
| Backend unit (coverage) | ✅ `npm run test:cov` passed (350 tests, thresholds met) |
| Backend e2e | ✅ `npm run test:e2e` passed (73 tests) |
| Frontend unit (coverage) | ✅ `npx vitest run --coverage` passed |
| Frontend e2e | ✅ Full Playwright suite passed with system Chrome config (35 tests: 13 passed, 22 skipped) |
| Docs build | ✅ `npm run build` passed (111 pages) |

### Key discoveries

- Legacy saved financing snapshots need compatibility normalization for new fields; defaulting missing `insuranceFeePercent` to `0` preserves historical behavior.
- New default loan duration (5 years) changed financing e2e expectations from 12-month to 60-month timeline details.
