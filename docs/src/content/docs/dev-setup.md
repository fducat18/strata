---
title: "Development Setup"
description: How to run the Strata backend, frontend, and docs site locally without Docker.
---

:::tip[Node >=22 LTS — Node 24 recommended]
Strata uses Prisma's built-in SQLite driver (Rust query engine binary). The binary is platform-specific (darwin-arm64, linux-amd64…) but **not** Node-version-specific — it works on any Node >=22.

Node 24 LTS is the recommended version and is pinned in `.nvmrc`. Node 22, 26, and later LTS releases are fully supported. Docker uses `node:24-alpine` internally.
:::

## Step 0 — Check prerequisites

Run this first after cloning the repo:

```bash
npm run setup
```

This checks Node version, Docker status, and port availability. Fix anything marked ❌ before continuing.

## Step 1 — Install Node 24 LTS (recommended)

```bash
# Install and switch to Node 24 (using nvm) — recommended; >=22 also works
nvm install 24
nvm use 24

# Verify
node --version   # v24.x.x (or v22.x.x / v26.x.x — any >=22 is fine)
```

### Optional: auto-switch when entering the project directory

Add these 4 lines to your `~/.zshrc` (or `~/.bashrc`) to have nvm automatically use the right
version whenever you `cd` into the project (uses the `.nvmrc` file at the repo root):

```zsh
# Auto-switch Node version on cd (reads .nvmrc)
autoload -U add-zsh-hook
load-nvmrc() { [[ -f .nvmrc ]] && nvm use --silent; }
add-zsh-hook chpwd load-nvmrc && load-nvmrc
```

After adding this, open a new terminal and `cd` into the repo — nvm will automatically switch to Node 22.

## Step 2 — Backend

```bash
cd backend
nvm use 22            # Recommended; any Node >=22 works
npm install
npx prisma db seed          # Load demo data (first run only)
npm run start:dev           # Starts on http://localhost:3000
```

:::note[Migrations run automatically]
NestJS runs `prisma migrate deploy` automatically on startup, before the server accepts connections. You do **not** need to run migrations manually in local dev.
:::

:::note[Docker seeds only on first start]
When starting with Docker, the seed step is skipped automatically if the database already exists. This preserves user data and deliberate demo-asset deletions across restarts.
:::

:::note[Prisma client is generated automatically]
`npm run build` (and `npm run start:dev`) automatically runs `prisma generate` via the `prebuild` lifecycle hook. You do **not** need to run it manually. If you ever see TypeScript errors like `Module '"@prisma/client"' has no exported member 'PrismaClient'`, run `npx prisma generate` manually to regenerate the client.
:::

- API: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/swagger` (always available)

## Step 3 — Frontend

```bash
cd front
npm install
npm run dev                 # Starts on http://localhost:4321
```

The frontend expects the backend at `http://localhost:3000/api/v1` by default.

## Step 4 — Docs Site (optional)

```bash
cd docs
npm install
npm run dev                 # Starts on http://localhost:8001
```

The docs dev server runs at port `8001` — consistent with Docker.

## Step 5 — Tauri Desktop App (optional)

The desktop app wraps both the backend and frontend in a native macOS window using Tauri v2 (Rust).

**Prerequisites:**

- **Rust** — install via [rustup](https://rustup.rs):
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  source ~/.cargo/env   # or restart your terminal
  ```
- **Node ≥ 22** — already required for backend/frontend

**Run in dev mode:**

```bash
npm run tauri:dev
```

This script automatically:
1. Installs root/front/backend dependencies
2. Builds the frontend with the Tauri API URL (`http://localhost:3456/api/v1`)
3. Generates the Prisma client and builds the backend
4. Launches `tauri dev`

:::caution[Rust required]
If you see `cargo metadata: No such file or directory`, Rust is not installed. Run `npm run setup` — it will show a ❌ for Rust with install instructions.
:::

## Running All Three Together

Open three terminal tabs:
```bash
# Tab 1 — Backend
cd backend && npm run start:dev

# Tab 2 — Frontend
cd front && npm run dev       # http://localhost:4321

# Tab 3 — Docs (optional, for authoring)
cd docs && npm run dev        # http://localhost:8001
```

## Tests

```bash
# Backend (run from backend/)
cd backend
npm test            # Unit tests
npm run test:e2e    # E2E tests

# Frontend (run from front/)
cd front
npm test            # Unit tests (Vitest)
npm run test:e2e    # E2E tests (Playwright)
```

