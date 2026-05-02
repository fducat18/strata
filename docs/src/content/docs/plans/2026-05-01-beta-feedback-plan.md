---
title: "Plan: 2025-01 Beta Feedback"
description: Approved implementation plan from first beta test session. Covers snapshot automation, transaction wiring, AssetType groups, chart improvements, and CRUD.
sidebar:
  order: 2
---

# 2025-01 — Beta Feedback Plan

**Status**: ✅ Complete
**Source**: First full beta test session — user identified ~12 bugs/improvements
**Branch**: `feat/beta-feedback-plan`
**Verification**: All acceptance criteria verified during Phase 0 recovery (see [Post-Implementation Improvements Plan](/docs/plans/2026-05-02-beta-feedback-post-implementation-improvements/) for refinements discovered during verification)

---

## Design Decisions (resolved before implementation)

- **Snapshot automation**: Portfolio snapshot auto-calculated on every AssetSnapshot create/update/delete — zero clicks
- **Quantity**: Keep optional (useful for stocks, crypto, collectibles)
- **Asset Type taxonomy**: Two-level: keep 13 codes + add `group` field (FINANCIAL, REAL_ESTATE, PERSONAL_PROPERTY, PHYSICAL_COLLECTIONS, LIABILITIES, OTHER)
- **Transaction wiring**: Creating an asset → acquisition date + price → auto-creates ACQUIRE transaction + initial snapshot (mandatory, every asset). Disposing an asset → disposal date + price → auto-creates DISPOSE transaction + portfolio cascade recalculation.
- **Loans in chart**: Stacked bars — green assets above axis, red liabilities below (Finary-style)
- **Net worth filters**: Toggle by asset type / by category / by group (4 modes: "Total only" / "By asset type" / "By category" / "By group")

### Portfolio Snapshot Recalculation — Design

- **Architecture**: Synchronous call — `AssetSnapshotService` directly calls `portfolioSnapshotService.recalculateFromDate(date)` before returning
- **Trigger**: Any AssetSnapshot create / update / delete
- **Cascade**: Recalculate ALL PortfolioSnapshots for date X AND all dates > X where a PortfolioSnapshot already exists
- **Formula per date D**: SUM of the latest AssetSnapshot value per non-disposed asset where `observedAt <= D`
- **Upsert**: Always upsert a PortfolioSnapshot for date X; update existing ones for dates > X
- **No cron job, no EventEmitter, no DB trigger** — simple synchronous, testable call

---

## Group A — Critical Bugs

### A1: Auto-run migrations on NestJS startup

In `backend/src/main.ts bootstrap()`, run `prisma migrate deploy` before starting the NestJS server.

### A2: Delete `backend/dev.db` + `.gitignore` update

Old SQLite file from before `prisma.config.ts` migration.

### A3: Include `currentValue` in `GET /api/v1/assets` response

Enrich the response with the latest AssetSnapshot value per asset (null if none).

---

## Group B — Snapshot Automation

### B1: Auto-calculate portfolio snapshot on AssetSnapshot events

Remove "Take Snapshot" button. Net worth is always current.

### B2: Let user set `observedAt` date when creating an AssetSnapshot

Date picker defaults to today.

---

## Group C — Transaction Wiring

### C1: Auto-create ACQUIRE transaction when creating an asset

Every asset must have exactly 1 ACQUIRE transaction. Created atomically with the asset.

### C2: Auto-create DISPOSE transaction when marking an asset as disposed

0 or 1 DISPOSE transaction per asset. Triggers portfolio snapshot cascade.

---

## Group D — Data Model

### D1: Add `group` field to AssetType — reset migrations

6 groups: FINANCIAL, REAL_ESTATE, PERSONAL_PROPERTY, PHYSICAL_COLLECTIONS, LIABILITIES, OTHER.
Migration reset (pre-production clean slate).

---

## Group E — Net Worth History Chart

### E1: Stacked bar chart with 4 filter modes

"Total only" / "By asset type" / "By category" / "By group"
Liabilities shown in red/below axis (Finary-style).

---

## Group F — CRUD Improvements

### F1: Category and Tag rename (PUT endpoints + edit UI)

### F2: Asset edit with all fields (including acquisition date)

### F3: Asset Types CRUD page

---

## Group G — Display

### G1: Assets table shows EUR value instead of quantity

---

## Group H — Documentation

- H1: Architecture.md — snapshot recalculation design
- H2: Architecture.md — AssetType group taxonomy
- H3: Architecture.md — Transaction wiring flows
- H4: dev-setup.md — remove manual migration step
- H5: Feature pages — 4 chart filter modes
- H6: Roadmap — ADJUST transaction v2 vision
- H7: Create AGENTS.md (8 permanent conventions)
- H8: This document

---

## Group I — Tests

- I1: Backend unit tests (cascade scenarios, transaction auto-create)
- I2: Backend e2e tests (currentValue, rename endpoints, cascade, group, dispose)
- I3: Frontend unit tests (chart modes, table EUR column, modals)
- I4: Runtime smoke test checklist (13 scenarios in docker:dev)

---

## Acceptance Criteria (plan is done when all of these pass)

- [ ] `npm run docker:reset` completes without errors
- [ ] Dashboard loads with seeded data (no dummy test data)
- [ ] Asset Allocation pie chart shows actual % values
- [ ] Net Worth History chart shows bars
- [ ] Create asset with date + price → appears in table with EUR value
- [ ] Add AssetSnapshot → net worth updates automatically (no button click)
- [ ] Historical snapshot → chart updates for that past date
- [ ] Rename category → persists
- [ ] Rename tag → persists
- [ ] `/asset-types` page loads with 13 types + group badges
- [ ] Mark asset as disposed → disappears from net worth
- [ ] Settings export works
- [ ] All doc site links use port 8001
- [ ] Backend unit tests ≥ 90% coverage ✅
- [ ] Backend e2e tests ✅
- [ ] Frontend unit tests ≥ 90% coverage ✅
- [ ] Frontend e2e tests ✅
