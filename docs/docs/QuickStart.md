# Quick Start

## Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org/)
- **npm** — comes with Node.js
- **Docker** (optional) — for containerized development

## Option 1: Docker (Recommended)

```bash
git clone https://github.com/francoiducat/strata.git
cd strata
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Backend API | http://localhost:3000/api/v1 |
| Swagger UI | http://localhost:3000/swagger |
| Frontend | http://localhost:4321 |
| Docs | http://localhost:8001 |

## Option 2: Local Development

### Backend

```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

The API is available at `http://localhost:3000/api/v1` and Swagger UI at `http://localhost:3000/swagger`.

### Frontend

```bash
cd front
npm install
npm run dev
```

The frontend is available at `http://localhost:4321`.

## Running Tests

### Backend Tests

```bash
cd backend
npm test              # Unit tests (Jest)
npm run test:e2e      # E2E tests (Supertest)
```

### Frontend Tests

```bash
cd front
npm test              # Unit tests (Vitest)
npm run test:e2e      # E2E tests (Playwright)
```

## Project Structure

```
strata/
├── backend/           ← NestJS API (port 3000)
├── front/             ← Astro + React UI (port 4321)
├── docs/              ← MkDocs documentation
├── .bruno/            ← Bruno API collection
└── docker-compose.yml
```

## API Collection

A complete [Bruno](https://www.usebruno.com/) API collection is available in `.bruno/Strata/` with requests for all endpoints.
