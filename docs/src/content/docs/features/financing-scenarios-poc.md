---
title: "Financing Scenarios"
description: "Save hypothetical purchase plans and compare cash, partial down payment, and full loan financing without changing portfolio records."
---

# Financing Scenarios

Open **Financing** in the app sidebar before committing to a major purchase. A Saved Financing Scenario compares Cash Financing, Custom Down Payment Financing, and Full Financing while keeping actual assets, liabilities, transactions, and PortfolioSnapshots unchanged.

## What the comparison shows

Each option keeps four results separate:

1. **Financing Cost** — loan interest plus Loan Setup Fee and loan-option Insurance Fee. Purchase Price and Down Payment are not financing costs.
2. **Savings Return retained or lost** — the signed difference in generated Savings Return compared with Cash Financing.
3. **Final Scenario Savings Balance** — eligible savings after the initial outlay, monthly activity, and returns.
4. **Reserve Breach** — whether savings fall below Emergency Reserve and the first point at which that happens.

Cheapest Financing means the lowest Financing Cost. It is a cost measure, not a universal recommendation.

The page exposes a scenario-comparison table (metrics as rows, options as columns), loan principal and monthly payment, eligible asset assumptions, yearly checkpoints, and every month in the Scenario Timeline. The three option timelines each appear in full-width cards, stacked vertically in financing option order. Monthly detail includes Savings Return, loan interest and principal, contribution or withdrawal by asset, Scenario Savings Balance, remaining loan balance, Funding Shortfall, and reserve status.

## Create and save a scenario

Enter a scenario name, Purchase Price, partial Down Payment, Emergency Reserve, fixed Monthly Available Amount, annual Loan Rate Assumption, Insurance Fee Assumption, Standard Loan duration, and optional Loan Setup Fee. New scenarios default to 6% annual Loan Rate, 0.5% Insurance Fee, and 5 years duration. The first version uses the portfolio's EUR base currency. The duration is entered in whole years; the same duration is the Financing Horizon for every option. The supported range is 1 to 100 years.

The asset list shows active assets whose asset type belongs to the `SAVINGS` group, with their current recorded balances. Confirm availability separately for each listed asset and provide its constant annual Savings Return Assumption. Group membership determines candidate eligibility; it does not infer that a particular balance is accessible for this purchase. An unchecked asset is excluded from Starting Savings, all outlays, withdrawals, returns, and results.

On save, Strata captures each listed asset's ID, name, current balance, availability choice, and return assumption as detached scenario inputs. Recalculation uses this saved snapshot and does not reread or change accounting data. Edit and save the scenario to capture newer portfolio balances.

A draft can be saved without an eligible savings asset. Its calculation status is `NO_ELIGIBLE_ASSETS`; no projection is returned until at least one asset is confirmed available. An asset with no recorded value is captured with a zero balance. Disposed assets cannot be marked available.

## Financing options

| Option | Initial Outlay from savings | Loan Principal | Setup Fee | Insurance Fee |
|---|---:|---:|---:|---:|
| Cash Financing | Purchase Price | €0 | €0 | €0 |
| Custom Down Payment Financing | Down Payment + Loan Setup Fee + Insurance Fee | Purchase Price − Down Payment | Fee | `% of Purchase Price` |
| Full Financing | Loan Setup Fee + Insurance Fee | Purchase Price | Fee | `% of Purchase Price` |

Custom Down Payment must be greater than zero and less than Purchase Price. A zero Down Payment is represented by Full Financing; paying the complete Purchase Price is represented by Cash Financing. All options share Purchase Price and Financing Horizon.

## Projection rules

