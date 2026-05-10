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
│  │  SQLite (dev: backend/.data/  │  │
│  │  prod: ~/Library/App Sup…)    │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

On launch, the Tauri app:

1. Creates the data directory if needed:
   - **`npm run tauri:dev`**: `<repo>/backend/.data/` — shared with `npm run docker:dev` and `npm run start:dev`
   - **Production `.app` build**: `~/Library/Application Support/Strata/`
2. Runs `prisma migrate deploy`, then runs seed only for a freshly created database
3. Starts the NestJS backend on port 3456
4. Starts the Astro frontend on port 4321
5. Shows a loading screen, then redirects to the frontend once healthy
6. On quit, kills both child processes

## Prerequisites

- **macOS 13+** (Apple Silicon or Intel)
- **Node.js 22+** (required to run backend/frontend sidecars; e.g. `brew install node`)
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

| Item | Path |
|------|------|
| SQLite database (prod/tagged build) | `~/Library/Application Support/Strata/strata.db` |
| SQLite database (`tauri:dev`) | `<repo>/backend/.data/strata-dev.db` *(shared with `docker:dev` and `start:dev`)* |
| Tauri logs | `~/Library/Logs/net.ducatillon.strata/Strata.log` |

## Dev vs prod behavior

The desktop app behavior is runtime-mode based:
- **`tauri:dev` (debug build)**: development behavior
- **`tauri:build` / bundled `.app` (release build)**: production behavior

| Concern | Dev build | Production build |
|---|---|---|
| Window title | `Strata <version> (DEV)` | `Strata <version>` |
| Data folder | `backend/.data/` (repo-relative, shared with docker:dev) | `~/Library/Application Support/Strata/` |
| Goal | Safe experiments, same data as Docker dev | Real data |

This separation prevents accidental corruption of production data during local testing. Because `tauri:dev` uses `backend/.data/`, all local dev modes (Tauri dev, Docker dev, `npm run start:dev`) share the same database file.

## Smoke checklist (after build)

1. Launch app and verify window title includes version (and `(DEV)` when expected).
2. Open **File → Reveal Data Folder** and verify it opens `backend/.data/` (repo-relative) in dev builds or `~/Library/Application Support/Strata/` in production builds.
3. Confirm backend health by opening `http://localhost:3456/api/v1/health` while app is running.
4. Create an asset and add a snapshot; restart app; verify data persists.
5. Trigger **Settings → Backup → Export**, then import into a fresh dev DB.
6. Quit app and confirm sidecar ports 3456/4321 are released.

## Menu Items

| Menu | Item | Action |
|------|------|--------|
| File | Reveal Data Folder | Opens `backend/.data/` (dev) or `~/Library/Application Support/Strata/` (prod) in Finder |
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
