---
title: Implementation Plans
description: Decision log for every approved implementation plan.
sidebar:
  order: 1
---

All Strata implementation plans, newest first. Each plan records the intent, decisions, and outcome — similar to Architecture Decision Records (ADRs).

| Plan | Description |
|---|---|
| [2026-05-17: Fix tauri-install loader marker race](./2026-05-17-fix-tauri-install-marker-race) | Fix false failure in desktop post-install checks by waiting for readiness marker with bounded timeout and deterministic log window. |
| [2026-05-17: Fix Tauri prod tab navigation regression](./2026-05-17-fix-tauri-prod-tab-navigation) | Fix desktop app navigation links that escape /app/ and bounce users back to the startup loader. |
| [2026-05-16: Desktop no-localhost frontend + clean shutdown](./2026-05-16-desktop-no-localhost-and-clean-shutdown) | Harden desktop mode so frontend pages are not served on localhost, backend localhost API is desktop-auth protected, and sidecars always stop on app close. |
| [2026-05-16: Migrate frontend port 4321 to 6543](./2026-05-16-migrate-frontend-port-4321-to-6543) | Apply frontend port migration across web, Docker, Tauri sidecar, tests, scripts, and documentation; then validate with full quality gates. |
| [2026-05-14: Desktop install to /Applications + doc site fixes](./2026-05-14-desktop-install-and-doc-fixes) | Add tauri:install script, fix architecture diagram port/mode confusion, fix strataapp.md duplicated intro, verify sidebar ordering. |
| [2026-05-14: Doc site consistency fixes](./2026-05-14-doc-site-consistency-fixes) | Standardize release note titles, fix sidebar ordering (remove manual order overrides), delete badly named plan file, add plans index table, fix dev-setup Node 24 refs. |
| [2026-05-14: Doc site ordering, Node 24 fixes, architecture diagram](./2026-05-14-doc-site-ordering-node24-fixes) | Fix Plans/Releases sidebar to show newest first, update 7 stale Node 22 references to Node 24, and correct the architecture diagram to show docs available in dev mode. |
| [2026-05-14: Snapshot UI fixes — decimals, dates, delete, sort, pagination](./2026-05-14-snapshot-ui-fixes) | Fix net worth/snapshot value decimals, strip time from snapshot dates, add per-row snapshot delete, replace window.confirm on asset type delete, add pagination and sort toggle to snapshots table. |
| [2026-05-14: XLSX → Strata Data Migration (dev test run)](./2026-05-14-xlsx-data-migration) | Import historical net-worth snapshots from Tresorerie.xlsx into the Strata dev database, mapping rows onto prod assets via a gitignored local config. |
| [2026-05-14: Release v1.1.1](./2026-05-14-release-v1.1.1) | Patch release v1.1.1 — history filters, distinct colors, docker:dev always rebuilds, 15-month seed history, docs build fixes. |
| [2026-05-14: Fix release script — add GitHub Release creation](./2026-05-14-fix-release-script-gh-release) | release.mjs only pushes a git tag; it does not create a GitHub Release object. Add gh release create so /releases page is populated. |
| [2026-05-14: Fix History Filters + Chart Color Differentiation + Plan Title Convention](./2026-05-14-fix-history-filters-and-colors) | Fix time-range filters on the Net Worth chart, fix same-color issue in By Type/By Category modes, and standardize plan document titles for correct sidebar sorting. |
| [2026-05-14: Fix docker:dev stale images and seed historical snapshots](./2026-05-14-fix-docker-dev-and-seed) | Make docker:dev always regenerate version and rebuild images (layer-cached), and add 15 monthly relative-date asset snapshots to dev seed for realistic date filter testing. |
| [2026-05-14: Upgrade GitHub Actions to Node.js 24 + consolidate agent instructions](./2026-05-14-ci-upgrade-node24-actions) | Replace deprecated Node.js 20 action runtimes with Node.js 24 compatible versions, and restructure AGENTS.md + checklist instructions to eliminate duplication. |
| [2026-05-13: Fix Tauri Prod — Wrong DB Path and Wrong Version](./2026-05-13-fix-tauri-prod-db-and-version) | Fix Tauri prod build using the wrong database (seeded demo data instead of real data) and displaying the wrong version string. |
| [2026-05-13: Fix tauri-build.sh — nest: command not found](./2026-05-13-fix-tauri-build-nest-not-found) | Fix the Tauri production build failing with nest: command not found by installing full backend dependencies (including devDependencies) before the build step. |
| [2026-05-10: Versioning Env Badge Fix](./2026-05-10-versioning-env-badge-fix) | Fix docs version badge: docker:dev shows PROD, strata.ducatillon.net shows 0.0.0-dev DEV. Four file changes, zero dashboard config. |
| [2026-05-10: Import/Export Fix + SQLite DB Export](./2026-05-10-import-export-fix) | Fix import/export flows and add SQLite DB export capability. |
| [2026-05-10: Feedback & Fixes](./2026-05-10-feedback-and-fixes) | CI fixes, Node 24 upgrade, versioning, docs styling, favicon, white-flash, acquisition date, delete dialog, Codecov badges. |
| [2026-05-10: Fix Docker prod re-seeds database on every startup](./2026-05-10-docker-prod-reseed-fix) | Fix prod Docker container re-seeding the database on every restart, wiping user data. |
| [2026-05-10: CI Fix & Follow-up](./2026-05-10-ci-fix) | Frontend coverage threshold fix, acquisition date row position, docs right sidebar repair, plan doc renaming. |
| [2026-05-09: Unify dev database — strata-dev.db across all dev modes](./2026-05-09-unify-dev-database) | Consolidate all dev environments to use a single strata-dev.db file. |
| [2026-05-09: Release 1.0.0, Repo Transfer, Cloudflare Docs Proxy](./2026-05-09-release-1-0-0-repo-transfer-and-cloudflare-docs) | Implementation plan for v1.0.0 release notes, repo canonicalization to fducat18/strata, and Cloudflare /docs proxy setup. |
| [2026-05-09: Fix missing Rust/Cargo prerequisite for Tauri desktop](./2026-05-09-fix-tauri-rust-prereq) | Add Rust/Cargo pre-flight checks to tauri-dev.sh, tauri-build.sh, and check-prereqs.mjs so missing Rust produces a clear, actionable error instead of a cryptic cargo metadata failure. |
| [2026-05-09: Fix missing root npm install in tauri dev/build scripts](./2026-05-09-fix-tauri-root-npm-install) | Add root npm install to tauri-dev.sh and tauri-build.sh so the @tauri-apps/cli symlink is always valid before npx tauri dev/build is called. |
| [2026-05-09: Fix Tauri re-seeds deleted demo assets on every startup](./2026-05-09-fix-tauri-reseed-on-startup) | Fix Tauri app re-seeding the database on every launch, restoring deleted demo assets. |
| [2026-05-09: Fix release script fails due to src-tauri/ in root .gitignore](./2026-05-09-fix-release-gitignore) | Root cause analysis and fix for npm run release failing with 'paths are ignored by .gitignore'. |
| [2026-05-09: Fix sidebar/menu flash on navigation (FOUC in dark mode)](./2026-05-09-fix-nav-flash-fouc) | Fix the flash of unstyled content (FOUC) in the navigation sidebar when switching routes in dark mode. |
| [2026-05-09: Fix dev DB consistency + web dark-mode navigation flash](./2026-05-09-fix-dev-db-and-darkmode-nav-flash) | Fix inconsistent dev database state and dark-mode navigation flash in the web app. |
| [2026-05-09: Fix desktopapp.md stale data location references](./2026-05-09-fix-desktopapp-data-location-docs) | Update docs to reflect correct SQLite data file locations for the Tauri desktop app. |
| [2026-05-08: Fix tauri:dev astro command not found + release --no-push flag](./2026-05-08-fix-tauri-dev-astro-not-found) | Root cause analysis and fix for the multi-machine Google Drive symlink issue, tauri-dev.sh hardening, and a new --no-push flag for the release script. |
| [2026-05-08: Fix missing prisma generate in Tauri dev/build flow](./2026-05-08-fix-prisma-generate-tauri) | Add explicit prisma generate step to tauri-dev.sh, tauri-build.sh, and the backend prebuild script so the Prisma client is always generated before TypeScript compilation. |
| [2026-05-08: Remove better-sqlite3 adapter + relax Node engine to >=22 + always-on Swagger](./2026-05-08-fix-node-engine-constraint) | Eliminate native C++ ABI constraint, support Node >=22, and simplify Swagger setup. |
| [2026-05-05: Docker Startup Optimization](./2026-05-05-docker-startup-optimization) | Optimize Docker startup time for both dev and prod profiles. |
| [2026-05-05: Docker Reset Fix + Versioning](./2026-05-05-docker-reset-fix-and-versioning) | Restore broken docker:reset, fix docker:nuke, full version consistency across all 6 files, plans sidebar autogenerate, sem-ver AI skill. |
| [2026-05-02: UI Bug Fixes & UX Improvements](./2026-05-02-ui-bugfixes-and-ux) | Fixes blank page bug (QueryClient context), loan net worth inflation, missing snapshot duplicate guard, missing edit UI, chart improvements, and new snapshot editing feature. |
| [2026-05-02: Merge all branches + fix Docker startup bug](./2026-05-02-merge-and-docker-fix) | Merge all development branches into main via fast-forward and fix the Colima false-positive in check-ports.mjs. |
| [2026-05-02: Fix Docker Alpine Build — Missing Native-Addon Build Tools](./2026-05-02-fix-docker-alpine-build-deps) | Fix Docker Alpine build failing due to missing native C++ build tools for node-gyp. |
| [2026-05-02: Fix AssetTypeGroup enum cast in Prisma repository](./2026-05-02-fix-assettype-group-enum-cast) | Fixes TypeScript build failure in Docker caused by passing string where Prisma expects AssetTypeGroup enum, and adds AGENTS.md enforcement via instruction file. |
| [2026-05-02: Dashboard & Asset CRUD Fixes](./2026-05-02-dashboard-asset-crud-fixes) | Fixes Y-axis zeros on net worth chart, category/tag/acquisitionDate not saved on asset edit, and dashboard UI improvements (stats cards, allocation chart, time range filters). |
| [2026-05-02: Beta Feedback Post-Implementation Improvements](./2026-05-02-beta-feedback-post-implementation-improvements) | ADR documenting corrections and refinements made after discovering gaps during OOM recovery verification. |
| [2026-05-01: Beta Feedback Plan](./2026-05-01-beta-feedback-plan) | Approved implementation plan from first beta test session. Covers snapshot automation, transaction wiring, AssetType groups, chart improvements, and CRUD. |
