---
title: "2026-09-28: Financing Scenarios"
description: "Implement saved, non-mutating financing comparisons with per-asset savings projections, loan amortisation, and reserve warnings."
---

# Financing Scenarios

## Goal

Build the canonical contract in `spec-financing-scenarios/SPEC.md`: let users save and compare Cash Financing, Custom Down Payment Financing, and Full Financing while keeping accounting records untouched.

## Design

- Store each scenario as a separate planning record. On create or update, the backend captures the selected assets' current balances and names, the user's explicit availability choices, and each Savings Return Assumption. Recalculation uses this saved input snapshot; editing and saving refreshes balances from the portfolio.
- Keep the projection in a pure backend calculation module using decimal arithmetic. Calculate results on demand and do not persist them as accounting data or `PortfolioSnapshots`.
- Add scenario CRUD and recalculation endpoints under `/api/v1/financing-scenarios`, with Swagger response/request schemas and Bruno requests.
- Add a Financing Scenarios page with input editing, saved comparisons, reserve warnings, yearly checkpoints, and month-by-month detail. The portfolio's existing base currency is EUR.
- Limit the Standard Loan duration to 1–1200 months (1–100 whole years in the UI) so the full monthly projection has a bounded size.
- Include saved scenarios in JSON backup and restore, with compatibility for existing backups that do not contain scenario data.

## Scope and acceptance mapping

| Capability | Implementation evidence |
|---|---|
| CAP-1: scenarios stay separate from accounting | Detached scenario table, no accounting writes in the service, and before/after integration coverage for assets, liabilities, transactions, and snapshots. |
| CAP-2: compare all three options | One calculation returns Cash, Custom Down Payment, and Full Financing for shared inputs. |
| CAP-3: explicit availability and per-asset returns | Saved asset assumptions preserve user availability and individual rates; unavailable balances are excluded. |
| CAP-4: monthly projections and standard amortisation | Decimal calculation engine with unit coverage for the published one-year reference. |
| CAP-5: monthly and yearly inspection | Timeline rows for each month and checkpoints for each completed year. |
| CAP-6: separate loan cost and retained/lost return | Each option exposes interest plus setup fee and signed savings-return delta from cash. |
| CAP-7: reserve risk warns without blocking | Initial and monthly breach points and funding shortfalls remain visible in results. |

## Verification

- Backend unit tests for calculation edge cases, application service, persistence, and controller contract.
- Backend e2e coverage for create, retrieve, update, recalculate, delete, and accounting-record integrity.
- Frontend unit and Playwright coverage for scenario editing, comparison, reserve warning, and monthly details.
- Run backend and frontend unit/e2e gates, build/check gates, and the docs build after implementation.

## Risks and constraints

- Existing asset and snapshot values use the app's EUR base currency. Currency selection remains out of scope until the portfolio supports multiple currencies.
- Saved asset balances are point-in-time assumptions. The page must make the capture-on-save behavior clear so a user can refresh a scenario by saving it again.
- The repository currently has unrelated uncommitted and untracked work. Keep this feature's edits limited to its code, docs, tests, and migration; do not include or rewrite that work.

## Execution Summary

### Actual changes

- Added detached financing scenario inputs, a decimal projection engine, persistence, CRUD/recalculation API, Swagger schemas, Bruno requests, and JSON backup/restore support.
- Added the Financing page with per-asset assumptions, three-option comparison, reserve warnings, year summaries, and monthly detail.
- Updated feature, API, backend, frontend, data model, backup, migration, and domain-context docs.
- Added backend unit/e2e and frontend unit/Playwright coverage. An e2e run exposed that the new route needed its own `QueryProvider`; the route wrapper now matches the other page components.

### Deviations

- The spec leaves saved scenario storage open. Inputs are stored in a standalone table as a point-in-time asset snapshot; recalculation uses that snapshot and saving edits refreshes balances.
- Version one uses the existing EUR base currency and bounds loan duration to 1,200 months (1–100 whole years in the UI).
- Playwright used the installed system Chrome with one worker because the pinned browser download stalled during extraction. No Playwright config change remains.

### Test results

- Backend unit: **35 suites, 347 tests passed**; 97.32% statements, 97.9% lines.
- Backend e2e: **9 suites, 72 tests passed**.
- Frontend unit: **74 files, 463 tests passed**; 95.01% statements/lines.
- Frontend Playwright: **12 passed, 22 skipped** because the backend API was not running; the financing scenario flow passed. Existing API-dependent specs skip when that service is unavailable.
- Backend, frontend, and docs production builds passed. Scoped `git diff --check` passed. No infrastructure files changed.
- `npm run check` could not run because `@astrojs/check` is absent. Direct `tsc --noEmit` still reports existing errors in unrelated portfolio pages, dashboard charts, and asset/snapshot test fixtures; it reported no errors in the financing files.

### Commit and release

- Feature commit SHA: **none**; the feature remains uncommitted. The existing worktree contains unrelated BMAD migration edits, and `.git` is read-only in this environment.
- The latest tag is `v1.4.0`; the new feature requires `v1.5.0`. `npm run release -- 1.5.0` stopped at its clean-worktree check before changing files. The release tag and release notes remain pending.

### Key discoveries

- Decimal.js treats zero as positive for `isPositive()`. Explicit greater-than-zero checks prevent zero-valued required amounts from passing validation.
- The frontend route must mount a query provider around its page island; browser coverage now guards that integration.
