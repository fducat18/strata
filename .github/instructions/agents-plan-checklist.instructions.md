---
applyTo: '**/*'
description: 'AGENTS.md — mandatory planning checklist for all AI agents working on Strata'
---

# AGENTS.md Mandatory Checklist

Before presenting any plan and before making any code change, go through this checklist. Every item that applies MUST be addressed. Show this table in every plan.

> Full prose: see `AGENTS.md` at repo root.

## Planning checklist (run through before EVERY plan)

| # | Convention | Check |
|---|---|---|
| 1 | **Documentation**: every feature/fix/decision must update the Astro Starlight doc site (`docs/src/content/docs/`) | Does this change need a doc update? |
| 2 | **All 4 test gates**: backend unit (≥90%) + backend e2e + frontend unit (≥90%) + frontend e2e must ALL pass | Are all 4 gates in acceptance criteria? |
| 3 | **Self-review**: before presenting plan, verify internal consistency, cross-ref all files, map every acceptance criterion to a concrete step | Show a self-review table in the plan |
| 4 | **Endpoint coverage**: every NEW API endpoint → Bruno collection (`.bruno/Strata/`) + Swagger decorators | Adding new endpoints? |
| 5 | **Bug-to-Test**: every bug found via manual/Docker testing → new automated test (unit or e2e) that would have caught it | Is this a bug fix? Write the test first |
| 6 | **Seed isolation**: tests use own data, never touch seeded demo records, clean up after themselves | Do new tests respect this? |
| 7 | **Transaction invariants**: every asset has exactly 1 ACQUIRE and 0 or 1 DISPOSE (service-level, not DB constraint) | Touching asset transactions? |
| 8 | **Plan history**: save plan to `docs/src/content/docs/plans/YYYY-MM-DD-<short-title>.md` BEFORE implementation starts. The plans sidebar is **auto-generated** — no need to edit `docs/astro.config.mjs`. **DD is mandatory — `2026-05-fix-foo.md` (missing day) breaks the Astro build.** Title must be `"YYYY-MM-DD: Short title"` (date-prefixed) — sidebar sorts alphabetically by title, so the date prefix guarantees chronological order. Quote both `title:` and `description:` (unquoted colons break YAML). | Plan saved to doc site? |
| 9 | **Infra test gate**: Dockerfile / docker-compose / build-script changes MUST be verified by running the affected command before declaring done. Run `docker-compose build <service>` for Dockerfile changes. Never declare "done" for infra changes without a successful run. | Touching infra files? Run them. |
| 10 | **Environment compatibility**: Before using platform-specific Docker or shell features, check availability first (`docker buildx version`, `docker compose version`). Do not assume modern tooling (e.g., BuildKit is NOT available in standalone docker-compose v5.x). | Check tool versions first. |
| 11 | **Do-no-harm baseline**: For optimization tasks, document the working baseline before changing anything. Run the command BEFORE and AFTER changes. "Faster is useless if broken." | Optimizing? Verify it works first. |
| 12 | **Plan Execution Summary**: after all test gates pass, append `## Execution Summary` to the plan doc with: actual changes (vs. plan), deviations + reasons, test results, commit SHA(s), key discoveries. | Append before closing task. |
| 13 | **Doc Grep Rule**: before committing any change that renames a path, command, env var, or data location, run `grep -r '<old-value>' docs/` and update every match inline. Never commit code that leaves stale references in the docs. | Renaming paths/files/commands? grep docs first. |
| 14 | **Semver Release Rule** — 3 mandatory steps: **(1)** `git tag --sort=-v:refname \| head -5` to get current version. **(2)** `npm run release -- X.Y.Z` (patch/minor/major). **(3)** Create `docs/src/content/docs/releases/vX-Y-Z.md` + add row to `index.md`. Plan is NOT closed until all 3 steps are done. | Did you do all 3 steps? |

## Naming convention for plan docs
```
docs/src/content/docs/plans/YYYY-MM-DD-<short-title>.md
```
- ✅ `2026-05-13-fix-tauri-build-nest-not-found.md` with `title: "2026-05-13: Fix tauri-build.sh — nest: command not found"`
- ❌ `2026-05-fix-tauri-build-nest-not-found.md` — **missing day → Astro build fails**
- ❌ `title: "Fix tauri-build"` — **missing date prefix → sidebar sorts alphabetically by title, not chronologically**
- Always include valid YAML frontmatter with `title: "YYYY-MM-DD: ..."` and quoted `description:`

## Test gate commands

> ⚠️ **`npm test` alone does NOT enforce coverage thresholds.** Only the commands below enforce them.

```bash
# Backend — threshold-enforcing commands
cd backend && npm run build        # TypeScript compile
cd backend && npm run test:cov     # ← unit tests WITH coverage thresholds (≥90% stmt/fn/line, ≥80% branch)
cd backend && npm run test:e2e     # e2e tests

# Frontend — threshold-enforcing commands
cd front && npx vitest run --coverage   # ← unit tests WITH coverage thresholds (≥90% stmt/fn/line, ≥80% branch)
cd front && npm run test:e2e            # e2e (Playwright)
```

**Coverage thresholds (identical for backend and frontend):**

| Metric | Threshold |
|---|---|
| Statements | 90% |
| Branches | 80% |
| Functions | 90% |
| Lines | 90% |

**Rule**: never add a new exported function, hook, or method without a unit test. Untested exports drop function coverage below the CI gate.

## Release notes doc format

```
# File: docs/src/content/docs/releases/vX-Y-Z.md  (dashes, e.g. v1-2-5.md)
```

Required frontmatter:
```yaml
---
title: "vX.Y.Z"
description: "One sentence summary of changes."
---
```

**Title rule: `"vX.Y.Z"` only — NO subtitle after the colon.** All releases from v1.0.0 through v1.2.2 use this format. Do not append a description to the title (e.g. ~~`"v1.2.3: Desktop install script + doc site fixes"`~~).

The content of the page carries the full details — the title is for the sidebar and page heading only.

## Post-implementation checklist (run after all test gates pass)

Before closing any task that had an approved plan, append `## Execution Summary` to the plan doc:

```markdown
## Execution Summary

**Commit**: <SHA>

### Actual changes
<!-- What was changed. Note any differences from the planned file list. -->

### Deviations from plan
<!-- If implementation differed from the plan, explain why. Write "None" if the plan was followed exactly. -->

### Test results
| Gate | Result |
|---|---|
| Backend unit | ✅ N tests passed |
| Backend e2e  | ✅ N tests passed |
| Frontend unit | ✅ / ⏭ skipped (not affected) |
| Frontend e2e  | ✅ / ⏭ skipped (not affected) |

### Key discoveries
<!-- Anything found during implementation that was not in the plan and affected the outcome. Write "None" if nothing unexpected. -->
```
