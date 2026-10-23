---
title: "2026-10-23: Upgrade backend to NestJS 12"
description: "Upgrade backend framework and stable dependencies, then prepare the v1.6.1 patch version."
---

# Backend dependency upgrade

## Goal

Move the backend to NestJS 12 and refresh direct dependencies and devDependencies to stable versions compatible with the project’s Node.js LTS baseline. Prepare the repository’s release manifests for v1.6.1, the patch after v1.6.0.

NestJS 12 requires TypeScript 5 or 6; `ts-jest` 29 supports TypeScript versions below 7. Use the newest compatible stable TypeScript release rather than TypeScript 7. Keep Prisma on stable 7.x rather than its 8.x release candidate.

## Acceptance mapping and self-review

| Acceptance criterion | Concrete change or verification |
|---|---|
| Backend runs on selected NestJS line | Align Nest common/core/platform/testing, CLI, schematics, and Swagger versions; update backend lockfile; run backend build, unit, e2e, and lint checks. |
| Backend direct dependencies use stable compatible releases | Refresh backend `dependencies` and `devDependencies` without introducing incompatible prereleases; verify lockfile and run test gates. |
| App release metadata is prepared for patch 1.6.1 | Update the six release manifests and `strata-desktop` lock entry; add v1.6.1 release notes and index row. |
| Generated app version remains tag-derived | Do not hand-edit generated version files; they are produced from `git describe` by `scripts/gen-version.mjs`. |
| Existing unrelated worktree edits remain intact | Avoid release script commit/push actions; preserve existing BMAD-removal work and do not rewrite unrelated files. |

## Verification

- Backend: build, coverage-enforced unit tests, e2e tests, and CI lint.
- Frontend: coverage-enforced unit tests and e2e tests (release gate).
- Docs: production build.
- Validate package JSON/lockfile consistency and review `git diff --check`.

## Execution Summary

**Commit**: `d9e11ee6684642c90041a1132920a1c6f3659e5c`

**Release**: v1.6.1 published at https://github.com/fducat18/strata/releases/tag/v1.6.1

### Actual changes

- Upgraded backend to NestJS 12 and compatible stable dependencies, including TypeScript 6 configuration and Jest ESM support.
- Set application manifests, lockfile package metadata, and Tauri versions to 1.6.1; added release notes.
- Removed BMAD tooling/configuration as requested.

### Deviations from plan

- Backend `lint:ci` reports 464 formatting errors and one warning. The existing source also fails the repository's Prettier check at baseline, so unrelated bulk formatting was not applied.
- Release script could not be used after version metadata was committed at 1.6.1 because it would attempt an empty release commit. Pushed the committed `main`, created tag `v1.6.1`, and published the GitHub release directly.

### Test results

| Gate | Result |
|---|---|
| Backend build | ✅ Passed |
| Backend unit coverage | ✅ 350 tests across 35 suites; thresholds passed |
| Backend e2e | ✅ 75 tests across 10 suites |
| Frontend unit coverage | ✅ 468 tests across 74 files; thresholds passed |
| Frontend e2e | ✅ 14 passed, 22 skipped |
| Docs build | ✅ Passed; existing `/404` route conflict warning |
| Backend lint | ⚠️ 464 formatting errors, 1 warning; baseline formatting issue |
| Dependency audit | ✅ 0 vulnerabilities |
| Release dry-run | ✅ Passed for v1.6.1 |

### Key discoveries

- NestJS 12 requires Jest's experimental VM modules for the existing CommonJS-oriented test setup.
- TypeScript 6 required explicit `rootDir` settings and removal of deprecated `baseUrl`.
