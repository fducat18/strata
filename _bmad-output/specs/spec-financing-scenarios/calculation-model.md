# Financing Scenarios POC Calculation Model

This companion carries the line-item calculation and output contract for `SPEC.md`.

## Inputs

Each Saved Financing Scenario contains:

| Input | Rule |
|---|---|
| Purchase Price | Same currency amount for every option. |
| Emergency Reserve | Warning threshold for Scenario Savings Balance. |
| Monthly Available Amount | Fixed amount available each month for loan payment or savings rebuilding. |
| Eligible savings assets | Each asset has current balance, availability confirmation, and its own annual Savings Return Assumption. |
| Withdrawal rule | Proportional withdrawal by current balance across eligible assets. |
| Standard Loan | Fixed annual Loan Rate Assumption, duration in years, and optional Loan Setup Fee. |
| Financing Horizon | Standard Loan duration in the POC; all options use the same number of months. |
| Scenario currency | The portfolio currency and its minor unit; the POC calculates one currency per scenario. |

Unavailable assets may be displayed for confirmation but are excluded from Starting Savings, all projected withdrawals, all projected returns, and all scenario results. Their real portfolio balances are never changed.

## Option derivation

Let `P` be Purchase Price, `D` be the user-entered Down Payment, and `F` be Loan Setup Fee.

| Option | Initial Outlay from savings | Loan Principal | Loan Setup Fee |
|---|---:|---:|---:|
| Cash Financing | `P` | `0` | `0` |
| Custom Down Payment Financing | `D + F` | `P - D` | `F` |
| Full Financing | `F` | `P` | `F` |

Custom Down Payment must represent a partial payment: it must satisfy `0 < D < P`. A zero down payment is represented by Full Financing and a down payment equal to `P` is represented by Cash Financing. Cash and loan options use the same `P` and Financing Horizon.

Starting Savings is the sum of current balances for confirmed eligible assets only. An upfront outlay reduces those assets proportionally:

`withdrawal for asset i = outlay × current eligible balance i / total current eligible balance`

If the outlay exceeds Starting Savings, each eligible balance is reduced to zero and the uncovered amount is recorded as `Initial Funding Shortfall`; the projection never becomes negative. The result immediately checks the remaining savings against Emergency Reserve and displays an `Emergency Reserve at Risk` warning when the threshold is breached. This initial breach is recorded as `initial` (month 0), before any monthly row.

The proportional rule is deterministic, visible in the scenario, and does not choose accounts by rate, product, tax treatment, or legal availability. A completed projection requires at least one confirmed eligible asset. A saved draft may contain none, but calculation returns `NO_ELIGIBLE_ASSETS` rather than silently discarding positive contributions or inventing an account.

## Monthly projection

The POC uses nominal annual assumptions divided by 12 and compounds savings returns monthly. For each month in the Financing Horizon:

1. Apply each eligible asset's monthly Savings Return Assumption to its current projected balance.
2. Calculate Standard Loan interest from the opening remaining principal and reduce the loan by the scheduled payment's principal component. A zero-principal option has zero payment, interest, and principal. A zero-rate loan uses `principal / number of months`.
3. Calculate `net contribution = Monthly Available Amount - loan payment`.
4. If net contribution is positive, allocate it to eligible assets in proportion to each asset's current post-return projected balance. If all current balances are zero, use starting-balance weights; if those are also zero, split the contribution equally across eligible assets.
5. If net contribution is negative, withdraw its absolute value proportionally from the current post-return balances. Cap each balance at zero and record the uncovered amount as `Monthly Funding Shortfall`; do not create a negative savings balance. The loan still follows its scheduled amortisation.
6. Sum eligible asset balances into Scenario Savings Balance.
7. Mark Reserve Breach if Scenario Savings Balance is below Emergency Reserve, recording the first monthly breach unless an initial breach was already recorded.

The reference case establishes this ordering: the monthly return is applied before either the positive contribution or the negative monthly withdrawal. A zero net contribution changes neither savings nor the loan schedule. Reserve Breach is always a warning and never blocks comparison.

### Precision and rounding

Monetary inputs and monthly posted values use the scenario currency's minor unit and round half-up. Calculations use higher precision within a month, then round each monthly savings return, loan interest, loan principal, payment, contribution or withdrawal, and balance at the monthly boundary. The scheduled loan payment is rounded once for normal months; the final payment is adjusted to equal final interest plus the remaining principal so the loan balance reaches exactly zero. Financing Cost is the sum of rounded monthly interest plus Loan Setup Fee. Savings Return is the sum of rounded monthly asset returns. Yearly checkpoints sum the posted monthly rows and use the final row's ending balances.

