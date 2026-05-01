---
title: "✨ Features"
---


## Universal Asset Tracking

Track any asset type with a flexible data model:

- **Financial instruments** (cash, stocks, bonds, crypto). 
- **Physical collections** (LEGO, books, art). 
- **Real estate** (properties, rentals). 
- **Personal property** (wardrobe, furniture, household items, electronics). 
- **Liabilities** (mortgages, loans). 

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

## 🔮 Planned (v2)

- Budgeting and expense tracking
- Goal setting and progress tracking
- Multi-currency support
