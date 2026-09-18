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
