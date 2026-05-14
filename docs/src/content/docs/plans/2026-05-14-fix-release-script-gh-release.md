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

**Commit**: `3ea0b8c`

### Actual changes
- `scripts/release.mjs`: added step 9 (`gh release create`), `--no-gh-release` flag, updated header + success message + `--no-push` instructions
- `docs/src/content/docs/versioning.md`: documented step 9 and `--no-gh-release` flag
- `gh release create v1.1.1` run retroactively to populate `/releases` for the already-pushed tag

### Deviations from plan
None — implemented exactly as planned.

### Test results
| Gate | Result |
|---|---|
| Script dry-run | ✅ shows `[dry-run] gh release create v1.2.0 --generate-notes --title "v1.2.0"` |

### Key discoveries
- The GitHub `/releases` page only shows Release objects, not bare git tags. Tags always appear at `/releases/tag/X` but that page shows a "draft" UI — the proper release page requires a Release object created via API or `gh`.
- `--generate-notes` produces a markdown changelog from commits between the previous tag and the new one — no manual release notes needed.