For a fixed-rate loan with monthly rate `r`, principal `L`, and `n` months, the scheduled payment is the standard equal-payment amortisation amount:

`payment = L × r / (1 - (1 + r)^(-n))`

For `r = 0`, use `payment = L / n`. The displayed scheduled payment may differ from the final adjusted payment by a minor-unit rounding correction.

Each monthly payment is exposed as interest plus principal. Total Financing Cost is accumulated loan interest plus Loan Setup Fee; Purchase Price and Down Payment are not financing costs.

## Result contract

Each option exposes at least:

- option type, Purchase Price, Down Payment, Initial Outlay, and Loan Principal;
- monthly loan payment and total Financing Cost;
- Savings Return generated over the horizon;
- signed Savings Return difference versus Cash Financing;
- Final Scenario Savings Balance;
- Reserve Breach flag, first breach point (`initial` or a month number), and Emergency Reserve at Risk warning, when applicable;
- Initial Funding Shortfall, monthly and cumulative Funding Shortfall, when applicable;
- calculation status, including `NO_ELIGIBLE_ASSETS` for a draft that cannot yet produce a completed projection;
- the material assumptions used for the calculation;
- the complete monthly Scenario Timeline and yearly checkpoints.

Each monthly timeline row exposes the values needed to inspect the calculation: month number, savings return, loan interest, loan principal, loan payment, net monthly contribution, per-asset contribution or withdrawal allocation, monthly Funding Shortfall, Scenario Savings Balance, remaining loan balance, and Reserve Breach status. Yearly checkpoints summarize the corresponding monthly rows; they do not recalculate the scenario at annual granularity.

“Savings Return retained or lost” is the signed difference between an option's generated Savings Return and Cash Financing's generated Savings Return. Returns common to every option are not treated as a financing benefit.

## Reference calculation

Inputs:

| Input | Value |
|---|---:|
| Starting Savings | €100,000 |
| Purchase Price | €10,000 |
| Monthly Available Amount | €1,000 |
| Financing Horizon | 1 year |
| Savings Return Assumption | 5% annually, compounded monthly |
| Loan Rate Assumption | 8% annually, compounded monthly |
| Loan Setup Fee | €0 |

Expected results:

| Result | Cash Financing | Custom Down Payment Financing | Full Financing |
|---|---:|---:|---:|
| Initial savings after outlay | €90,000 | €95,000 | €100,000 |
| Down Payment | €10,000 | €5,000 | €0 |
| Loan Principal | €0 | €5,000 | €10,000 |
| Monthly loan payment | €0 | €434.94 | €869.88 |
| Monthly amount added to savings | €1,000 | €565.06 | €130.12 |
| Financing Cost after 1 year | €0 | €219.31 interest | €438.62 interest |
| Savings Return generated | €4,883.44 | €5,017.94 | €5,152.48 |
| Savings Return difference vs Cash | €0 | +€134.50 | +€269.04 |
| Scenario Savings Balance after 1 year | €106,883.44 | €106,798.63 | €106,713.86 |
| Reserve warning | depends on Emergency Reserve | depends on Emergency Reserve | depends on Emergency Reserve |

The displayed scheduled payments are €434.94 and €869.88; the final rounded payments are adjusted to €434.97 and €869.94 so the loan balances reach zero. The expected results above use the monthly minor-unit rounding policy defined above.

The reference demonstrates that Full Financing can retain more savings return while Cash Financing has both zero Financing Cost and the higher final savings balance under these assumptions. The outputs must remain separate rather than collapsing into one recommendation.

If Savings Return Assumption rises to 10% while the other reference inputs remain unchanged, Full Financing leaves approximately €116.54 more Scenario Savings Balance after one year. This demonstrates why the return assumption is mandatory.

## Withdrawal-rule example

For two eligible assets and a €10,000 Cash Financing outlay:

| Asset | Starting balance | Annual return |
|---|---:|---:|
| Account A | €10,000 | 2% |
| Account B | €90,000 | 6% |

Proportional withdrawal leaves €9,000 in Account A and €81,000 in Account B. Its first-year return is €5,040, distinct from withdrawing only from Account A (€5,400) or only from Account B (€5,000). This is why the allocation rule is part of the product contract and must be visible.

## Deferred complexity

Terminal Residual Value, Scenario Position, refinancing, taxes, inflation, investment risk, ownership costs, salary growth, changing monthly availability, automatic residual estimates, early repayment, multiple lender offers, account-selection optimisation, transfers, and applying a scenario to the real portfolio are later iterations.
