---
title: "Versioning"
---

Strata uses **`git describe --tags --dirty --always`** as the single source
of truth for its version. There is no separate version field maintained in
`package.json`, `Cargo.toml`, or `tauri.conf.json` — those all carry the
placeholder `0.0.0` and are overridden at build time.

## Why a single source of truth

Every version label visible to a user — backend `/api/v1/version`, the
frontend footer, the Tauri window title, the Settings → About panel — comes
from one script: `scripts/version.mjs`. It cannot drift. If `git describe`
says `1.4.2`, that's what the desktop window shows, what the API returns,
and what the front displays.

## Format

The script returns one of:

| Git state | Example | `env` label |
|---|---|---|
| Clean checkout on a tag | `1.4.2` | `production` |
| Tag + commits since | `1.4.2-3-gabcd123` | `development` |
| Tag + uncommitted changes | `1.4.2-3-gabcd123-dirty` | `development` |
| No tags at all | `0.0.0-dev+abcd123-dirty` | `development` |

Anything that is **not** a clean tag is flagged as `development`. The
desktop app surfaces this with a `(DEV)` suffix in the window title and a
badge in the About menu, and uses a separate data folder
(`Strata-Dev/`) so dev experiments cannot corrupt your real data.

## How to release

```bash
# Make sure your tree is clean and tests pass
npm test --prefix backend && npm run test:e2e --prefix backend
npm test --prefix front && npm run test:e2e --prefix front

# Tag and push
git tag v1.4.2
git push origin v1.4.2

# Build the desktop app from the tagged commit
./scripts/tauri-build.sh

# The resulting Strata.app shows "Strata 1.4.2" — no DEV badge.
```

## Where the version is shown

| Surface | Location | Example |
|---|---|---|
| Backend HTTP | `GET /api/v1/version` | `{"version":"1.4.2","env":"production","gitSha":"abcd123","buildTime":"…"}` |
| Backend health | `GET /api/v1/health` | included in payload |
| Frontend sidebar | bottom-left footer | `v1.4.2` (or `v1.4.2-3-gabcd-dirty DEV`) |
| Frontend Settings | About panel | full version + git SHA + build time |
| Desktop window title | always visible | `Strata 1.4.2` or `Strata 0.0.0-dev+abcd-dirty (DEV)` |
| Desktop About menu | menu bar → Strata → About | full version + env + data folder |

## How it's wired

```
scripts/version.mjs        ← single source: shells out to `git describe`
├── backend/scripts/gen-version.mjs   → writes src/_generated/version.json (gitignored)
├── front/scripts/gen-version.mjs     → writes src/lib/version.ts (gitignored)
└── src-tauri/build.rs                → emits cargo:rustc-env vars
```

Each layer's `prebuild` / `predev` / `pretest` script invokes its
generator, so the generated files are always fresh.

## Release notes

We don't generate release notes from CI yet. For now: write them in the
GitHub release page after pushing the tag.

## Why not auto-bump in `package.json`?

Because then both `package.json` AND `git describe` could disagree, and
that drift is exactly what we want to avoid. The `0.0.0` placeholder makes
the rule visible in code: "this number is meaningless; trust git".
