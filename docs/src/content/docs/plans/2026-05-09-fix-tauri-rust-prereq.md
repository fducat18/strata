---
title: Fix — missing Rust/Cargo prerequisite for Tauri desktop
description: Add Rust/Cargo pre-flight checks to tauri-dev.sh, tauri-build.sh, and check-prereqs.mjs so missing Rust produces a clear, actionable error instead of a cryptic cargo metadata failure.
---

## Problem

`npm run tauri:dev` failed with:

```
failed to run 'cargo metadata' command to get workspace directory:
failed to run command cargo metadata --no-deps --format-version 1:
No such file or directory (os error 2)
```

**Root cause:** Rust/Cargo is not installed. Tauri requires Rust to compile the desktop shell. `~/.cargo`, `rustup`, and `cargo` were all absent.

This is a **system prerequisite**, not a code bug. However, the scripts were producing a cryptic OS error instead of a clear "install Rust" message.

---

## Changes

### `scripts/tauri-dev.sh` and `scripts/tauri-build.sh`

Two improvements:

1. **Source `~/.cargo/env`** — rustup installs Cargo to `~/.cargo/bin` which is not on PATH in non-interactive shells (script shebangs). Sourcing the env file fixes this for users who installed Rust via rustup but haven't updated their shell profile.

2. **Pre-flight `cargo` check** — if `cargo` is still not found after sourcing, print a clear error with the install command and exit cleanly instead of letting Tauri produce a cryptic `No such file or directory` OS error.

```bash
# Source rustup environment if available (cargo may not be on PATH in non-interactive shells)
if [[ -f "$HOME/.cargo/env" ]]; then
  source "$HOME/.cargo/env"
fi

# Verify cargo is available (Tauri requires Rust to build the desktop shell)
if ! command -v cargo &>/dev/null; then
  echo ""
  echo "❌  Rust/Cargo not found. Tauri requires Rust to build the desktop app."
  echo ""
  echo "   Install Rust with:"
  echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
  echo "   source ~/.cargo/env"
  echo ""
  echo "   Then re-run this script."
  exit 1
fi
```

### `scripts/check-prereqs.mjs`

Added Rust/Cargo check so `npm run setup` catches this gap before the user tries to run the desktop app:

```js
let cargoOk = false;
try { execSync('cargo --version', { stdio: 'ignore' }); cargoOk = true; } catch {}
check(
  'Rust/Cargo (required for Tauri desktop)',
  cargoOk,
  'Install: curl --proto=\'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh\n      Then: source ~/.cargo/env',
);
```

### `docs/src/content/docs/dev-setup.md`

Added a **Tauri Desktop App** section explaining Rust as a prerequisite and how to install it.

---

## Execution Summary

_To be appended after implementation._
