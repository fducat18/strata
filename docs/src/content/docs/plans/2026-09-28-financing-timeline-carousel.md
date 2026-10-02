---
title: "2026-09-28: Make financing timelines full width"
description: "Show financing option timelines in full-width horizontally scrollable cards for easier comparison."
---

# Financing Timeline Carousel

## Goal

Make the Cash, Custom Down Payment, and Full Financing timelines easier to inspect by giving each timeline the full available content width and letting users scroll horizontally between them.

## Design

- Replace the three-column timeline grid with a horizontally scrollable row of full-width timeline cards.
- Use scroll snapping and an accessible, keyboard-focusable region to navigate between the three timelines.
- Preserve the existing comparison summary cards and table-level scrolling behavior.

## Verification

- Frontend unit coverage verifies the labelled scroll region and all three timelines.
- Playwright coverage verifies horizontal navigation between timeline cards without causing page-level horizontal overflow.
- Run frontend unit and e2e suites and the docs build.

## Constraints

- No backend, API, or data model changes.
- The worktree contains unrelated uncommitted changes; keep this change limited to the financing comparison UI, its tests, and docs.

## Execution Summary

### Actual changes

- Replaced the three-column timeline grid with full-width, horizontally scrollable cards. The labelled scroll area supports keyboard focus and snap navigation; summary cards and table scrolling remain unchanged.
- Added frontend unit and Playwright coverage and documented how to move between the timelines.

### Deviations

- Playwright's managed Chromium executable was unavailable. The full browser suite ran with installed system Chrome using a temporary config in `/private/tmp`; no browser path or config was added to the repository.
- No product or implementation decisions changed from the approved plan.

### Test results

- Backend unit: **35 suites, 348 tests passed**; 97.33% statements and 97.91% lines.
- Backend e2e: **9 suites, 73 tests passed**.
- Frontend unit: **74 files, 465 tests passed**; 95.03% statements/lines and 91.45% functions.
- Frontend e2e: **13 passed, 22 skipped** because the backend API was not running; both financing scenario tests passed.
- Frontend build and docs build passed; the docs build generated 108 pages. The build reported the existing `/404` route priority warning.

### Commit and release

- Commit SHA: **none**; the changes remain uncommitted. The repository's `.git` directory is read-only in this environment, and the worktree contains unrelated changes that must remain untouched.
- The latest tag is `v1.4.0`; this bug fix would use patch version `v1.4.1`. No release tag or release notes were created because Git metadata is read-only and a release from the current dirty worktree could include unrelated work.

### Key discoveries

- The repository did not have Playwright's pinned browser installed, but system Chrome was available and supported the full e2e run.
