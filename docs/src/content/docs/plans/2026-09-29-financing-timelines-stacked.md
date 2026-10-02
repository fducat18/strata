---
title: "2026-09-29: Stack financing timelines"
description: "Show each financing timeline as a full-width card stacked vertically instead of in a horizontal carousel."
---

# Stack Financing Timelines

## Goal

Make the Cash Financing, Custom Down Payment Financing, and Full Financing timelines easier to inspect by displaying each as a full-width card, one after another vertically.

## Design

- Replace the horizontal snap-scrolling timeline region with a vertical stack of full-width timeline cards.
- Preserve the existing option order, comparison summary cards, card contents, and table-level horizontal scrolling.
- Keep timeline layout changes confined to the frontend; no API or data model changes.

## Verification

- Frontend unit coverage verifies all three timeline cards render in order and no horizontal carousel region remains.
- Playwright coverage verifies the cards stack vertically, can be reached through page scrolling, and do not cause page-level horizontal overflow.
- Run backend unit and e2e, frontend unit and e2e, and the docs build.

## Constraints

- Leave unrelated worktree changes untouched.
- The existing [carousel plan](./2026-09-28-financing-timeline-carousel) records the previous implementation; this plan records its replacement.

## Execution Summary

### Actual changes

- Replaced the horizontal timeline carousel with three full-width cards stacked vertically in financing option order.
- Updated component and browser coverage for vertical ordering, scrolling, and the absence of page-level horizontal overflow. Updated the financing feature docs.

### Deviations

- Playwright's pinned Chromium was unavailable. The full browser suite ran with system Chrome and a temporary config outside the repository.
- The complete frontend e2e suite did not pass in this worktree. Financing scenarios passed separately; unrelated asset, dashboard, categories, and tags checks failed, and two tests did not run.

### Test results

- Backend unit: **35 suites, 348 tests passed**; 97.33% statements and 97.91% lines.
- Backend e2e: **9 suites, 73 tests passed**.
- Frontend unit: **passed** with configured coverage thresholds met.
- Financing frontend e2e: **2 passed**. Full frontend e2e: **26 passed, 7 failed, 2 did not run**; failures were outside the financing scenarios.
- Docs build: **109 pages built**. The existing `/404` route priority warning remains.

### Commit and release

- Commit SHA: **none**; this work remains uncommitted.
- Latest tag checked: `v1.4.0`. No `v1.4.1` release was created; the worktree contains unrelated uncommitted changes and Git metadata is read-only in this environment.

### Key discoveries

- The full frontend browser run reports unrelated page-level failures in the current worktree. The financing scenario flow and its new stacked-layout assertions pass in isolation.
