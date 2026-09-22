---
title: "Financing Scenarios POC Scope"
description: "The smallest non-mutating financing comparison that accounts for savings returns and reserve warnings."
---

**Status:** Working POC scope  
**Date:** 2026-09-22

## POC promise

Before making a major purchase, the user can compare financing options using their
current liquid savings and see the financial consequences without changing Strata's
recorded assets, liabilities, or transactions.

The POC answers three different questions:

1. **Which option is the cheapest financing?** The option with the lowest Financing
   Cost: loan interest plus Loan Setup Fee. The Purchase Price is not a financing
   cost.
2. **What is the trade-off between borrowing and using savings?** Show the total
   loan cost alongside the savings return retained by each option and the return
   difference created by using savings for the purchase.
3. **What safety impact does each option have?** Show the Final Scenario Savings
   Balance and any Reserve Breach warning.

These results must remain separate. A loan can be more expensive financing while
still producing a higher Final Scenario Savings Balance if the return on the savings
retained by borrowing is high enough.

Terminal Residual Value and overall Scenario Position are deferred until a later
iteration; they are not required to ship this POC.

## Primary result display

The first comparison view must make these four outputs immediately visible for
Cash Financing, Custom Down Payment Financing, and Full Financing:

1. Total loan cost.
2. Savings returns retained or lost compared with Cash Financing.
3. Final Scenario Savings Balance.
4. Reserve Breach warning, when applicable.

The scenario is calculated month by month. The result view should show yearly
checkpoints for long horizons such as a 60-month loan, with the monthly timeline
available for detail and for locating the exact month of a Reserve Breach.

## In scope

- A hypothetical, Saved Financing Scenario that never mutates the real portfolio.
- Cash Financing, Full Financing, and Custom Down Payment Financing.
- Purchase amount and, for the mixed option, a user-provided Down Payment.
- Starting Savings derived from the user's liquid cash-like assets and confirmed
  as eligible for this scenario.
- An explicit per-asset confirmation of whether each savings asset is available to
  fund this purchase. Asset type alone must not decide availability.
- A user-provided Emergency Reserve, used as a warning threshold.
- A user-provided fixed Monthly Available Amount. Salary growth and changing
  monthly availability are outside the POC.
- A mandatory constant Savings Return Assumption for each eligible savings asset
  (for example, PEE, Livret A, LEP, or Assurance Vie), applied monthly to that
  asset's projected balance.
- One fixed-rate Standard Loan with a duration in years, an annual Loan Rate
  Assumption, and an optional Loan Setup Fee.
- Monthly loan amortisation: each payment is split into interest and principal.
- A month-by-month Scenario Timeline showing savings and remaining loan balance.
- A yearly summary of the Scenario Timeline for long horizons, with monthly detail
  available when the user needs to inspect a payment, return, or Reserve Breach.
- Reserve Breach warnings when a Scenario Savings Balance falls below the
  Emergency Reserve. A breach does not prevent comparison or selection.
- A comparison of total loan cost, savings return generated, and savings return
  difference versus Cash Financing.

## Savings asset treatment

Starting Savings is the combined current value of eligible savings assets, but the
projection keeps each asset's own Savings Return Assumption. This avoids treating
a PEE, Livret A, LEP, and Assurance Vie as if they earned the same return.

An asset can have a balance without being available to fund the scenario. Blocked
or unavailable assets are excluded from Starting Savings, are not reduced by Cash
Financing or a Down Payment, and do not contribute to the financing comparison.
Their real portfolio balances remain untouched. Availability is a user-confirmed
scenario assumption; the POC must not hard-code legal, tax, or product rules from
an asset name alone.

Before implementation, the POC must also define how a Cash Financing payment or
Down Payment is withdrawn across several savings assets. This is a product
decision, not an implementation detail: the same Starting Savings total can
produce different Savings Returns depending on which asset is reduced. The POC
uses proportional withdrawal by current balance and must not silently optimize
account selection.

### Why the allocation rule matters

Assume two savings assets and a €10,000 Cash Financing payment:

| Asset | Starting balance | Annual return |
|---|---:|---:|
| Account A | €10,000 | 2% |
| Account B | €90,000 | 6% |

