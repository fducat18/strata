---
title: "Personal Finance Planning Context"
description: "Defines the language for evaluating major purchases and their financing without changing the user's recorded portfolio."
date: 2026-09-22
---

# Personal Finance Planning Context

This context defines the language for evaluating major purchases and their financing without changing the user's recorded portfolio. It complements Strata's existing asset-tracking language.

## Planning and Accounting

**Financing Scenario**:
A hypothetical comparison of ways to fund a major purchase, such as paying cash, borrowing, or combining both. A financing scenario does not change the user's current portfolio.
_Avoid_: Budget, transaction, forecast (unless referring specifically to a time-based projection)

**Portfolio Operation**:
An intentional real-world financial action recorded in Strata that changes the user's assets or liabilities, such as acquiring a vehicle or taking out a loan.
_Avoid_: Scenario, simulation

**Major Purchase**:
An intended acquisition whose price is significant enough that the user wants to compare financing options before committing.
_Avoid_: Expense (the purchase may create an asset), budget item

**Emergency Reserve**:
The minimum liquid savings balance the user wants to preserve. Financing Scenarios warn when projected savings fall below this amount; it does not block comparison.
_Avoid_: Available savings, disposable cash

**Financing Horizon**:
The future period over which a Financing Scenario is compared, including loan repayment and the growth of savings that remain invested or available. In the first version, it equals the Standard Loan duration and is used for all Financing Options.
_Avoid_: Holding period (which may describe how long the user keeps the acquired asset)

**Opportunity Cost**:
The estimated return the user gives up when money is spent or used as a down payment instead of remaining in savings or another investment.
_Avoid_: Loan cost, fee

**Residual Value**:
The estimated market or resale value of a Major Purchase at a future point in its Financing Horizon. Residual Value is outside the first Financing Scenarios version.
_Avoid_: Original price, book value (unless an accounting convention is explicitly being used)

**Value Assumption**:
A user-provided estimate used to project an acquired asset's future value; it is an input to a Financing Scenario, not a recorded fact about the market.
_Avoid_: Valuation, appraisal, prediction

**Down Payment**:
The portion of a Major Purchase paid from savings at the start of a Financing Scenario; the remainder is financed by a loan. In the first version, the user enters it as a currency amount.
_Avoid_: Deposit (which may mean a refundable reservation payment)

**Financing Options**:
The initial comparison includes Cash Financing, Full Financing, and Custom Down Payment Financing.
_Avoid_: Plans (too broad; a plan may contain several financing options)

**Cash Financing**:
A Financing Option in which the full purchase price is paid immediately from savings and no new loan is taken.

**Full Financing**:
A Financing Option in which the full Purchase Price is borrowed, no Down Payment is made, and the Loan Setup Fee plus Insurance Fee are paid from Starting Savings.

**Custom Down Payment Financing**:
A Financing Option in which the user chooses the Down Payment and borrows the remaining purchase price.

**Monthly Available Amount**:
The fixed monthly amount left after normal income and expenses that can be used to support a Financing Scenario's loan payments or rebuild savings in the first version.
_Avoid_: Income, salary, budget (these may include amounts that are not actually available)

**Standard Loan**:
A fixed-rate loan repaid through equal monthly instalments over a duration entered in years, with each payment divided between interest and principal.
_Avoid_: Loan (when the calculation specifically requires a different repayment structure)

**Scenario Savings Balance**:
The projected liquid savings balance for a Financing Scenario after down payments, monthly available amounts, loan payments, and savings returns are applied over time.
_Avoid_: Portfolio balance, total wealth

**Savings Return Assumption**:
The user-provided constant expected annual return for an individual savings asset during the Financing Horizon. Each eligible savings asset may have its own assumption, such as a PEE, Livret A, LEP, or Assurance Vie. Taxes, account charges, inflation, and rate changes are outside the first version.
_Avoid_: Guaranteed interest, investment performance

