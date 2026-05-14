---
title: "2026-05-14: Fix release script — add GitHub Release creation"
description: "release.mjs only pushes a git tag; it does not create a GitHub Release object. Add gh release create so /releases page is populated."
---

# Fix release script — add GitHub Release creation

## Problem

`scripts/release.mjs` creates and pushes a git tag but does **not** call the GitHub API to create a Release object. As a result:

- Tag appears at `/releases/tag/vX.Y.Z` (GitHub auto-links all tags)
- But `/releases` page stays empty — no release shows up
- Users can't see changelogs, download assets, or find the release on the Releases page

The v1.1.1 tag was pushed but no Release was created. v1.1.0 has a Release (created manually).

## Fix

Add `gh release create vX.Y.Z --generate-notes --title "vX.Y.Z"` at the end of the release script, after `git push origin vX.Y.Z`.

- Uses `gh` CLI (already available, already authenticated)
- `--generate-notes` auto-generates markdown changelog from commits since the previous tag
- `--no-gh-release` flag added as escape hatch for environments without `gh`
- Script header comment updated

## AGENTS.md Compliance Checklist

| # | Convention | Check |
|---|---|---|
| 1 | Doc update | Plan doc saved; update script header comment |
| 2 | All 4 test gates | No app code changed; script change only |
| 4 | Endpoint coverage | N/A |
| 8 | Plan history | This doc |
| 9 | Infra test gate | Verify `npm run release -- X.Y.Z --dry-run` still works |
| 12 | Execution Summary | Append after completion |
| 13 | Doc grep | Update docs mentioning the release script behavior |

## Files to Modify

| File | Change |
|---|---|
| `scripts/release.mjs` | Add `gh release create` after tag push; add `--no-gh-release` flag |
| `docs/src/content/docs/versioning.md` | Note that release script creates GitHub Release |

## Acceptance Criteria

1. `npm run release -- X.Y.Z --dry-run` prints the `gh release create` step
2. After a real release, the tag appears both as a git tag AND as a GitHub Release on `/releases`
3. v1.1.1 GitHub Release created retroactively
4. `--no-gh-release` flag skips the `gh` step cleanly

## Execution Summary

**Commit**: _TBD_

### Actual changes
<!-- filled after -->

### Deviations from plan
<!-- filled after -->

### Test results
| Gate | Result |
|---|---|
| Script dry-run | ✅ / ❌ |

### Key discoveries
<!-- filled after -->
