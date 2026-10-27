---
title: "2026-10-27: Fix desktop seed failure on upgrade (spawn tsx ENOENT)"
description: "Make the Tauri desktop seed PATH-independent by invoking the tsx CLI entry directly instead of `prisma db seed`, fixing `spawn tsx ENOENT` on LaunchServices-launched apps."
---

## Problem

Upgrading Strata **1.5.X → 1.6.2** via `npm run tauri:install` on a second Mac fails at first launch:

```
❌ Post-install check failed: desktop backend on :3456 did not start.
```

with popup:

```
Strata -- startup error
Database seed failed:
prisma db seed exited with exit status: 1
...
An error occurred while running the seed command:
Error: Command failed with ENOENT: tsx prisma/seed.ts
spawn tsx ENOENT
```

Because the seed fails, the app calls `process::exit(1)` before spawning the backend, which cascades into the installer's port-3456 and readiness-marker checks failing.

## Root cause

The chain that breaks:

1. `scripts/tauri-install.sh` launches the app with `open /Applications/Strata.app` — LaunchServices gives GUI apps a stripped `PATH` (`/usr/bin:/bin:/usr/sbin:/sbin`).
2. `run_prisma_seed` (`src-tauri/src/lib.rs`) executes `node <prisma-cli-js> db seed` with an absolute node (works — `find_node()` + local CLI js, already hardened in commit `3c710f8`).
3. **`prisma db seed` re-spawns the configured seed command `tsx prisma/seed.ts` from `backend/prisma.config.ts` via PATH lookup** (spawn, no shell). `tsx` lives at `backend/node_modules/.bin/tsx` — not on the stripped PATH → `spawn tsx ENOENT`.

Reproduced locally on a scratch DB with `PATH=/usr/bin:/bin:/usr/sbin:/sbin` + absolute node:

```
Running seed command `tsx prisma/seed.ts` ...
Error: Command failed with ENOENT: tsx prisma/seed.ts
spawn tsx ENOENT
```

The migrate path (`main.ts` / `run_prisma_migrate`) was already made PATH-independent; the seed path was left on `prisma db seed`.

## Decision

Invoke the seed script directly, mirroring the migrate hardening:

- Resolve `backend/node_modules/tsx` bin entry from its `package.json` (currently `./dist/cli.mjs`), with static fallbacks.
- Run `node <tsx-cli-js> <backend>/prisma/seed.ts` with `cwd=backend` and the same env (`DATABASE_URL`, `STRATA_SEED_PROFILE`).
- No PATH lookup anywhere: node is absolute (`find_node`), tsx CLI is an absolute path under `node_modules`, seed script is an absolute path.

`prisma db seed` for human/terminal dev workflows (`STRATA_SEED_PROFILE=development npx prisma db seed`) is untouched.

## Implementation plan

1. Add tsx resolution helpers to `src-tauri/src/lib.rs` (mirroring the existing prisma ones):
   - `tsx_package_dir` / `tsx_package_json_path`
   - `tsx_cli_js_candidates(backend_path)` — reads `bin` from `tsx/package.json`; fallbacks `dist/cli.mjs`, `dist/cli.js`
   - `ensure_tsx_cli_js(backend_path) -> Result<PathBuf, String>` with the same error style as `ensure_prisma_cli_js`
2. Rewrite `run_prisma_seed` to run `node <tsx-cli> <backend>/prisma/seed.ts` instead of `prisma db seed`; keep `DATABASE_URL` + `STRATA_SEED_PROFILE` envs, output capture, and `Result` handling (popup text "Database seed failed:" unchanged).
3. Add a guard that fails startup with a clear message if `backend/prisma/seed.ts` is missing.
4. Add Rust unit tests (`ensure_tsx_cli_js` resolves package.json bin; falls back; errors when missing).
5. Gates:
   - `cargo test` in `src-tauri` (baseline: 9 passed)
   - `cargo build` in `src-tauri`
   - End-to-end verification already done on a scratch DB under stripped PATH: direct tsx invocation seeds 13 asset types, exit 0.
6. Save this plan doc (Convention 8) and append `## Execution Summary` after gates pass (Convention 12).

## Execution Summary

- **Actual changes** (vs. plan):
  - `src-tauri/src/lib.rs`: added `tsx_package_dir`, `tsx_package_json_path`, `tsx_cli_js_candidates`, `ensure_tsx_cli_js` (mirrors the existing prisma CLI resolver; reads `bin` from `tsx/package.json`, fallbacks `dist/cli.mjs`, `dist/cli.js`).
  - `src-tauri/src/lib.rs`: rewrote `run_prisma_seed` to run `node <tsx-cli-js> <backend>/prisma/seed.ts` directly instead of `prisma db seed`; added a hard guard that fails startup with a clear message if `backend/prisma/seed.ts` is missing. Env (`DATABASE_URL`, `STRATA_SEED_PROFILE`), output capture, and the `Result`-based popup flow are unchanged.
  - 3 new Rust unit tests for the tsx resolver (missing → error; fallback path; package.json bin preference). Test count: 9 → 12.
- **Deviations**: none from the plan. The `prisma db seed` path is fully bypassed in the desktop app; terminal dev workflow (`npx prisma db seed`) untouched.
- **Test results**:
  - `cargo test` (src-tauri): **12 passed** (baseline 9 → 12).
  - `cargo build --release` (src-tauri): **success**.
  - End-to-end reproduction (scratch DB, `PATH=/usr/bin:/bin:/usr/sbin:/sbin` + absolute node): `prisma db seed` fails with `Command failed with ENOENT: tsx prisma/seed.ts / spawn tsx ENOENT` — byte-identical to the reported popup. Direct `node <tsx-cli> prisma/seed.ts` under the same stripped PATH: **exit 0, 13 asset types seeded**. Scratch DB cleaned up.
  - Full backend/frontend suites not run — change is confined to `src-tauri/src/lib.rs` (no backend/frontend source touched).
- **Commit SHA(s)**: none — change not committed yet (awaiting user go-ahead; repo policy requires explicit approval to commit).
- **Key discoveries**: `v1-2-5` release notes claimed "the same fix applies to `prisma db seed` on first launch" — but hardening only covered the *outer* invocation (`node <prisma-cli> db seed`). `prisma db seed` re-spawns the configured seed command `tsx prisma/seed.ts` (`backend/prisma.config.ts`, `migrations.seed`) via PATH lookup, which stays broken under LaunchServices' stripped PATH. The direct-tsx invocation removes the last PATH dependency in the startup chain.

