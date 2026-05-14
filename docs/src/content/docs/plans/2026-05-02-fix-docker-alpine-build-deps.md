---
title: "2026-05-02: Fix Docker Alpine Build — Missing Native-Addon Build Tools"
date: 2026-05-02
status: approved
---

## Context

After fast-forwarding `main` to the NestJS migration branch (58 commits), the application
no longer uses Python as an application language. However, the NestJS backend now uses
`@prisma/adapter-better-sqlite3`, which is a native C++ Node.js addon.

## Problem

When running `npm run docker:reset`, the Docker build failed with:

```
npm error prebuild-install warn install Request timed out
npm error gyp ERR! find Python Python is not set from command line or npm configuration
npm error gyp ERR! configure error
npm error gyp ERR! stack Error: Could not find any Python installation to use
```

**Root cause:** `better-sqlite3` requires native compilation via `node-gyp`. node-gyp needs:
- `python3` — to run its configuration scripts
- `make` — to drive the build
- `g++` — to compile the C++ source

The `node:22-alpine` base image includes none of these. The `prebuild-install` step
(which downloads a prebuilt binary from GitHub Releases) also timed out on the network,
so it fell back to source compilation — which then failed.

**Note on Python:** Python here has zero connection to the Python/FastAPI era. It is an
infrastructure dependency of `node-gyp` (a Node.js build tool), invisible at runtime.

## Why It Worked Before

Before the merge, `main` was the old Python/FastAPI backend. The Docker image naturally
had Python because Python *was* the application. After migrating to NestJS + native SQLite
addon, the build toolchain requirement wasn't propagated to the Dockerfile.

## Fix

Add `python3 make g++` to the **builder stage only** of `backend/Dockerfile`.
The runtime stage (`node:22-alpine`) does not need build tools and stays unchanged.

```dockerfile
# Before
RUN apk add --no-cache ca-certificates \

# After
RUN apk add --no-cache ca-certificates python3 make g++ \
```

## AGENTS.md Compliance

| Convention | Status |
|---|---|
| #1 Documentation | ✅ This plan doc |
| #2 All 4 test gates + `npm run docker:reset` | ✅ All verified by agent before commit |
| #3 Self-review | ✅ Done in planning phase |
| #4 Endpoint Coverage | N/A |
| #5 Bug-to-Test | ⚠️ Infrastructure bug — no unit test can assert Docker builder has Python. Verification is `npm run docker:reset` (run by agent). |
| #6 Seed isolation | N/A |
| #7 Transaction Invariants | N/A |
| #8 Plan History | ✅ This document |

## Files Changed

- `backend/Dockerfile` — add `python3 make g++` to builder stage `apk add`
