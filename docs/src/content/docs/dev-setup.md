---
title: "Development Setup"
description: How to run the Strata backend, frontend, and docs site locally without Docker.
---

:::tip[Node >=22 LTS — Node 22 recommended]
Strata uses Prisma's built-in SQLite driver (Rust query engine binary). The binary is platform-specific (darwin-arm64, linux-amd64…) but **not** Node-version-specific — it works on any Node >=22.

Node 22 LTS is the recommended version and is pinned in `.nvmrc`. Node 24, 26, and later LTS releases are fully supported. Docker always uses `node:22-alpine` internally.
:::

## Step 0 — Check prerequisites

Run this first after cloning the repo:

```bash
npm run setup
```

This checks Node version, Docker status, and port availability. Fix anything marked ❌ before continuing.

## Step 1 — Install Node 22 LTS (recommended)

```bash
# Install and switch to Node 22 (using nvm) — recommended; >=22 also works
nvm install 22
nvm use 22

# Verify
node --version   # v22.x.x (or v24.x.x / v26.x.x — any >=22 is fine)
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
npx prisma db seed          # Load demo data
npm run start:dev           # Starts on http://localhost:3000
```

:::note[Migrations run automatically]
NestJS runs `prisma migrate deploy` automatically on startup, before the server accepts connections. You do **not** need to run migrations manually in local dev.
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

