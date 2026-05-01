---
title: "ADR-002: Portfolio Entity Removal"
description: Why the Portfolio entity was removed and what replaced it.
---

# ADR-002: Portfolio Entity Removal

**Status:** Accepted  
**Date:** 2024

---

## Context

The original Strata data model included a `Portfolio` entity as a container for assets (one-to-many: Portfolio → Assets). A Portfolio had a name, currency, and owned a collection of assets. Portfolio snapshots tracked the total value of a portfolio over time.

As the app evolved, it became clear that for a single-user personal finance tracker, the Portfolio abstraction added complexity without proportional value.

---

## Problem

- A single user tracks **their own net worth** — there is conceptually only one portfolio (everything you own)
- Having a mandatory Portfolio requirement forced users to create a named container before adding any asset
- Portfolio snapshots were computationally redundant with asset-level snapshots (net worth = sum of all asset values)
- The frontend required "select a portfolio" workflows even though there was only ever one
- All API endpoints had `/portfolios/:id/assets/:id` nesting, adding URL complexity

---

## Decision

**Remove the Portfolio entity entirely.** Assets are first-class citizens. Net worth is computed as the sum of the latest `AssetSnapshot.value` for all non-disposed assets.

**Replaced by:**

| Old | New |
|-----|-----|
| Portfolio (container) | *(none — user IS the portfolio)* |
| Portfolio.currency | Per-asset currency on Asset entity |
| Portfolio snapshot | `PortfolioSnapshot` (standalone: computed net worth at a point in time) |
| Portfolio.name for grouping | Categories + Tags on assets |

**PortfolioSnapshot** is retained as a standalone snapshot of the user's total computed net worth at a given moment (useful for historical tracking). It has no FK to a removed Portfolio.

---

## Grouping Strategy

Users who want to group assets (e.g., "retirement" vs "liquid" vs "real estate") should use:

- **Categories** — hierarchical tree (e.g., Real Estate > Primary Residence)
- **Tags** — flat labels (e.g., "EUR", "illiquid", "joint")

These provide richer, more flexible grouping than a single flat Portfolio abstraction.

---

## Consequences

- Single-step asset creation (no Portfolio prerequisite)
- Net worth dashboard is always the complete picture — no per-portfolio filtering needed
- `computeCurrentValue()` sums all non-disposed asset snapshots directly
- Future multi-user / multi-portfolio support would require re-introducing a Portfolio entity — tracked in v2 backlog

---

## v2 Consideration

If multi-portfolio support is needed (e.g., household finances), the recommended approach is to re-introduce `Portfolio` as an optional grouping of assets with a nullable `portfolioId` FK on Asset, defaulting all existing assets to a "Personal Net Worth" portfolio.
