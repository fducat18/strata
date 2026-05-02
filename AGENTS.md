# AGENTS.md — Project-Level Conventions for AI Agents

This document defines **8 permanent conventions** that all AI agents (GitHub Copilot, Claude, OpenAI Codex, Cursor, etc.) must follow when working on the Strata project.

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

- Location: `docs/src/content/docs/plans/YYYY-MM-DD-<short-title>.md`
- Plans are the project's decision log, similar to Architecture Decision Records (ADRs).
- This preserves why decisions were made and what trade-offs were considered.

---

## Summary

These 8 conventions ensure:
- **Consistency** across all AI-assisted work
- **Quality gates** prevent incomplete releases
- **Traceability** through plans and decision history
- **Test coverage** and regression prevention
- **Documentation parity** with implementation
- **Data integrity** through invariant enforcement

When in doubt, ask the project maintainer. When clear, follow these rules strictly.
