# Strata Desktop App (macOS)

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
│                 │ HTTP               │
│  ┌──────────────▼────────────────┐  │
│  │  NestJS API (localhost:3456)  │  │
│  └──────────────┬────────────────┘  │
│                 │                    │
│  ┌──────────────▼────────────────┐  │
│  │  SQLite (~/Library/App Sup…)  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

On launch, the Tauri app:
1. Creates `~/Library/Application Support/Strata/` if needed
2. Runs `prisma migrate deploy` and `prisma db seed`
3. Starts the NestJS backend on port 3456
4. Starts the Astro frontend on port 4321
5. Shows a loading screen, then redirects to the frontend once healthy
6. On quit, kills both child processes

## Prerequisites

- **macOS 13+** (Apple Silicon or Intel)
- **Node.js 20+** (e.g. via Homebrew: `brew install node`)
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
| SQLite database | `~/Library/Application Support/Strata/strata.db` |
| Tauri logs | `~/Library/Logs/Strata/` |

## Menu Items

| Menu | Item | Action |
|------|------|--------|
| File | Reveal Data Folder | Opens `~/Library/Application Support/Strata/` in Finder |
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
- Check logs in `~/Library/Logs/Strata/`
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

## Future Improvements

- [ ] Bundle Node.js inside the .app (no system Node dependency)
- [ ] Bundle backend/frontend as Tauri resources for self-contained distribution
- [ ] Code-sign and notarize for public distribution
- [ ] Auto-update via Tauri updater plugin
- [ ] File → Export/Import Backup via IPC (currently available in web UI Settings)