**Reserve Breach**:
A point in a Financing Scenario where the Scenario Savings Balance falls below the user's Emergency Reserve.
_Avoid_: Insolvency (the scenario may still be financially possible, but violates the user's safety constraint)

**Terminal Residual Value**:
The user-provided Residual Value of the acquired asset at the end of the Financing Horizon. It is not an input in the first Financing Scenarios version.
_Avoid_: Predicted market value, automatic appraisal

**Loan Setup Fee**:
An upfront cost charged for arranging a Standard Loan, paid from Starting Savings and included in the Financing Scenario's loan cost and reserve calculation.
_Avoid_: Ownership cost (such as insurance, maintenance, or fuel)

**Insurance Fee Assumption**:
A one-time financing fee for loan-based options, expressed as a percentage of Purchase Price, paid from Starting Savings at initial outlay. In the current version it applies to Custom Down Payment and Full Financing, not Cash Financing.
_Avoid_: Ongoing ownership insurance, maintenance cost

**Purchase Price**:
The price of the acquired asset plus unavoidable acquisition costs that apply regardless of how it is financed. It is the same across Financing Options.
_Avoid_: Total financing cost, initial outlay

**Initial Outlay**:
The amount paid from Starting Savings at the beginning of a Financing Option. It is the Purchase Price for Cash Financing, and the Down Payment plus Loan Setup Fee plus Insurance Fee for a loan-based option.
_Avoid_: Purchase Price (the outlay may include financing-specific costs)

**Financing Cost**:
The interest, Loan Setup Fee, and Insurance Fee caused by borrowing. Cash Financing has no Financing Cost.
_Avoid_: Purchase Price, ownership cost

**Funding Shortfall**:
The uncovered amount when required outflow exceeds available scenario savings, after proportional withdrawals are capped at zero balance.
_Avoid_: Reserve Breach (a reserve breach can happen without shortfall, and vice versa)

**Scenario Position**:
The potential hypothetical financial position at the end of a Financing Horizon, calculated from the Scenario Savings Balance, Terminal Residual Value, and any remaining loan balance. The first Financing Scenarios version does not calculate it.
_Avoid_: Net worth (reserved for the user's recorded portfolio), profit

**Loan Offer**:
The single set of Standard Loan terms used by a Financing Scenario, including its rate, duration, Loan Setup Fee, and Insurance Fee Assumption.
_Avoid_: Loan product (the scenario does not yet represent a lender's full product rules)

**Loan Rate Assumption**:
The user-provided constant annual percentage used to calculate a Standard Loan's monthly interest.
_Avoid_: Guaranteed lender quote, variable rate

**Starting Savings**:
The combined current value of the user's assets in the `SAVINGS` asset-type group that are confirmed as available to fund a Financing Scenario. Group membership determines which assets are offered as candidates; it does not determine whether a particular balance is accessible for this purchase. The user confirms availability for each candidate. Unchecked assets are excluded from Starting Savings and are never reduced by the scenario. The scenario must define how a purchase or Down Payment is allocated across eligible assets.
_Avoid_: Cash (too narrow), net worth (which includes non-liquid assets and liabilities)

**Saved Financing Scenario**:
A persistent planning record containing a Major Purchase, its assumptions, and its Financing Options; it remains separate from the user's actual portfolio until an explicit future operation records the purchase.
_Avoid_: Asset, transaction, portfolio snapshot

**Scenario Timeline**:
The month-by-month projection of a Financing Scenario's Scenario Savings Balance and remaining loan balance during its Financing Horizon.
_Avoid_: Portfolio history (the timeline is hypothetical and does not create PortfolioSnapshots)

## Use Cases

The following examples are hypothetical planning exercises. They illustrate the domain language and do not modify the user's recorded assets, liabilities, or transactions.

### Car purchase: cash versus loan

Initial assumptions:

| Assumption | Example value |
|---|---:|
| Purchase Price | €30,000 |
| Starting Savings | €50,000 |
| Emergency Reserve | €10,000 |
| Monthly Available Amount | €1,000 |
| Example loan payment | €600/month |

This simplified illustration ignores savings return, Loan Setup Fee, and loan interest so that the monthly cash movement is easy to see.

| Option | Today | After 1 month | After 2 months | Monthly movement |
|---|---:|---:|---:|---|
| Cash Financing | €20,000 | €21,000 | €22,000 | The full €1,000 monthly amount returns to savings |
| Loan Financing | €50,000 | €50,400 | €50,800 | €1,000 available minus €600 loan payment = €400 added to savings |

The first Financing Scenarios version also applies the Savings Return Assumption, loan amortisation, Loan Setup Fee, Insurance Fee Assumption, and Reserve Breach rules. Terminal Residual Value is deferred.

### Future comparison concept: Scenario Position after five years

This simplified illustration describes the deferred Scenario Position concept; the first Financing Scenarios version does not calculate Scenario Position or Terminal Residual Value.

At the end of the Financing Horizon, Strata compares the hypothetical position left by each option:

| Option | Scenario Savings Balance | Car Residual Value | Remaining Loan | Scenario Position |
|---|---:|---:|---:|---:|
| Cash Financing | €28,000 | €18,000 | €0 | €46,000 |
| Loan Financing | €31,000 | €18,000 | €0 | €49,000 |

The loan option has the higher Scenario Position in this simplified example. This does not mean borrowing is always better; the result depends on the savings return, loan cost, monthly payments, reserve, horizon, and Terminal Residual Value.

### Purchase Price versus financing costs

The asset's Purchase Price stays the same. The Initial Outlay and Financing Cost depend on the selected Financing Option.

| Option | Purchase Price | Initial Outlay from savings | Loan Setup Fee | Insurance Fee | Loan Principal |
|---|---:|---:|---:|---:|---:|
| Cash Financing | €30,000 | €30,000 | €0 | €0 | €0 |
| Full Financing | €30,000 | €450 | €300 | €150 | €30,000 |
| Custom Down Payment Financing | €30,000 | €10,450 | €300 | €150 | €20,000 |

In the custom example, the user chooses a €10,000 Down Payment. The €300 Loan Setup Fee and €150 Insurance Fee are paid from savings, and the remaining €20,000 is borrowed.
