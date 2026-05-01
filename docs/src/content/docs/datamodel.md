---
title: "Data Model"
---


## Entity-Relationship Diagram (Database / ORM)

👉 Persistence-oriented
```mermaid
erDiagram
    ASSET ||--o{ TRANSACTION : has
    ASSET ||--o{ ASSET_SNAPSHOT : "has (manually entered)"
    ASSET }o--|| ASSET_TYPE : "typed as"
    ASSET }o--o{ ASSET_CATEGORY : ""
    ASSET_CATEGORY }o--|| CATEGORY : ""
    ASSET }o--o{ ASSET_TAG : ""
    ASSET_TAG }o--|| TAG : ""

    PORTFOLIO_SNAPSHOT {
        uuid id PK
        decimal value
        string currency
        string notes
        datetime observed_at
        datetime created_at
    }

    ASSET {
        uuid id PK
        uuid asset_type_id FK
        string name
        decimal quantity
        boolean disposed
        datetime created_at
        datetime updated_at
        string created_by
        string updated_by
    }

    ASSET_SNAPSHOT {
        uuid id PK
        uuid asset_id FK
        decimal value
        string currency
        datetime observed_at
    }

    TRANSACTION {
        uuid id PK
        uuid asset_id FK
        string type
        decimal unit_price
        decimal quantity
        string currency
        datetime occurred_at
    }

    ASSET_TYPE {
        uuid id PK
        string code UK
        string label
        datetime created_at
        datetime updated_at
    }

    CATEGORY {
        uuid id PK
        string name UK
        uuid parent_id FK
    }

    TAG {
        uuid id PK
        string name UK
    }

    ASSET_CATEGORY {
        uuid asset_id FK
        uuid category_id FK
    }

    ASSET_TAG {
        uuid asset_id FK
        uuid tag_id FK
    }
```

`PORTFOLIO_SNAPSHOT` is **standalone** — it has no foreign key to any other table. It records the total net worth at a moment in time, computed from asset snapshots.

## Conceptual Flow

👉 Behavior-oriented

```mermaid
graph TD
    A[Asset] --> B[AssetSnapshot]
    B --> C["Sum of latest values\n(non-disposed assets)"]
    C --> D[PortfolioSnapshot]
    D --> E[Net Worth Chart]
```

## Transaction Types

- `ACQUIRE`: Buying/receiving an asset (increases quantity)
- `DISPOSE`: Selling/giving away an asset (decreases quantity)
- `ADJUST`: Manual correction/adjustment

## Design Decisions

### 1. Why no Portfolio entity?

There is no `Portfolio` table. Categories and tags handle all grouping and organization needs. An asset can belong to multiple categories (hierarchical or cross-cutting) and carry any number of tags. A dedicated "portfolio" row would just be an extra layer of indirection with no added value for a single-user app.

### 2. Why is PortfolioSnapshot standalone?

`PortfolioSnapshot` captures the **total** net worth at a moment in time. It is not "owned" by a portfolio because there is no portfolio entity. It is a global snapshot of everything you track — a record of the sum, not a sub-view of a group.

### 3. Base currency: EUR (hardcoded for alpha)

All monetary values are stored in EUR. Multi-currency support is planned for a future version. `currency` fields on snapshots are informational and currently always `"EUR"`.

### 4. Loan values are stored negative

Liabilities (asset type `LOAN`) store negative values in `AssetSnapshot.value` (e.g., `-€180,000` for a mortgage). Net worth sums all asset snapshot values — positives increase it, negatives decrease it.

```
Net Worth = Sum of latest AssetSnapshot.value per non-disposed asset

Example:
  Checking Account:    +€10,000
  Paris Apartment:    +€420,000
  Mortgage Loan:      -€180,000
  ─────────────────────────────
  Net Worth:          +€250,000
```
