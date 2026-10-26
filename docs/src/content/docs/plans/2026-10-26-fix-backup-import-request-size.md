---
title: "2026-10-26: Fix large JSON backup imports"
description: "Raise the bounded JSON request limit and accept export metadata so larger backups restore successfully."
---

## Context

Settings parses the selected JSON backup and posts it to `/api/v1/admin/restore`. Nest's default Express JSON parser has a 100 KiB limit, so the reported 164 KB request is rejected before reaching the controller. Strata exports also include `exportedAt`, which the strict `RestoreBackupDto` currently does not accept.

## Approach

- Configure a shared Express parser setup for production and e2e apps with a finite 10 MiB limit for JSON, preserving URL-encoded parsing behavior.
- Accept optional ISO `exportedAt` metadata in `RestoreBackupDto`; restore logic continues to ignore it.
- Add isolated e2e regression coverage for a payload larger than 164 KiB and invalid timestamps, plus a unit test for parser configuration.
- Document the limit and restore metadata in `docs/src/content/docs/backup.md`.

## Decisions

- The 10 MiB JSON cap applies globally, as selected during planning.
- `exportedAt` is optional and must be an ISO date string.
- No endpoint, dependency, migration, or frontend code change is required.

## Validation

Run backend build and lint; all four required backend/frontend unit and e2e gates; and the docs build. The oversized restore test uses a fresh `seed: false` database.

## Execution Summary

**Commits**: `2be492dfb7d0ef82f9b7827ab7192349ef6e3c52` (fix), `d8b91a78fdaddcac4e2ed679823e8bf8c75d24e1` (docs), merged to `main` and pushed; released as `v1.6.2` with release notes (`273fe45`, `9595a25`).

### Actual changes

- Added shared Express body-parser configuration with a 10 MiB JSON cap and
  unchanged URL-encoded options; disabled Nest's default parser in production
  and e2e app setup.
- Accepted optional ISO 8601 `exportedAt` metadata in the restore DTO and
  documented its Swagger schema.
- Added isolated e2e coverage for a backup larger than 164 KiB and invalid
  timestamps, plus a unit test for parser registration.
- Documented the size cap, HTTP 413 behavior, and optional export metadata.

### Deviations from plan

- The oversized e2e restores the previous `DATABASE_URL` after cleaning its
  isolated app because the shared test helper mutates this process-wide value.
- Ran the frontend version generator before the prescribed direct Vitest
  command because `npx` bypasses the package's `pretest` hook.
- The semver release was deferred until CI went green on `main`, per the
  corrected land-on-main process; `v1.6.2` was then released with notes.

### Test results

| Gate | Result |
|---|---|
| Backend build | ✅ Passed |
| Backend unit | ✅ 351 tests passed; coverage thresholds passed |
| Backend e2e | ✅ 77 tests passed |
| Frontend unit | ✅ 449 tests passed; 95.70% statements, 84.46% branches, 97.41% functions, 97.06% lines |
| Frontend e2e | ✅ 14 passed; 22 skipped because backend was unavailable at `localhost:3000` |
| Docs build | ✅ Passed; existing Astro warnings remain |
| Backend lint | ⚠️ 467 errors and 1 warning across 52 files; new helper, spec, DTO, and e2e helper pass targeted lint, remaining touched-file findings are on unchanged lines |

### Key discoveries

- Raising the parser limit exposed a second import blocker: global whitelist
  validation rejected the exporter's `exportedAt` field.
- `createIsolatedE2EApp` changes process-wide `DATABASE_URL`; the new test
  restores it so later tests keep using their own database.
