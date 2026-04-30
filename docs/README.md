# Strata Documentation Site

MkDocs Material site published to <https://strata.ducatillon.net/docs/>.

## Local preview (live reload)

```bash
cd docs
pip install mkdocs mkdocs-material pymdown-extensions
mkdocs serve
```

Open <http://127.0.0.1:8000>.

## Build the static site

```bash
mkdocs build --strict
# Output: ./site/
```

`--strict` fails the build on broken links and pages outside the nav. CI relies on this.

## Container

The `Dockerfile` is a **two-stage** build:

1. `python:3.12-slim` runs `mkdocs build --strict`, producing `site/`.
2. `nginx:alpine` serves that static `site/` on port `8000`.

This is intentionally **not** `mkdocs serve` — the container ships a pre-built site so it boots fast, has no Python at runtime and behaves the same locally and in production. `docker-compose.yml` maps host `8001` → container `8000`, so <http://localhost:8001> still works after `docker compose up`.

If you change docs while the container is running, rebuild:

```bash
docker compose up --build docs
```

For live-reload while editing, prefer `mkdocs serve` on the host (above) instead of the container.

## Layout

| Path | Purpose |
|---|---|
| `mkdocs.yml` | Site config + navigation |
| `docs/` | Markdown source — every file here is part of the published site |
| `_internal/` | Drafts and snippets **excluded from the build** (kept under version control for reference) |
| `site/` | Generated output (gitignored) |
| `Dockerfile` | Multi-stage build → nginx |
