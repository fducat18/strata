---
title: "ADR-004: Non-Mutating Financing Scenarios"
description: Financing comparisons remain hypothetical until the user records a real portfolio operation.
---

**Status:** Accepted
**Date:** 2026-09-20

## Decision

The first financing feature will evaluate **Financing Scenarios** separately from the user's recorded assets, liabilities, and transactions. Comparing cash, loan, or combined financing must not modify the current portfolio. A later, explicit workflow may record the chosen real-world action as a Portfolio Operation.

This boundary keeps planning safe and reversible while preserving the existing asset model as a record of actual holdings and obligations.

## Concrete example

For a hypothetical €30,000 car purchase with a €300 Loan Setup Fee, the three initial Financing Options could look like this:

| Option | Paid from savings now | New loan | Portfolio effect while comparing |
|---|---:|---:|---|
| Cash Financing | €30,000 | €0 | None |
| Full Financing | €300 fee | €30,000 | None |
| Custom Down Payment Financing | €10,000 + €300 fee | €20,000 | None |

The comparison may project savings, loan balance, and the car's Terminal Residual Value, but these remain hypothetical until the user explicitly records a Portfolio Operation.

## Consequences

- Scenario calculations need their own hypothetical inputs and projections.
- The user's current net worth and asset history remain unchanged while exploring options.
- Any future “apply this scenario” workflow must be explicit and distinguish planning from accounting.
