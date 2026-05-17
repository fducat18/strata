---
title: "Releases"
description: "Strata release notes — one page per version."
sidebar:
  order: 0
---

All Strata release notes, newest first.

| Version | Highlights |
|---|---|
| [v1.2.11](./v1-2-11) | Fix desktop tab navigation bounce to loader by making frontend links base-aware for `/app/` static mode |
| [v1.2.10](./v1-2-10) | Fix desktop install regression: strict post-install checks, stale legacy `:4321` cleanup, robust bundled-frontend navigation fallback |
| [v1.2.9](./v1-2-9) | Desktop quit-path hotfix: backend sidecar now reliably stops on app close; no lingering localhost listener |
| [v1.2.8](./v1-2-8) | Desktop hardening: no localhost frontend page serving, desktop-token backend auth, stale sidecar cleanup + shutdown reliability |
| [v1.2.7](./v1-2-7) | Frontend port migration to 6543 across Docker/Tauri/runtime docs, plus theme e2e hydration-race stabilization |
| [v1.2.6](./v1-2-6) | Fix backend crash on desktop launch — npx in main.ts fails with stripped macOS PATH |
| [v1.2.5](./v1-2-5) | Fix Prisma exit 127 on desktop launch (PATH stripping), release title format, shorten Why Strata callout |
| [v1.2.4](./v1-2-4) | Fix CI frontend coverage gate (89% → 100%), add 5 missing unit tests, correct coverage gate commands in agent instructions |
| [v1.2.3](./v1-2-3) | Desktop install to /Applications (`npm run tauri:install`), architecture diagram overhaul, strataapp.md intro fix |
| [v1.2.2](./v1-2-2) | Doc site consistency: standardized release note titles, fixed sidebar ordering, added plans index table, Node 24 dev-setup fixes |
| [v1.2.1](./v1-2-1) | Doc site sidebar newest-first, Node 24 reference fixes (7 files), architecture diagram correction |
| [v1.2.0](./v1-2-0) | Snapshot delete, pagination, sort toggle, 0-decimal values, date-only format, asset type delete dialog |
| [v1.1.2](./v1-1-2) | GitHub Actions Node.js 24 upgrade, AGENTS.md conventions 10/11/14 |
| [v1.1.1](./v1-1-1) | History filters fix, distinct chart colors, docker:dev reliability, 15-month seed history |
| [v1.1.0](./v1-1-0) | SQLite DB export, backup round-trip fix, Docker seed fix, versioning display overhaul |
| [v1.0.0](./v1-0-0) | First stable release — NestJS + Astro full-Node.js stack, Tauri desktop, canonical repo |
