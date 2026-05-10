---
title: "Import/Export Fix + SQLite DB Export"
---

## Context

Issue: `issues/todo/import-export.md`

Two problems reported from the `/settings` page:

1. **Bug**: Export → Import round-trip fails with `"Invalid backup format: missing version or data."`
2. **Feature request**: Can the export be a `.db` file instead of (or in addition to) JSON, so it can be opened directly in SQLite viewers (e.g. VSCode SQLite extension)?

A third issue discovered during investigation:

3. **Bug**: `backend/prisma/schema.prisma` was corrupted — line 1 had the path string
   `/Users/fducat/WORKSPACE/strata/issues/todo/feedback-and-fixes.md` prepended directly
   before `generator client {`. The `generator client { provider = "prisma-client-js" }`
   block is **mandatory** even with Prisma 7 + `prisma.config.ts` (the config file only
   handles datasource URL). The corruption only broke `prisma generate`/`prisma migrate`;
   the running app was unaffected because the client is pre-generated.

---

## Root Cause (JSON Import Bug)

| Layer | Field name used |
|---|---|
| Backend (`exportBackup`) | `schemaVersion` |
| Frontend `BackupPayload` interface | `version` ← **wrong** |
| Frontend `isParsedBackup` guard | checks `v.version` ← **fails** |
| Frontend fallback assembler | uses `version: '1.0'` ← **wrong value too** |
| Frontend restore call | sends `version` field ← backend DTO expects `schemaVersion` |

When the user exported the JSON, the file contained `schemaVersion`. When imported, the
frontend guard looked for `version` → not found → "Invalid backup format" error.

---

## Approach

### Part 0 — Fix corrupted `schema.prisma`
- Strip the garbage path prefix from line 1
- Run `npx prisma validate` to confirm

### Part 1 — Fix JSON import/export field name mismatch
Rename `version` → `schemaVersion` throughout the frontend layer:
- `front/src/lib/api/backup.ts` (`BackupPayload` interface)
- `front/src/stores/backupStore.ts` (`ParsedBackup` interface)
- `front/src/components/settings/useBackupImport.ts` (guard + restore payload)
- `front/src/components/settings/useBackupExport.ts` (fallback assembler)
- Unit tests: `backupStore.test.ts`, `backup.test.ts`
- E2e test: `backup.spec.ts` (this test was using `version: '1.0'` → regression would have been caught)

### Part 2 — Add raw SQLite `.db` export
- **Backend**: new `GET /api/v1/admin/backup/sqlite` endpoint streaming the raw `.db` file
  (reads `DATABASE_URL`, strips `file:` prefix, resolves path, streams bytes with
  `Content-Type: application/x-sqlite3`)
- **Frontend**: new "Export as .db" button in `BackupSection`, `backupApi.exportDb()`
- **Docs**, **Bruno**, **tests** updated

---

## Files Changed

### Part 0
- `backend/prisma/schema.prisma` — remove garbage path prefix from line 1

### Part 1 (bug fix)
- `front/src/lib/api/backup.ts`
- `front/src/stores/backupStore.ts`
- `front/src/components/settings/useBackupImport.ts`
- `front/src/components/settings/useBackupExport.ts`
- `front/src/stores/__tests__/backupStore.test.ts`
- `front/src/lib/api/__tests__/backup.test.ts`
- `front/e2e/backup.spec.ts`

### Part 2 (feature)
- `backend/src/application/services/backup/backup.service.ts`
- `backend/src/presentation/controllers/admin.controller.ts`
- `backend/src/application/services/backup/backup.service.spec.ts`
- `backend/test/admin-backup.e2e-spec.ts`
- `front/src/lib/api/backup.ts`
- `front/src/components/settings/useBackupExport.ts`
- `front/src/components/settings/BackupSection.tsx`
- `front/src/lib/api/__tests__/backup.test.ts`
- `.bruno/Strata/Admin/Get SQLite DB.bru`
- `docs/src/content/docs/backup.md`

---

## Acceptance Criteria

- [ ] Export JSON → import JSON round-trip completes without error
- [ ] "Export as .db" button downloads a `.db` file openable in SQLite viewers
- [ ] `GET /api/v1/admin/backup/sqlite` → 200 `Content-Type: application/x-sqlite3`
- [ ] All backend unit tests pass (≥90% coverage)
- [ ] All backend e2e tests pass
- [ ] All frontend unit tests pass (≥90% coverage)
- [ ] Frontend e2e `backup.spec.ts` passes with corrected `schemaVersion` payload
