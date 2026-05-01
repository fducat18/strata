---
title: "Mental Model"
---


## Your Portfolio = Everything You Own

There is no "Portfolio" entity or screen in Strata. The concept is simpler:

> **Your portfolio is the sum of all the assets you track.**

- Add assets → they become part of your portfolio automatically
- Dispose of an asset → it is excluded from net worth calculations
- Categories and tags handle all the grouping you need (see below)
- **PortfolioSnapshot** records the total value at a specific moment in time — it is a global snapshot, not a sub-view of a named group

### How Net Worth Works

```
All non-disposed assets
       ↓
Latest AssetSnapshot per asset  (you enter these manually)
       ↓
Sum → PortfolioSnapshot  (created via "Take Snapshot" in the UI or POST /api/v1/portfolio-snapshots)
       ↓
Net Worth Chart (shows your wealth over time)
```

Loans and liabilities are assets with **negative** snapshot values. They subtract from the total automatically — no special configuration needed.

---

## Mental Model — WordPress-Style Classification System

Asset management system uses a **two-layer approach** inspired by WordPress:

### Layer 1: Asset Type (Accounting Classification)

**Purpose**: High-level financial/accounting categorization  
**Cardinality**: ~10/15 types maximum  
**Relationship**: Many-to-one (each asset has exactly ONE type)  
**Examples**:
- CHECKING_ACCOUNT
- SAVINGS_ACCOUNT
- CASH
- REAL_ESTATE
- STOCKS
- CRYPTO
- BONDS
- LOAN
- VEHICLE
- PERSONAL_PROPERTY
- COLLECTIBLES
- BUSINESS
- OTHER

**Think of it as**: "What type of asset is this for accounting/tax purposes?"

---

### Layer 2: Categories (WordPress-Style, Many-to-Many)
**Purpose**: Flexible, multi-dimensional organization  
**Cardinality**: Unlimited, user-defined hierarchy  
**Relationship**: Many-to-many (each asset can belong to MULTIPLE categories)  
**Structure**: Hierarchical (parent/child relationships via `parent_id`)

**Examples**:

#### Hierarchical Categories
- Clothing > T-Shirts > Summer T-Shirts
- Real Estate > Residential > Apartments > Paris
- Furniture > Dining > Wooden Chairs
- Toys > Building Sets > LEGO > Star Wars

#### Cross-Cutting Categories
- Income Generating Assets
- Primary Residence
- Athletic Wear
- Collectibles > Investment Grade
- Multi-Purpose Items
- Office Equipment

**Think of it as**: "What organizational buckets does this belong to?" (Answer: potentially many!)

---

### Layer 3: Tags (Flat Labels)
**Purpose**: Additional metadata and filtering  
**Cardinality**: Unlimited, user-defined  
**Relationship**: Many-to-many (each asset can have MANY tags)  
**Structure**: Flat (no hierarchy)

**Examples**:
- summer, cotton, breathable
- paris, airbnb, sold
- star_wars, vintage, unopened
- wood, stackable, versatile

**Think of it as**: "What additional attributes describe this?"

---

## WordPress Category Logic

Just like WordPress posts, your assets can belong to **multiple categories simultaneously**:

### Example: Summer T-Shirts
✅ Clothing > T-Shirts (hierarchical path)  
✅ Athletic Wear (functional category)  
✅ Casual Wear (style category)

### Example: Paris Apartment
✅ Real Estate > Residential > Apartments (hierarchical path)  
✅ Primary Residence (legal classification)  
✅ Income Generating Assets (financial classification)

### Example: LEGO Set
✅ Toys > Building Sets > LEGO (hierarchical path)  
✅ Collectibles > Investment Grade (purpose)  
✅ Kids Room Items (location)

---

## Why Many-to-Many Categories?

| Scenario | Single Category (Old Model) | Multiple Categories (WordPress Model) |
|----------|----------------------------|--------------------------------------|
| Apartment used as home + rental | Must choose ONE: "Primary Residence" OR "Rental" | BOTH: "Primary Residence" AND "Income Generating Assets" |
| T-shirts for sports + casual | Must choose ONE path | BOTH: "Clothing > T-Shirts" AND "Athletic Wear" AND "Casual Wear" |
| LEGO as toy + investment | Must choose ONE purpose | BOTH: "Toys > LEGO" AND "Collectibles" |

**Benefit**: Assets can be **organized from multiple perspectives** without duplication.

---

## How This Works in Practice

### Creating an Asset
```
Asset: "Summer T-Shirts"
Asset Type: PERSONAL_PROPERTY (choose ONE)
Categories: 
  ✓ Clothing > T-Shirts
  ✓ Athletic Wear
  ✓ Casual Wear
  (select as many as needed)
Tags: summer, cotton, breathable
```

### Querying Assets

**Filter by "Athletic Wear"** → Returns:
- Summer T-Shirts
- Running Shoes
- Yoga Mat

**Filter by "Clothing > T-Shirts"** → Returns:
- Summer T-Shirts
- Winter T-Shirts
- Designer T-Shirts

**Filter by "Income Generating Assets"** → Returns:
- Paris Apartment
- Rental Property Barcelona
- Vending Machine

**Filter by both "Clothing > T-Shirts" AND "Athletic Wear"** → Returns:
- Summer T-Shirts (intersection)

---

## Category Hierarchy

Categories can have **parent/child relationships** just like WordPress:
```
Real Estate (parent)
├── Residential (child)
│   ├── Apartments (grandchild)
│   └── Houses (grandchild)
└── Commercial (child)
    ├── Office Buildings (grandchild)
    └── Retail Spaces (grandchild)
```

An asset can belong to:
- Just "Real Estate" (parent only)
- "Real Estate" AND "Residential > Apartments" (parent + full path)
- "Residential > Apartments" AND "Income Generating Assets" (hierarchy + cross-cutting)

---

## Comparison Table

| Feature | Asset Type | Categories | Tags |
|---------|-----------|-----------|------|
| **Control** | Controlled vocabulary | User-defined | Complete freedom |
| **Structure** | Flat list | Tree hierarchy | Flat labels |
| **Per Asset** | Exactly 1 | 0 to many | 0 to many |
| **Purpose** | Accounting/tax | Organization/navigation | Filtering/metadata |
| **Relationship** | Many-to-one | Many-to-many | Many-to-many |
| **Hierarchy** | No | Yes (parent_id) | No |

---

## Key Principles

1. **Asset Type = Legal/Accounting classification** (required, singular, stable)
2. **Categories = Organizational flexibility** (optional, multiple, hierarchical)
3. **Tags = Descriptive metadata** (optional, multiple, flat)

This gives you:
- ✅ **Precision** (Asset Type for accounting)
- ✅ **Flexibility** (Multiple categories per asset)
- ✅ **Discoverability** (Find assets from multiple angles)
- ✅ **Simplicity** (WordPress-familiar model)

---

## WordPress Comparison

| Feature | WordPress | Your Model |
|---------|-----------|------------|
| Posts/Assets | Posts | Assets |
| Post Type | Post, Page, Custom | Asset Type |
| Categories | Many-to-many + hierarchy | Many-to-many + hierarchy ✓ |
| Tags | Many-to-many, flat | Many-to-many, flat ✓ |

**Your model = WordPress categories + Asset Type for accounting structure**

This is the **most flexible** approach while maintaining clear accounting boundaries via Asset Type.
