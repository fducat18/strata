---
title: "2026-09-18: Sort asset list columns"
description: "Add one-click ascending and descending sorting to the asset list table columns."
---

# Sortable Asset List Columns

## Summary

Add one-click, bidirectional sorting to the Assets table for Name, Type, Current Value, Categories, Tags, and Status. Sorting remains client-side and session-local, matching the existing snapshot date-sort behavior.

## Implementation Changes

- Add local sort-column and sort-direction state to `AssetListPage`.
- Default to Name ascending. Selecting another column starts ascending; clicking the active column toggles ascending/descending.
- Apply sorting after the existing disposed, search, and type filters.
- Sort text columns case-insensitively, Current Value numerically using decimal-safe comparison, and Categories/Tags by deterministic alphabetically joined names.
- Place empty categories/tags and null Current Value last.
- Add accessible clickable header buttons with direction indicators. Keep Actions unsortable.
- No backend, API, schema, Bruno, or Swagger changes; `GET /api/v1/assets` already supplies the required fields.

## Tests and Acceptance Criteria

- Unit tests cover all six sort controls, default and toggled ordering, text/numeric/category/tag/status comparisons, null and empty values, filtering, and accessible labels.
- A Playwright test with mocked asset data covers representative header interactions and visible row order.
- Backend unit/e2e and frontend unit/e2e gates pass, with frontend coverage at least 90%.

## Release Sequencing

- Implement and test on `feat/sort-assets`, then merge into `main`.
- Run the release only from a clean, updated `main` because `scripts/release.mjs` rejects dirty trees, bumps six version files, commits the release, pushes the current branch, and creates/pushes the tag.
- Check the latest tag immediately before choosing the next semver version. This feature is expected to receive a minor release.
- Add the release note document and releases index entry after the release script succeeds, as required by the script and project conventions.

## Execution Summary

### Actual changes

- Added client-side sorting to the Assets table for Name, Type, Current Value, Categories, Tags, and Status.
- Added accessible direction indicators and sort labels, with Name ascending as the default and empty values kept last.
- Added frontend unit coverage, a mocked Playwright e2e scenario, frontend documentation, and the plan index entry.
- No backend or API changes were needed.

### Deviations

- The standard Playwright-managed browser was unavailable locally, so the suite was run with system Chrome through a temporary configuration outside the repository. No machine-specific executable path or repository configuration was added.
- Existing unrelated frontend TypeScript/Vite issues remain in legacy portfolio components, e2e smoke typings, and older test fixtures.
- The release was intentionally not run on `feat/sort-assets`; it must run from clean `main` after merge.

### Test results

- Backend unit tests with coverage: ✅ 323 tests; 97.53% statements, 97.89% lines, 96.57% functions, 80.44% branches.
- Backend e2e tests: ✅ 70 tests across 8 suites.
- Frontend unit tests with coverage: ✅ 443 tests across 69 files; 95.65% statements/lines, 91.84% functions, 88.05% branches.
- Frontend e2e: ✅ 10 tests passed, including the new asset-sort flow; 22 existing backend-dependent scenarios were skipped because no backend was running.
- Documentation build: ✅ 101 pages generated successfully.
- `git diff --check`: ✅ clean.

### Commit SHA(s)

- `3bd5836` — `feat(front): sort asset list columns`

### Key discoveries

- The existing `GET /api/v1/assets` response already contains every field required for sorting, so no controller, service, repository, Bruno, or Swagger work was necessary.
- `scripts/release.mjs` requires a clean tree and publishes the current branch before tagging; release remains a post-merge `main` operation.
