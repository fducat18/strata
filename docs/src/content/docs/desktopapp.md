---
title: "Strata Desktop App (macOS)"
---


Strata can run as a native macOS desktop app using [Tauri v2](https://v2.tauri.app/).
The app bundles the NestJS backend and Astro frontend as child processes ("sidecars")
that start/stop automatically with the app.

## Architecture

```
┌─────────────────────────────────────┐
│         Tauri WebView (macOS)       │
│  ┌───────────────────────────────┐  │
│  │   Astro SSR (localhost:4321)  │  │
│  └──────────────┬────────────────┘  │
│                 │ HTTP              │
│  ┌──────────────▼────────────────┐  │
│  │  NestJS API (localhost:3456)  │  │
│  └──────────────┬────────────────┘  │
│                 │                   │
│  ┌──────────────▼────────────────┐  │
│  │  SQLite (backend/.data/)      │  │
│  │  dev: strata-dev.db           │  │
│  │  prod: strata.db              │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

On launch, the Tauri app:

1. Creates the data directory if needed: `<repo>/backend/.data/`
   - **`npm run tauri:dev`** uses `strata-dev.db` — shared with `npm run docker:dev` and `npm run start:dev`
   - **Production `.app` build** uses `strata.db` — shared with `npm run docker:prod`
2. Runs `prisma migrate deploy`, then runs seed only for a freshly created database
3. Starts the NestJS backend on port 3456
4. Starts the Astro frontend on port 4321
5. Shows a loading screen, then redirects to the frontend once healthy
6. On quit, kills both child processes

## Prerequisites

- **macOS 13+** (Apple Silicon or Intel)
- **Node.js 24+** (required to run backend/frontend sidecars; e.g. `brew install node`)
- **Rust 1.77+** (e.g. via Homebrew: `brew install rust`)
- **Xcode CLI tools**: `xcode-select --install`

## Quick Start (Dev Mode)

```bash
# 1. Install all dependencies
cd backend && npm install && cd ..
cd front && npm install && cd ..
npm install  # root (installs @tauri-apps/cli)

# 2. Build both apps
cd backend && npm run build && cd ..
cd front && PUBLIC_API_URL="http://localhost:3456/api/v1" npm run build && cd ..

# 3. Launch the desktop app
npx tauri dev
```

Or use the convenience script:

```bash
./scripts/tauri-dev.sh
```

## Install to /Applications (Recommended)

Run once to build and install Strata as a proper macOS app you can launch from Finder, Spotlight, or the Dock:

```bash
npm run tauri:install
```

This single command:
1. Builds `Strata.app` (backend + frontend + Rust shell)
2. Clears the macOS quarantine flag (the app is unsigned)
3. Copies it to `/Applications/Strata.app`

After that, **double-click Strata in Finder or Spotlight** — no terminal needed.

> **Known limitations** — acceptable for personal use on the machine where the repo lives:
>
> | Limitation | Details |
> |---|---|
> | Repo must stay at this path | Paths to `backend/dist/` and `front/dist/` are baked in at compile time |
> | Node.js must be installed | The app spawns `node` from `/opt/homebrew/bin/node` or `/usr/local/bin/node` |
> | Data lives in the repo | `backend/.data/strata.db` — shared with `docker:prod` |
> | App is unsigned | `tauri:install` clears the quarantine flag automatically |
>
> For a fully self-contained `.app` that bundles Node.js and the build artifacts, see `issues/done/bundle-node-runtime.md` (deferred feature).

## Building the .app / .dmg

```bash
./scripts/tauri-build.sh
```

Output:

- `.app` → `src-tauri/target/release/bundle/macos/Strata.app`

### ⚠️ Unsigned App (Gatekeeper)

The app is not code-signed. macOS will block it by default. To open:

```bash
xattr -cr /path/to/Strata.app
# or right-click → Open in Finder
```

## Data Location

All Tauri builds (dev and prod) use **`<repo>/backend/.data/`** as the data directory.
This means the Tauri desktop app and the Docker stack always share the same database file —
switching between them preserves your data.

| Item | Path |
|------|------|
| SQLite database (prod/tagged build) | `<repo>/backend/.data/strata.db` *(shared with `docker:prod`)* |
| SQLite database (`tauri:dev`) | `<repo>/backend/.data/strata-dev.db` *(shared with `docker:dev` and `start:dev`)* |
| Tauri logs | `~/Library/Logs/net.ducatillon.strata/Strata.log` |

## Dev vs prod behavior

The desktop app behavior is runtime-mode based:
- **`tauri:dev` (debug build)**: development behavior
- **`tauri:build` / bundled `.app` (release build)**: production behavior

| Concern | Dev build | Production build |
|---|---|---|
| Window title | `Strata <version> (DEV)` | `Strata <version>` |
| Data folder | `backend/.data/` (repo-relative, shared with docker:dev) | `backend/.data/` (repo-relative, shared with docker:prod) |
| DB file | `strata-dev.db` | `strata.db` |
| Goal | Safe experiments, same data as Docker dev | Real data, same as Docker prod |

All local modes (Tauri dev, Tauri prod, Docker dev, Docker prod, `npm run start:dev`) use the same `backend/.data/` directory — only the filename differs between dev and prod.

## Smoke checklist (after build)

1. Launch app and verify window title includes version (and `(DEV)` when expected).
2. Open **File → Reveal Data Folder** and verify it opens `backend/.data/` in Finder (both dev and prod builds).
3. Confirm backend health by opening `http://localhost:3456/api/v1/health` while app is running.
4. Create an asset and add a snapshot; restart app; verify data persists.
5. Trigger **Settings → Backup → Export**, then import into a fresh dev DB.
6. Quit app and confirm sidecar ports 3456/4321 are released.

## Menu Items

| Menu | Item | Action |
|------|------|--------|
| File | Reveal Data Folder | Opens `backend/.data/` in Finder (both dev and prod builds) |
| File | Close Window | Closes the window |
| Strata | About Strata | Shows the about dialog |
| Strata | Quit Strata | Quits the app and stops all sidecars |

## Ports

| Service | Port | Notes |
|---------|------|-------|
| NestJS backend | 3456 | API at `http://localhost:3456/api/v1` |
| Astro frontend | 4321 | Web UI at `http://localhost:4321` |

## Troubleshooting

### Backend fails to start

- Check that `backend/dist/main.js` exists (`cd backend && npm run build`)
- Check logs in `~/Library/Logs/net.ducatillon.strata/Strata.log`
- Ensure port 3456 is free: `lsof -i :3456`

### Frontend fails to start

- Check that `front/dist/server/entry.mjs` exists (`cd front && npm run build`)
- Ensure port 4321 is free: `lsof -i :4321`

### API URL mismatch

The frontend's API URL is baked at build time. Rebuild with:

```bash
cd front && PUBLIC_API_URL="http://localhost:3456/api/v1" npm run build
```

### Leftover processes after crash

```bash
lsof -i :3456 -t | xargs kill -9
lsof -i :4321 -t | xargs kill -9
```

## Source checkout recommendation

Use a local filesystem checkout (regular git clone path) for development work.
Cloud-synced project folders can cause unstable file-watcher and I/O behavior.

## Future Improvements

- [ ] Bundle Node.js inside the .app (no system Node dependency)
- [ ] Bundle backend/frontend as Tauri resources for self-contained distribution
- [ ] Code-sign and notarize for public distribution
- [ ] Auto-update via Tauri updater plugin
- [ ] File → Export/Import Backup via IPC (currently available in web UI Settings)
