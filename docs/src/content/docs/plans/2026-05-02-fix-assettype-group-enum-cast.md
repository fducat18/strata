---
title: "2026-05-02: Fix AssetTypeGroup enum cast in Prisma repository"
description: Fixes TypeScript build failure in Docker caused by passing string where Prisma expects AssetTypeGroup enum, and adds AGENTS.md enforcement via instruction file.
---

## Status: Complete

## Context

After merging all branches into `main` (see [2026-05-02 merge plan](/plans/2026-05-02-merge-and-docker-fix)), running `npm run docker:reset` still failed — this time during the backend Docker build step (`npx nest build`):

```
src/infrastructure/repositories/prisma-asset-type.repository.ts:30:51 - error TS2322:
Type 'string' is not assignable to type 'AssetTypeGroup'.
```

The bug was introduced when the `group` field was added to `AssetType` (plan D1). The repository adapter was wired to pass `data.group` directly from the domain port type (`string`) to Prisma's typed input (`$Enums.AssetTypeGroup`).

---

## Root Cause

Hexagonal architecture correctly keeps Prisma types OUT of the domain layer:
- `AssetType` entity: `group: string` ✅
- `CreateAssetTypeData` / `UpdateAssetTypeData` ports: `group: string` ✅

But the infrastructure adapter (`PrismaAssetTypeRepository`) did not perform the necessary cast at the boundary:

```ts
// Before (broken)
data: { code: data.code, label: data.label, group: data.group }
//                                          ^^^ string ≠ $Enums.AssetTypeGroup

// After (fixed)
data: { code: data.code, label: data.label, group: data.group as $Enums.AssetTypeGroup }
```

---

## Fix

**File:** `backend/src/infrastructure/repositories/prisma-asset-type.repository.ts`

1. Added `$Enums` to the `@prisma/client` import
2. Cast `data.group as $Enums.AssetTypeGroup` in `create()`
3. Cast `data.group as $Enums.AssetTypeGroup` in `update()`

The cast is safe because the domain validation layer (class-validator on DTOs + domain entity) ensures only valid enum string values reach the repository.

---

## Test Added (AGENTS.md Convention #5 — Bug-to-Test)

New file: `backend/test/asset-type.e2e-spec.ts`

Covers:
- POST `/api/v1/asset-types` with a `group` enum value → 201
- PUT `/api/v1/asset-types/:id` to update group → 200
- DELETE `/api/v1/asset-types/:id` → 200

Uses real NestJS app + in-memory SQLite. Would have caught the compile error at e2e time.

---

## AGENTS.md Enforcement Improvement

Created `.github/instructions/agents-plan-checklist.instructions.md` with `applyTo: '**/*'`.

The `.github/instructions/` mechanism is the strongest enforcement tool for AI agents in this repo: these files are explicitly shown with a forced-read reminder before any code change. By adding the 8 AGENTS.md conventions as a mandatory checklist here, they cannot be missed.

---

## Trade-offs

- **Cast vs. validation**: using `as` cast is appropriate here because the infrastructure layer is the boundary where Prisma types belong. The domain stays clean.
- **Instruction file vs. AGENTS.md**: AGENTS.md remains the prose source of truth; the instruction file is a compact checklist derivative that triggers the enforcement mechanism.
