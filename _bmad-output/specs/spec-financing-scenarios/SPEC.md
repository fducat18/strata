---
id: SPEC-financing-scenarios
companions:
  - calculation-model.md
  - ../../../docs/src/content/docs/features/CONTEXT.md
  - ../../../docs/src/content/docs/adr/adr-004-non-mutating-financing-scenarios.md
sources:
  - ../../../docs/src/content/docs/features/financing-scenarios-poc.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability.

# Financing Scenarios POC

## Why

Strata users need to compare funding a major purchase with cash, a loan, or both before taking a real-world action. The comparison must answer three separate questions—financing cost, savings return retained or lost, and liquidity safety—while keeping the recorded portfolio unchanged. This matters now because the decision depends on per-asset returns, availability, monthly cash flow, and reserve protection rather than on purchase price alone.

## Capabilities

- **CAP-1**
  - **intent:** Users can save and compare a hypothetical Financing Scenario without changing recorded assets, liabilities, transactions, or PortfolioSnapshots.
  - **success:** A before-and-after portfolio integrity test shows that saving or recalculating any scenario leaves all accounting records unchanged.

- **CAP-2**
  - **intent:** Users can compare Cash Financing, Custom Down Payment Financing, and Full Financing for the same Purchase Price and Financing Horizon.
  - **success:** One result set contains all three options using identical shared inputs and option-specific outlays, principal, payments, and projections.

- **CAP-3**
  - **intent:** Users can confirm which savings assets are available for the purchase and provide a constant Savings Return Assumption for each asset.
  - **success:** Eligible balances and their individual rates affect Starting Savings and projections; unavailable assets remain excluded and unchanged.

- **CAP-4**
  - **intent:** The system can project each financing option month by month using proportional withdrawal, per-asset returns, fixed Monthly Available Amount, and Standard Loan amortisation.
  - **success:** The calculation reproduces the published one-year reference example, including interest, principal, savings returns, and final balances.

- **CAP-5**
  - **intent:** Users can inspect yearly checkpoints and monthly detail across the Financing Horizon.
  - **success:** A 60-month scenario exposes five yearly summaries and every monthly payment, return, savings balance, remaining loan balance, and reserve-breach status.

- **CAP-6**
  - **intent:** Users can compare Financing Cost with Savings Return retained or lost relative to Cash Financing.
  - **success:** Every option reports Financing Cost and a signed Savings Return difference versus Cash Financing, with Purchase Price excluded from Financing Cost.

- **CAP-7**
  - **intent:** Users can see the Final Scenario Savings Balance and the first Reserve Breach without being prevented from comparing options.
  - **success:** The result identifies an initial or monthly breach in which savings fall below Emergency Reserve, displays a warning that the emergency reserve is at risk, and still permits comparison and selection.

## Constraints

- The scenario is hypothetical: calculations must not create or mutate assets, liabilities, transactions, or PortfolioSnapshots.
- The same Purchase Price and Financing Horizon apply to every option; the first version uses the Standard Loan duration as the horizon.
- Asset availability is an explicit user-confirmed input. Asset type names must not determine availability.
- Unavailable assets are excluded from Starting Savings, outlays, withdrawals, returns, and comparison results; their real balances remain untouched.
- Eligible assets retain separate Savings Return Assumptions. The scenario uses proportional withdrawal by current eligible balance and makes that rule visible; it does not optimise account selection.
- Monthly Available Amount is fixed for the whole scenario. Salary growth and changing monthly availability are outside this POC.
- Savings returns and loan amortisation are calculated monthly; yearly checkpoints summarize the monthly timeline rather than replace it.
- Reserve Breach is a visible warning, never a hard validation error, and must identify the first breach point. The initial balance after the upfront outlay is checked before month 1; an initial breach is reported as `initial` (month 0), followed by any later monthly breach.
- Projected savings balances never become negative. When an outlay or monthly shortfall exceeds the remaining eligible savings, the balance is capped at zero and the uncovered amount is reported as a funding shortfall. The comparison continues, while the result warns that the emergency reserve is at risk whenever the post-outlay or monthly balance is below Emergency Reserve.
- A saved draft may contain no eligible savings assets, but a completed projection requires at least one confirmed eligible asset. The calculation reports `NO_ELIGIBLE_ASSETS` rather than silently discarding positive contributions or inventing an account.
- Monetary inputs and monthly posted values use the scenario currency's minor unit and round half-up. Calculations retain higher precision within a month; the final loan payment is adjusted to clear any remaining principal after rounded scheduled payments. Yearly checkpoints summarize the monthly posted timeline.
- Positive monthly contributions are allocated proportionally to each asset's current post-return projected balance. If all current balances are zero, starting-balance weights are used; if those are also zero, the contribution is split equally among eligible assets. The rule does not optimize for return rate.
- Cheapest Financing means the lowest Financing Cost, defined as loan interest plus Loan Setup Fee. It is not a universal recommendation and remains separate from Savings Return and Final Scenario Savings Balance.
- The result exposes material assumptions: eligible assets and rates, availability, withdrawal rule, Monthly Available Amount, Emergency Reserve, loan terms, fees, Purchase Price, and Financing Horizon.
- The primary comparison view makes these four outputs immediately visible for Cash Financing, Custom Down Payment Financing, and Full Financing: total loan cost, Savings Return retained or lost, Final Scenario Savings Balance, and Reserve Breach warning.

## Non-goals

- Terminal Residual Value, overall Scenario Position, and automatic residual-value estimates.
- Variable rates, multiple lender offers, early repayment, refinancing, or taxes.
- Inflation, investment risk, account-selection optimisation, transfers, or account-specific legal/product rules.
- Ownership costs such as insurance, maintenance, or fuel.
- Salary growth, changing monthly availability, or a workflow that applies a scenario as a real Portfolio Operation.

## Success signal

For the published one-year reference inputs, the three options reproduce the expected Financing Cost, Savings Return difference, and Final Scenario Savings Balance while keeping Cash Financing's zero loan cost distinct from Full Financing's higher retained return. For a 60-month scenario, users can find the exact first Reserve Breach month from monthly detail while yearly checkpoints remain available for comparison.

## Assumptions

- “Saved Financing Scenario” means a persistent planning record whose data and projections remain separate from accounting records; the source does not prescribe the storage or API shape.
- The reference calculation establishes the monthly sequence for the POC: savings return is applied to current balances before either a positive contribution or a negative monthly withdrawal is applied.

## Resolved Edge-Case Policies

- An upfront outlay that exceeds Starting Savings is capped at the available eligible balance. The result records `Initial Funding Shortfall` for the uncovered amount and continues the comparison with projected savings at zero.
- If a loan payment exceeds Monthly Available Amount, the difference is withdrawn proportionally from post-return eligible balances. The balance is capped at zero and the uncovered amount is recorded as `Monthly Funding Shortfall`; the loan still follows its scheduled amortisation.
- A zero net monthly contribution changes neither savings nor the loan schedule. A positive contribution uses the deterministic allocation rule above.
- A zero loan rate uses `principal / number of months` and produces no interest. Custom Down Payment Financing requires `0 < Down Payment < Purchase Price`; the endpoint values are represented by Full Financing and Cash Financing.
- Invalid numeric inputs are rejected: monetary inputs must be non-negative, values must be finite, the horizon must be positive, and rate assumptions must produce valid monthly balances.
