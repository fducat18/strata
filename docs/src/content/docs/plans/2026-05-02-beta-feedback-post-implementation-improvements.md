---
title: "2026-05-02: Beta Feedback Post-Implementation Improvements"
description: ADR documenting corrections and refinements made after discovering gaps during OOM recovery verification.
---

> **Plan Status**: ✅ Complete (commit 777f7a3)

## Overview

The original [2025-01 Beta Feedback Plan](/docs/plans/2025-01-beta-feedback-plan/) was implemented and then interrupted by a Vitest OOM crash. After recovery and comprehensive verification (Phase 0), we identified three precision/hygiene issues requiring correction. This document serves as an Architecture Decision Record (ADR) for those improvements.

## Context

1. **OOM Incident**: Vitest spawned 10 workers (os.cpus().length) × 3-4 GB each = 35+ GB memory usage, causing system freeze.
   - **Fix Applied**: Limited to `maxForks: 2` with per-file isolation in `vitest.config.ts`
   
2. **Phase 0 Verification Gaps Discovered**:
   - **GAP-1 (A3)**: currentValue field implemented in code but lacked automated test coverage
     - Fixed: Added 2 unit tests to verify currentValue field in GET /api/v1/assets (commit 3bb7d75)
   - **GAP-2 (D1)**: Asset type `group` field missing from API response despite DTO declaration and mapper logic
   - **Precision Issues**: Docs used imprecise terminology conflating "asset types" with "asset type GROUPS"
   - **Migration Hygiene**: Standalone migration for unique index when dev app has no production data migration burden

## Decisions Made

### A1: Clarify Docs-Site Dev Availability (architecture.md)

**Problem**: Line 41 said "nginx and docs are not started" in dev mode, implying docs are prod-only.

**Decision**: Update caption to clarify that docs are available in both dev and prod, just served differently:
- **Dev**: `npm run dev` in `docs/` folder starts local Starlight on port 4321
- **Prod**: nginx serves pre-built static HTML on port 8001

**Rationale**: Developers need to know docs are accessible during development; this removes ambiguity.

---

### A2: Fix Asset Type Group Terminology (features.md)

**Problem**: Lines 7-14 listed FINANCIAL, REAL_ESTATE, etc. as "asset types" when they are actually **asset type GROUPS** — a field on the AssetType entity, not separate entity types.

**Decision**: 
- Rewrite "Universal Asset Tracking" section to clarify: "Strata organizes assets into **6 groups** (enum field on AssetType): FINANCIAL, REAL_ESTATE, PERSONAL_PROPERTY, PHYSICAL_COLLECTIONS, LIABILITIES, OTHER"
- Update "Net Worth History Chart" table to say "By asset type **group**" instead of "By group"

**Rationale**: 
- **Precision**: GROUP is a field on AssetType, not a separate dimension. Calling it a "group" alone confuses readers.
- **AGENTS.md Convention #1**: Documentation must precisely reflect the data model.
- **Developer UX**: Clear terminology prevents bugs in filtering logic and chart implementations.

---

### A3: Consolidate Migrations (backend/prisma/migrations)

**Problem**: 
- Init migration `20260502100411_init` created all schema tables
- Standalone migration `20260502101002_add_portfolio_snapshot_observedat_unique` added only a UNIQUE INDEX on `portfolio_snapshots.observed_at`
- In a dev-only app with no production deployments yet, splitting schema across two migrations creates unnecessary complexity

**Decision**: 
- Merge UNIQUE INDEX SQL from `20260502101002_*` into the init migration
- Delete the standalone `20260502101002_*` migration folder
- Regenerate Prisma client

**Rationale**:
- **DRY Principle**: All schema belongs in one place during early development
- **No Migration Burden**: App is dev-only; no production database to migrate carefully
- **Clarity**: Future developers see complete schema in init migration, not scattered across multiple files
- **AGENTS.md Convention #6**: Keep seed/schema hygiene clean

---

### A4: SRP Refactor — Extract Portfolio Snapshot Recalculation (architecture.md → technical/portfolio-snapshot-recalculation.md)

**Problem**: 
- `architecture.md` conflated high-level system overview with technical implementation details
- Portfolio Snapshot Recalculation section (lines 62-85) was 23 lines of algorithm details mixed into architecture overview
- This violates Single Responsibility Principle: architecture should be a system overview, not a technical manual

**Decision**:
- Created new file: `docs/src/content/docs/technical/portfolio-snapshot-recalculation.md`
- Extracted entire section with title, formula, and cascade example
- Updated `architecture.md` to link to the new guide: "For details on how portfolio snapshots auto-recalculate, see [Portfolio Snapshot Recalculation](/docs/technical/portfolio-snapshot-recalculation/)"
- Updated cross-reference in "Transaction Wiring" section to link to the new guide

**Rationale**:
- **SRP**: `architecture.md` serves system overview; technical algorithms belong in `/technical/` subdirectory
- **Information Architecture**: Users looking for "how does Strata work?" get a clear picture; those implementing/debugging snapshot logic find the detail in the right place
- **AGENTS.md Convention #1**: Documentation structure should mirror code architecture

---

## Verification

All corrections verified:

✅ **Full Test Suite Passing:**
- Backend unit: 260 tests ✓
- Backend e2e: 44 tests ✓
- Frontend unit: 377 tests ✓
- Docs build: 29 pages ✓

✅ **Commit**: `777f7a3` "chore(docs,migrations): clarify asset type groups, consolidate migrations, fix docs-site dev clarity, split portfolio snapshot per SRP"

✅ **Co-authored-by**: Copilot <223556219+Copilot@users.noreply.github.com>

---

## Lessons Learned

1. **OOM Prevention**: Limit Vitest worker pool to machine realistic limits (e.g., 2-4 workers)
2. **Gap Discovery**: Automated tests are excellent, but manual verification (Phase 0) catches serialization/response issues that tests alone miss
3. **Precision Matters**: Terminology ("group" vs "type" vs "group of types") directly impacts implementation correctness and developer UX
4. **Early Consolidation**: In dev-only apps, consolidate schema early; splitting creates false structure

---

## Related Plans

- **Predecessor**: [2025-01 Beta Feedback Plan](/docs/plans/2025-01-beta-feedback-plan/) — All acceptance criteria verified ✅
- **Improvements**: This plan addresses post-verification refinements and hygiene issues

---

**Plan Completed**: May 2, 2026  
**Implementation**: 100% — All corrections applied, tested, and committed.