The total Starting Savings is €100,000 in every case, but the first-year return
differs depending on the withdrawal rule:

| Withdrawal rule | Savings remaining | First-year return |
|---|---|---:|
| Withdraw from Account A | €0 at 2% + €90,000 at 6% | €5,400 |
| Withdraw from Account B | €10,000 at 2% + €80,000 at 6% | €5,000 |
| Withdraw proportionally | €9,000 at 2% + €81,000 at 6% | €5,040 |

The €400 difference changes the financing comparison even though the purchase price
and total Starting Savings are identical. For the quick POC, proportional withdrawal
is the deterministic rule; user-selected withdrawal order, account
constraints, and transfers can be added later. This rule must be visible in the
scenario rather than hidden in the calculation.

## Reference calculation

This is the reference example for the POC's calculation and presentation. For
readability, it uses one eligible savings pool at a single rate; the production
calculation applies the same monthly logic per eligible asset using the explicit
availability and proportional-withdrawal rules above.

### Inputs

| Input | Value |
|---|---:|
| Starting Savings | €100,000 |
| Purchase Price | €10,000 |
| Monthly Available Amount | €1,000 |
| Financing Horizon | 1 year |
| Savings Return Assumption | 5% annually, compounded monthly |
| Loan Rate Assumption | 8% annually, compounded monthly |
| Loan Setup Fee | €0 |

### Results

| Result | Cash Financing | Custom Down Payment Financing | Full Financing |
|---|---:|---:|---:|
| Initial savings after outlay | €90,000 | €95,000 | €100,000 |
| Down Payment | €10,000 | €5,000 | €0 |
| Loan Principal | €0 | €5,000 | €10,000 |
| Monthly loan payment | €0 | €434.94 | €869.88 |
| Monthly amount added to savings | €1,000 | €565.06 | €130.12 |
| Financing Cost after 1 year | €0 | €219.31 interest | €438.61 interest |
| Savings Return generated | €4,883.43 | €5,017.95 | €5,152.47 |
| Savings Return difference vs Cash | €0 | +€134.52 | +€269.05 |
| Scenario Savings Balance after 1 year | €106,883.43 | €106,798.64 | €106,713.86 |
| Reserve warning | depends on Emergency Reserve | depends on Emergency Reserve | depends on Emergency Reserve |

In this example, Cash Financing leaves €169.56 more in Scenario Savings Balance and
has no Financing Cost. The mixed option pays €5,000 from savings and borrows
€5,000; Full Financing keeps the entire €10,000 purchase amount in savings and
borrows the full price.

The return comparison is shown explicitly: Full Financing generates €269.05 more
Savings Return than Cash Financing, but costs €438.61 in interest, so Cash Financing
still leaves the higher final savings balance. The relevant return comparison is
the return on the additional retained purchase amount—not the return on all
€100,000, because Cash Financing also earns a return on its remaining €90,000.

If the Savings Return Assumption rises to 10% while the other inputs remain the
same, Full Financing leaves approximately €116.54 more Scenario Savings Balance
after one year. This is why savings return is a required POC input rather than an
optional refinement.

## POC guardrails

- A Reserve Breach is a visible warning, never a hard validation error.
- Reserve Breach warnings identify the first month in which the Scenario Savings
  Balance falls below the Emergency Reserve.
- The comparison must show the assumptions that materially affect its result:
  eligible savings assets, each asset's return, the withdrawal rule, Monthly
  Available Amount, Emergency Reserve, loan terms, and fees.
- “Cheapest Financing” is a cost metric, not a universal recommendation. The POC
  must keep it distinct from Savings Return and Final Scenario Savings Balance.
- Financing comparisons do not create assets, loans, transactions, or
  PortfolioSnapshots.
- The same purchase amount and Financing Horizon are used across options so the
  financing comparison remains meaningful.
- Existing savings returns common to all options are not treated as a financing
  benefit; only the difference created by each option affects the comparison.

## Deferred complexity

The POC does not include variable rates, multiple lender offers, early repayment,
refinancing, taxes, inflation, investment risk,
ownership costs such as insurance or maintenance, salary growth, changing monthly
availability, Terminal Residual Value, overall Scenario Position, automatic
residual-value estimates, or an “apply scenario” workflow that records a real
Portfolio Operation.
