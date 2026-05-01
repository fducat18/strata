# Bundle Node.js runtime inside the Strata.app

## Why this is deferred

The current Strata desktop app spawns the NestJS backend and Astro SSR
frontend as Node child processes ("sidecars") that rely on a system-wide
Node.js installation (`/opt/homebrew/bin/node` on Apple Silicon, or whatever
`node` resolves to on `PATH`). For the current single-developer use case
(François, on a Mac that already has Node installed for development) this is
acceptable, and bundling Node would add real complexity (sidecar binary
management, Tauri resource path resolution, signing implications) without a
proportional payoff.

Bundling becomes worth doing when any of these is true:

- The .app needs to be distributed to non-technical users (family, friends).
- We want to guarantee the .app keeps working after an accidental
  `brew uninstall node`.
- We start producing official releases for download (GitHub Releases).

## Current limitation

- `src-tauri/src/lib.rs` `find_node()` and `find_npx()` hard-code paths to
  homebrew/system locations and fall back to bare `node` / `npx` if not
  found. If neither is available, sidecar boot fails silently and the app
  hangs on a loading screen.
- The .app does **not** ship the `backend/dist/`, `front/dist/` artifacts;
  it loads them from the user's clone of the repo (see `repo_root()` in
  `lib.rs`). This means the .app is not redistributable — it is tied to
  one machine's filesystem layout.
- The `DesktopApp.md` docs explicitly tell users to `brew install node` as
  a prerequisite.

## Acceptance criteria

- [ ] Node.js binary is bundled inside `Strata.app/Contents/Resources/node/`
      (or equivalent) at build time, sourced from the official Node.js
      tarballs for the target architecture.
- [ ] `backend/dist/` and `front/dist/` are bundled as Tauri resources so
      the .app no longer reads from the host repo.
- [ ] `find_node()` / `find_npx()` resolve to the bundled binary first;
      system Node is only a fallback for development.
- [ ] On a clean Mac (no Homebrew, no system Node), double-clicking
      `Strata.app` brings up a working app with seeded data.
- [ ] `DesktopApp.md` is updated: system Node is no longer a prerequisite.
- [ ] `.app` size impact documented (Node ~80MB compressed; expected total
      ≈ 120–150MB).
- [ ] Build script handles both Apple Silicon and Intel (universal binary
      or two separate builds).
- [ ] Sidecar boot failure now surfaces an OS-native error dialog instead
      of hanging the loading screen.

## References

- `src-tauri/src/lib.rs` — `find_node()`, `find_npx()`, `repo_root()`
- `docs/src/content/docs/DesktopApp.md` — current "Prerequisites" section
- Tauri docs on bundling sidecars: https://v2.tauri.app/develop/sidecar/
- Tauri docs on resources: https://v2.tauri.app/develop/resources/
- Node official binaries: https://nodejs.org/dist/
