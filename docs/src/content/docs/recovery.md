---
title: "Recovery — Fresh Laptop in 3 Years"
---

This guide covers the **"I just got a new laptop and I want my Strata data
back"** scenario. Three personas:

1. You used the **Docker** setup → your data lives on a host volume.
2. You used the **Strata desktop app** → your data lives under
   `~/Library/Application Support/Strata/strata.db` (macOS).
3. You only have a **JSON backup** export.

---

## 0. Get the source code back

```bash
git clone https://github.com/francoiducat/strata.git
cd strata
```

Make sure your tooling is installed (Node 20+, npm, optionally Docker
Desktop, optionally Rust + Tauri CLI for the desktop app).

---

## 1. Restore from a SQLite file (Docker user)

You backed up `backend/.data/strata.db` (or the `./.data/strata.db` mounted
volume from `docker-compose.yml`). Drop it back in:

```bash
mkdir -p backend/.data
cp /path/to/your/strata.db backend/.data/strata.db

# Apply any new migrations that shipped after your backup:
cd backend
npx prisma migrate deploy
cd ..

# Start everything
npm run docker:dev
```

Verify:

```bash
curl -s http://localhost:3000/api/v1/assets | jq length
curl -s http://localhost:3000/api/v1/portfolio-snapshots | jq length
curl -s http://localhost:3000/api/v1/version
```

Then open http://localhost:4321 and check the dashboard renders your assets and net worth chart.

---

## 2. Restore from a SQLite file (Desktop app user)

The desktop `.app` keeps its DB at:

| Build flavour | Path |
|---|---|
| Production (tagged release) | `~/Library/Application Support/Strata/strata.db` |
| Dev build (`-dirty` / `0.0.0-dev`) | `~/Library/Application Support/Strata-Dev/strata.db` |

Restore is just:

```bash
mkdir -p "$HOME/Library/Application Support/Strata"
cp /path/to/your/strata.db \
   "$HOME/Library/Application Support/Strata/strata.db"
```

Then launch the app. The current data folder is shown in **About → Strata**
(also in the app log file at `~/Library/Logs/Strata/`).

---

## 3. Restore from a JSON backup

If all you have is the JSON export from **Settings → Export Backup**:

1. Start the backend (Docker or local — see [Quick Start](/docs/quickstart/)).
2. Open http://localhost:4321/settings.
3. Click **Import Backup**, pick the JSON file, confirm in the dialog.

The import endpoint (`POST /api/v1/admin/restore`) is idempotent and wraps
the entire restore in a single transaction.

---

## 4. Verify

After any restore:

- `curl /api/v1/assets | jq length` → expected asset count
- `curl /api/v1/portfolio-snapshots | jq length` → expected snapshot count
- `curl /api/v1/version` → confirms which build is running
- Open dashboard → snapshot timeline + allocation chart render

---

## 5. Recommended ongoing backup strategy

- **Weekly JSON export** to iCloud Drive or any cloud sync (lossless,
  human-readable).
- **Daily SQLite copy** if you're a heavy user (small file, fast):

  ```bash
  cp "$HOME/Library/Application Support/Strata/strata.db" \
     "$HOME/iCloud/Strata-Backups/strata-$(date +%Y%m%d).db"
  ```

- Store at least one backup off-machine.

See also: [Backup](/docs/backup/) for the full backup philosophy and
[Versioning](/docs/versioning/) for how to identify which build produced a
backup.
