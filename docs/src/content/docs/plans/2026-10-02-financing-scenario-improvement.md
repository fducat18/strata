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