- Initial outlays are withdrawn proportionally across available assets by their current eligible balance. The rule does not optimize account selection by return, product, tax, or legal access.
- In each month, Strata applies each asset's monthly Savings Return first, then applies the loan payment and resulting positive contribution or savings withdrawal.
- Loan payments use standard fixed-rate amortisation. Annual percentage assumptions are divided by 12. A zero-rate loan repays principal evenly. The last loan payment is adjusted by any rounding difference so the remaining balance reaches exactly zero.
- Insurance Fee is a one-time upfront cost applied to loan options only (`CUSTOM_DOWN_PAYMENT`, `FULL`) as a percentage of Purchase Price.
- Positive Monthly Available Amount after a loan payment is allocated proportionally by post-return balance. If all current balances are zero, Strata uses original eligible starting balances; if those are also zero, it splits the contribution equally.
- If a loan payment exceeds Monthly Available Amount, the difference is withdrawn proportionally from post-return balances.
- Monetary inputs and monthly posted amounts use the EUR minor unit and round half-up. Inputs accept at most two fractional digits. Calculations retain extra precision within a month; yearly checkpoints summarize the posted monthly rows.
- Durations are limited to 1–1200 months (100 years) so monthly detail remains bounded.

## Reserve Breaches and funding shortfalls

Emergency Reserve is a warning threshold. Strata checks the balance immediately after the initial outlay (reported as `initial`, or month 0) and after every monthly activity. A breach never blocks comparison or selection.

Projected savings cannot become negative. If an initial outlay exceeds eligible Starting Savings, Strata caps withdrawals at the available balance and reports an Initial Funding Shortfall. If a later monthly shortfall exceeds savings, the remaining balance is capped at zero and the uncovered amount is reported as Monthly Funding Shortfall. Projection continues, and Reserve Breach remains visible when applicable.

## Reference calculation

For the published one-year reference case (Starting Savings €100,000, Purchase Price €10,000, Monthly Available Amount €1,000, savings return 5%, loan rate 8%, no setup fee, no insurance fee), the results are:

| Result | Cash Financing | Custom Down Payment Financing | Full Financing |
|---|---:|---:|---:|
| Initial savings after outlay | €90,000.00 | €95,000.00 | €100,000.00 |
| Loan Principal | €0.00 | €5,000.00 | €10,000.00 |
| Scheduled monthly loan payment | €0.00 | €434.94 | €869.88 |
| Financing Cost | €0.00 | €219.31 | €438.62 |
| Savings Return generated | €4,883.44 | €5,017.94 | €5,152.48 |
| Savings Return difference vs Cash | €0.00 | +€134.50 | +€269.04 |
| Final Scenario Savings Balance | €106,883.44 | €106,798.63 | €106,713.86 |

The final rounded loan payments are €434.97 and €869.94. They clear the remaining principal after the rounded scheduled payments. Cash Financing has zero Financing Cost, while Full Financing retains more savings return; the higher retained return does not produce a higher final balance under these assumptions.

## API and storage

The REST API is prefixed with `/api/v1`; all operations are documented in Swagger at `/swagger` in development and in the Bruno collection under `.bruno/Strata/FinancingScenarios/`.

| Operation | Endpoint |
|---|---|
| List and recalculate saved scenarios | `GET /financing-scenarios` |
| Save a scenario | `POST /financing-scenarios` |
| Read and recalculate a scenario | `GET /financing-scenarios/:id` |
| Update assumptions and capture current balances | `PUT /financing-scenarios/:id` |
| Recalculate the saved input snapshot | `POST /financing-scenarios/:id/recalculate` |
| Delete a saved scenario | `DELETE /financing-scenarios/:id` |

Saved inputs live in the standalone `financing_scenarios` table as JSON. They have no foreign keys to assets, transactions, liabilities, or PortfolioSnapshots. JSON backups include saved scenarios; older version-1 backups without a `financingScenarios` field restore with an empty scenario list.

## Deferred

Terminal Residual Value, overall Scenario Position, multiple lender offers, variable rates, early repayment, refinancing, taxes, inflation, investment risk, ownership costs, salary growth, changing monthly availability, account-selection optimization, transfers, and applying a scenario as a real Portfolio Operation are outside this first version.
