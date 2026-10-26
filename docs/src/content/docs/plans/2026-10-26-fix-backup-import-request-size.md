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

Pending implementation and required validation.
