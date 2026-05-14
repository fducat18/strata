# scripts/data-migration

One-shot ETL to import historical asset snapshots from an xlsx workbook into a
Strata SQLite database. Designed for users coming from a spreadsheet-based
net-worth tracker.

## What's here

| File                    | Purpose                                              | Committed? |
|-------------------------|------------------------------------------------------|------------|
| `restore_backup.py`     | Restore a Strata JSON backup into an empty SQLite DB | yes        |
| `import_xlsx.py`        | Generic xlsx → Strata snapshot importer              | yes        |
| `mapping.example.json`  | Sanitised config template                            | yes        |
| `mapping.local.json`    | Your actual config (asset names, paths)              | **NO** (gitignored) |
| `output/`               | Any debug / report files                              | **NO** (gitignored) |

All personal data lives in `mapping.local.json` and is never committed.
The Python sources contain zero asset names.

## Prerequisites

```bash
pip3 install --user openpyxl
```

The target SQLite database must already have the Strata schema applied
(usually via `prisma migrate deploy`).

## Workflow (dev test run)

```bash
# 1. Reset the dev database
DEVDB="$HOME/Library/Application Support/Strata-Dev/strata.db"
rm -f "$DEVDB"
cd backend && DATABASE_URL="file:$DEVDB" npx prisma migrate deploy && cd ..

# 2. (Optional) Pre-populate with a prod backup so the importer can map
#    onto real asset names
python3 scripts/data-migration/restore_backup.py \
  --db "$DEVDB" \
  --backup /path/to/your/strata-backup.json

# 3. Copy the example config and edit it
cp scripts/data-migration/mapping.example.json \
   scripts/data-migration/mapping.local.json
# … edit mapping.local.json with your xlsx path, DB path, and row→asset map …

# 4. Dry run (rolls back the transaction at the end)
python3 scripts/data-migration/import_xlsx.py \
  --config scripts/data-migration/mapping.local.json --dry-run

# 5. Real run
python3 scripts/data-migration/import_xlsx.py \
  --config scripts/data-migration/mapping.local.json
```

## Config schema

See `mapping.example.json` and the module docstring at the top of
`import_xlsx.py`.

Key concepts:

- **`table_headers`**: strings the importer recognises as the start of a new
  "year table" in the worksheet. The cells in the same row are read as dates.
- **`skip_rows`**: case-insensitive **prefix** matches; any row whose first
  cell starts with one of these is ignored (aggregates / totals).
- **`rows`**: keyed by the lowercase first-cell value of each data row.
  Each entry is one of:
  - `{"action": "map", "asset_name": "..."}` — match an existing asset by name.
  - `{"action": "create", "asset_name": "...", "asset_type_code": "..."}` —
    insert a new asset on first encounter and add an `ACQUIRE` transaction
    dated on its earliest snapshot (Strata Convention 7 invariant).
  - `{"action": "skip"}` — explicitly drop this row.
- **`renames`**: applied once before importing snapshots; useful when an old
  xlsx label maps onto an asset you want renamed.
- **`context_overrides`**: route the same row label to different assets
  depending on the snapshot date (e.g. a legacy single column that later
  split into two assets).

## Idempotency

The importer checks for an existing `(asset_id, observed_at)` snapshot and
skips it if present. Re-running the script is a no-op.

## Rollback

If something goes wrong, delete the dev DB and start over from step 1; the
prod DB is never touched.

## Tests

```bash
python3 -m unittest scripts.data_migration.test_import_xlsx
```
