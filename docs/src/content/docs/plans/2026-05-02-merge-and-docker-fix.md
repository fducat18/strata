---
title: 2026-05-02 — Merge all branches + fix Docker startup bug
description: Merge all development branches into main via fast-forward and fix the Colima false-positive in check-ports.mjs.
---

## Status: Complete

## Context

After several months of iterative development across multiple branches, `main` (and `origin/main`) was sitting at `fe5e270` — 58 commits behind the current working state. All NestJS migration work, feature development, and documentation lived exclusively on `feat/beta-feedback-plan`.

The branch topology at the time of this plan:

| Branch | Commit | Relation to main |
|---|---|---|
| `main` / `origin/main` | `fe5e270` | baseline |
| `chore/nestjsback-astrofront` | `b106b20` | +25 commits (linear) |
| `feat/beta-feedback-plan` | `773cf23` | +58 commits (linear) |

Because the entire history is **linear** (no divergence), the merge required no conflict resolution — a pure fast-forward.

### Stale old-era branches

The following branches diverged from the Python/FastAPI era (before the NestJS migration) and contain no relevant content for the current codebase:

- `backend-logic-impl`
- `feat/code-improvements`
- `fix/code-cov`
- `fix/code-coverage`
- `seed-data`
- `copilot/vscode-mmkb5j64-wgj8`
- `fix/deploy-docs` (remote only)

Decision: **delete locally, keep remotes**.

`chore/nestjsback-astrofront` was already fully included in `feat/beta-feedback-plan`'s linear history — also deleted locally after the merge.

---

## Bug: Docker startup false-positive (check-ports.mjs)

### Symptom

Running `npm run docker:reset` on macOS with **Colima** as the Docker runtime produced:

```
❌  Port 3000 (NestJS API) is held by a non-Docker process:
   8678 ssh: /Users/.../colima/_lima/colima/ssh.sock [mux]
   To free it, run: kill 8678
```

The script told the user to kill the process. Doing so shut down **Colima** (the Docker runtime), making the Docker daemon unavailable.

### Root cause

`lsof -t -i :PORT -sTCP:LISTEN` returns the PID of Colima's Lima SSH multiplexer, which handles port-forwarding between the macOS host and the Lima VM. `lsof` reports this as "LISTEN" on the forwarded ports.

The skip list in `check-ports.mjs` only excluded `docker`, `vpnkit`, and `com.docker` — not Colima/Lima processes.

### Fix

Added a check for the full process arguments: if args contain `.colima` or `_lima`, the process is part of the Colima/Lima runtime and must be skipped.

```js
let fullArgs = '';
try {
  fullArgs = execSync(`ps -p ${pid} -o args=`, { encoding: 'utf8' }).trim();
} catch {}

if (
  cmd.includes('docker') ||
  cmd.includes('vpnkit') ||
  cmd.includes('com.docker') ||
  fullArgs.includes('.colima') ||
  fullArgs.includes('_lima')
) {
  continue;
}
```

---

## Implementation steps

1. Save this plan to `docs/src/content/docs/plans/2026-05-02-merge-and-docker-fix.md` (AGENTS.md Convention #8)
2. `git checkout main && git merge --ff-only feat/beta-feedback-plan` — zero conflicts
3. Delete stale local branches
4. Fix `scripts/check-ports.mjs`
5. Commit locally: `fix(docker): skip Colima/Lima SSH mux in check-ports.mjs`

## Trade-offs considered

- **Fast-forward vs. merge commit**: Fast-forward was chosen because the history is already linear — a merge commit would add noise with no benefit.
- **Rebase vs. fast-forward**: No rebase needed; `feat/beta-feedback-plan` is already directly descended from `main`.
- **Branch deletion**: Old Python-era branches deleted locally to reduce noise; kept on remote for traceability.
