# AGENTS.md — Project-Level Conventions for AI Agents

This document defines **13 permanent conventions** that all AI agents (GitHub Copilot, Claude, OpenAI Codex, Cursor, etc.) must follow when working on the Strata project.

## 1. Documentation Philosophy

**The Astro Starlight doc site must be a near-100% reflection of the code at all times.**

Every feature, architectural decision, data model change, and design decision must be documented. Documentation updates are **NEVER optional**. If a feature ships without docs, it is not considered complete. Docs live at `docs/src/content/docs/` and are published to <https://strata.ducatillon.net/docs/>.

---

## 2. Plan Completion Rule

**A plan/feature is NOT done until:**

1. Backend unit tests pass (≥90% coverage)
2. Backend e2e tests pass
3. Frontend unit tests pass (≥90% coverage)
4. Frontend e2e tests pass

This is non-negotiable. A feature is not ready for release until all four gates pass.

---

## 3. Plan Self-Review Rule

**Before presenting any plan for approval, the agent MUST self-review it for:**

- Internal consistency (all referenced files exist; all imports/exports align)
- Cross-reference verification (every referenced file is checked; no circular dependencies)
- Acceptance criterion mapping (every acceptance criterion maps to a concrete plan item)
- No inconsistencies should remain when the plan is presented to the user

---

## 4. Endpoint Coverage Rule

**Every new backend API endpoint must ALSO be added to the Bruno API collection and have its Swagger/OpenAPI documentation updated.**

- Bruno requests live at `.bruno/Strata/`
- Swagger decorators live in NestJS controller files (`@ApiOperation`, `@ApiResponse`, etc.)
- This is not optional; it applies to every new endpoint.

---

## 5. Bug-to-Test Rule

**Any bug discovered through manual testing must result in a new automated test (unit or e2e) that would have caught the bug.**

Tests are the project's memory of manual discovery. Before closing a bug, write the test that validates the fix and proves it won't regress.

---

## 6. Seed/Test Data Isolation

**Seeded demo data must be isolated from test data.**

- The seed creates deterministic, named records (e.g., `'Personal Net Worth'` portfolio, named demo assets).
- Tests use their own data and must clean up after themselves.
- **Never depend on or corrupt seed data** in tests.

---

## 7. Transaction Invariants

**Every asset has exactly 1 ACQUIRE transaction.**

**Every asset has 0 or 1 DISPOSE transaction.**

These are **service-level invariants**, not DB constraints. The repository layer or domain layer must enforce these rules, even if the database doesn't.

---

## 8. Plan History

**Every approved plan must be saved to the doc site BEFORE implementation starts.**

### Filename format — STRICTLY enforced

```
docs/src/content/docs/plans/YYYY-MM-DD-<short-title>.md
```

| Part | Example | Rule |
|---|---|---|
| `YYYY` | `2026` | 4-digit year |
| `MM` | `05` | 2-digit month, zero-padded |
| `DD` | `13` | 2-digit day, zero-padded — **NEVER omit the day** |
| `short-title` | `fix-tauri-build` | kebab-case, descriptive |

✅ `2026-05-13-fix-tauri-build-nest-not-found.md`  
❌ `2026-05-fix-tauri-build-nest-not-found.md` — **missing day → Astro build fails**  
❌ `plan.md` — never use a generic name

> **This violation has been made 3 times.** A missing day causes a YAML/build error in the Astro Starlight docs site and breaks `docker:prod`. Check the date with `date +%Y-%m-%d` if unsure.

### Frontmatter — required

Every plan doc MUST start with valid YAML frontmatter:

```yaml
---
title: "YYYY-MM-DD: Short descriptive title"
description: "One sentence describing the problem and fix."
---
```

- The `title` **must start with the full date** (`YYYY-MM-DD:`) — Starlight `autogenerate` sorts the sidebar alphabetically by title, so a date prefix guarantees chronological ordering.
- Always **quote** both `title` and `description` — unquoted colons (e.g., `nest: command not found`) break YAML parsing.

✅ `title: "2026-05-14: Fix history filters and chart colors"`
❌ `title: "Fix history filters"` — missing date → sidebar sorts by first letter, not date

### Purpose

- Plans are the project's decision log, similar to Architecture Decision Records (ADRs).
- This preserves why decisions were made and what trade-offs were considered.
- The plans sidebar is **auto-generated** — no need to edit `docs/astro.config.mjs`.

---

## 9. Full-Stack Coverage Rule

**Every frontend bug fix or UI improvement must be accompanied by:**

1. **Automated tests** — unit test for the component/hook logic changed, AND an e2e test if the interaction involves a user flow (form submit, navigation, data persistence).
2. **Backend verification** — before implementing any frontend change that reads or writes data, verify the relevant API route and backend logic exists and works correctly. If any route is missing, incomplete, or broken, implement the full backend fix (controller → service → repository) following the same hexagonal architecture rules, before touching the frontend.

**Examples:**
- Fixing "category not saved on asset create" → verify `PUT /assets/:id` actually passes `categoryIds` to the service; if not, fix the controller first. Write an e2e test that proves categories persist after PUT.
- Adding a "value history" UI component → verify `GET /assets/:id/snapshots` exists and returns the expected shape; if not, add the endpoint first.

This rule prevents frontend work from silently depending on unimplemented or broken backend logic.

---

## 12. Plan Execution Summary

**After implementation completes, append an `## Execution Summary` section to the plan doc.**

- **File**: the same plan doc created in Convention 8 (`docs/src/content/docs/plans/YYYY-MM-DD-<short-title>.md`)
- **When**: after all applicable test gates pass (Convention 2), before closing the task
- **Required content**:
  - **Actual changes**: what was changed vs. what was planned — highlight any deviations
  - **Deviations**: if the implementation differed from the plan, explain why
  - **Test results**: which gates were run and whether they passed (unit, e2e, frontend, infra)
  - **Commit SHA(s)**: one or more commit hashes for traceability
  - **Key discoveries**: anything found during implementation that was not in the plan and affected the outcome

This turns every plan doc into a full ADR-style record: **intent + outcome**. The decision log is only useful if it reflects what actually happened.

---

## 13. Doc Grep Rule

**Before committing any change that renames a path, moves a directory, renames a command, or changes how data is stored/accessed, run:**

```bash
grep -r '<old-value>' docs/
```

**Update every match inline.** Never commit a code change that leaves stale references in `docs/src/content/docs/`.

Examples of changes that trigger this rule:
- Renaming a DB file (`strata.db` → `strata-dev.db`) → grep docs for the old filename
- Changing a config key or env var → grep docs for the old key
- Moving a data directory (`Strata-Dev/` → `backend/.data/`) → grep docs for the old path
- Renaming an npm script → grep docs for the old script name

A doc that documents the wrong path is worse than no doc at all.

---

## Summary

These 13 conventions ensure:
- **Consistency** across all AI-assisted work
- **Quality gates** prevent incomplete releases
- **Traceability** through plans and decision history (intent AND outcome)
- **Test coverage** and regression prevention
- **Documentation parity** with implementation
- **Data integrity** through invariant enforcement
- **Full-stack coverage** preventing frontend/backend mismatches

When in doubt, ask the project maintainer. When clear, follow these rules strictly.
