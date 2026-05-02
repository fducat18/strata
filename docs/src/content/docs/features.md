---
title: "✨ Features"
---


## Universal Asset Tracking

Strata organizes assets into **6 groups** (enum field on AssetType):

- **FINANCIAL** — cash, checking, savings, stocks, bonds, crypto
- **REAL_ESTATE** — properties, rentals
- **PHYSICAL_COLLECTIONS** — LEGO, books, art, collectibles
- **PERSONAL_PROPERTY** — wardrobe, furniture, household items, electronics, vehicles
- **LIABILITIES** — mortgages, loans
- **OTHER** — miscellaneous assets 

## Flexible Organization

WordPress-style categories (many-to-many) plus hierarchical structure.

- Hierarchical: `Real Estate > Residential > Apartments`
- Cross-cutting: `Income Generating Assets`, `Primary Residence`
- Tags for additional metadata: `paris`, `vintage`, `collectible`

## Value Tracking

Monitor asset values over time with snapshots and transaction history. 

- **Asset Snapshots** — Record values at any point in time per asset
- **Transaction History** — Track acquisitions, disposals, and adjustments
- **Net Worth Snapshot** — Capture total net worth at any moment via POST `/api/v1/portfolio-snapshots`
- **Growth Visualization** — Understand how your wealth evolves over time

## Net Worth Overview

See your complete net worth across all asset types — loans and liabilities automatically reduce the total via negative snapshot values.

### Net Worth History Chart

The chart shows your portfolio value over time and supports **4 filter modes**:

| Mode | Description |
|------|-------------|
| **Total only** | Single bar per date — total portfolio value |
| **By group** | Stacked bars by asset type **group** (FINANCIAL, REAL_ESTATE, PERSONAL_PROPERTY, PHYSICAL_COLLECTIONS, LIABILITIES, OTHER) |
| **By asset type** | Stacked bars per individual asset type code |
| **By category** | Stacked bars per user-defined category |

**LIABILITIES group** assets always appear **below the zero axis** (red bars) — reflecting that loans reduce your net worth.

Portfolio snapshots are **calculated automatically** every time you add or modify an asset snapshot — no manual action needed.

## 🔮 Planned (v2)

- Budgeting and expense tracking
- Goal setting and progress tracking
- Multi-currency support
- Bank API / MCP integration via `ADJUST` transactions — new asset snapshot values flow in automatically, triggering the same portfolio snapshot recalculation cascade
