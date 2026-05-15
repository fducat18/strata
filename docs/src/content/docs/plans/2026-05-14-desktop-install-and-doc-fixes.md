---
title: "2026-05-14: Desktop install to /Applications + doc site fixes"
description: "Add tauri:install script for one-command macOS app install, fix architecture diagram port/mode confusion, fix strataapp.md duplicated intro, verify sidebar ordering."
---

## Problem

Four independent issues:

1. **Desktop install** — No easy way to install Strata to `/Applications` for double-click launch. Users had to run terminal commands every time.
2. **Architecture diagram** — The "Dev mode" subgraph mixed `npm run docker:dev` with `cd docs && npm run dev`, which use the **same port 4321** — they cannot run simultaneously.
3. **strataapp.md intro** — The overview page opened with `🛡️ How do I operate Strata?` — identical to `backup.md`'s callout. Wrong audience for a landing page.
4. **Sidebar ordering** — Plans and Releases sidebar sections were not showing newest first despite `reversed: true` being set. Suspected CDN cache issue after v1.2.2 fixes.

## Plan

### T1 — `scripts/tauri-install.sh`
New script: build `.app` via `tauri-build.sh` → clear macOS quarantine (`xattr -cr`) → copy to `/Applications`.

### T2 — `package.json`
Add `"tauri:install": "bash scripts/tauri-install.sh"` to root scripts.

### T3 — `DesktopApp.md`
Add "Install to /Applications" section with one-command install + known limitations table.

### T4 — `architecture.md`
Restructure Mermaid diagram to show three distinct, mutually exclusive modes:
- **Docker Dev** (`npm run docker:dev`): frontend at 4321, backend at 3000, no docs
- **Docs Dev** (`cd docs && npm run dev`): docs at 4321, nothing else (can't run alongside docker:dev — port conflict)
- **Docker Prod** (`npm run docker:prod`): nginx at 8001 (frontend + static docs), backend at 3000

### T5 — `strataapp.md`
Replace duplicated callout with a "Why Strata?" hook that tells the reader what problem Strata solves.

### T6 — Sidebar ordering
Verify no remaining `sidebar: order:` overrides in plan/release files. Confirm `reversed: true` works by building docs locally. Force a cache-busting push to Cloudflare Pages if needed.

## AGENTS.md Checklist

| # | Convention | Status |
|---|---|---|
| 1 | Docs: DesktopApp.md + architecture.md + strataapp.md | ✅ |
| 2 | All 4 test gates | ⏭ Infra/docs only |
| 3 | Self-review | ✅ |
| 4 | Bruno/Swagger | ✅ N/A |
| 5 | Bug-to-test | ✅ N/A |
| 6 | Seed isolation | ✅ N/A |
| 7 | Transaction invariants | ✅ N/A |
| 8 | Plan history | ✅ This file |
| 9 | Infra test gate | ✅ Will run `npm run tauri:install` + `cd docs && npm run build` |
| 10 | Env compat | ✅ macOS only for tauri; docs build platform-agnostic |
| 11 | Do-no-harm | ✅ Existing `tauri:build` / `tauri:prod` unchanged |
| 12 | Execution summary | ✅ Will append below |
| 13 | Doc grep | ✅ N/A — no renames |
| 14 | Semver release | ✅ Patch release after completion |

## Execution Summary

**Commit**: `0385c9f`

### Actual changes

| File | Change |
|---|---|
| `scripts/tauri-install.sh` | Created — build → xattr -cr → cp -r to /Applications |
| `package.json` | Added `tauri:install` script |
| `docs/src/content/docs/desktopapp.md` | Added "Install to /Applications" section + known limitations table |
| `docs/src/content/docs/architecture.md` | Rewrote Mermaid diagram (3 subgraphs: dockerdev/docsdev/prod), rewrote Services table |
| `docs/src/content/docs/strataapp.md` | Replaced duplicated callout with "Why Strata?" intro hook |
| `docs/src/content/docs/plans/index.md` | Added new plan row at top of table |

### Deviations from plan

- **Sidebar ordering (T6)**: no code change needed — no orphan `sidebar: order:` overrides found in any plan/release file. `reversed: true` already in `astro.config.mjs`. If the deployed site still shows wrong order, cause is Cloudflare Pages cache; force-rebuild by pushing a trivial commit.

### Test results

| Gate | Result |
|---|---|
| Backend unit | ⏭ Skipped — no logic change |
| Backend e2e | ⏭ Skipped — no logic change |
| Frontend unit | ⏭ Skipped — no logic change |
| Frontend e2e | ⏭ Skipped — no logic change |
| Docs build | ✅ 75 pages, 0 errors (`cd docs && npm run build`) |
| Infra gate | ✅ `npm run tauri:install` exited 0; `Strata.app` confirmed at `/Applications/Strata.app` |

### Key discoveries

- `CARGO_MANIFEST_DIR` is baked in at compile time — the `.app` works only on the machine/path where it was built. Moving the repo breaks it. This is a pre-existing limitation, documented in the known limitations table.
- macOS Gatekeeper blocks unsigned `.app` bundles from any source including local builds. `xattr -cr` in the install script clears the quarantine flag transparently — the user never sees a Gatekeeper error.
