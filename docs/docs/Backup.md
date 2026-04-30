# Backup & Restore

## Why backups exist

Strata is a **single-user, self-hosted app** backed by a local SQLite file
(`backend/.data/strata.db`). There is no cloud, no shared service, no operator
watching over your data — your data is **your** responsibility. To make that
responsibility easy to discharge, Strata supports two complementary backup
paths: a **portable JSON dump** via the `/admin/backup` API (also exposed in
the Settings UI), and the **raw SQLite file** which you can copy yourself.
Either one is sufficient to restore; keeping both is belt-and-braces.

---

## What's in a backup vs what's NOT

A JSON backup contains **every row of every domain table** managed by Strata:

| Included                                               | NOT included                                       |
| ------------------------------------------------------ | -------------------------------------------------- |
| Asset types (`assetTypes`)                             | Auth tokens, sessions, API keys (none exist today) |
| Portfolios (`portfolios`)                              | Application logs (`backend/logs/`, stdout)         |
| Categories (`categories`, including parent hierarchy)  | Anything outside `backend/.data/strata.db`         |
| Tags (`tags`)                                          | Frontend localStorage (theme, locale preferences)  |
| Assets (`assets`)                                      | Prisma migration history rows                      |
| Asset snapshots (`assetSnapshots`)                     | OS-level backups, Docker volumes other than `.data` |
| Portfolio snapshots (`portfolioSnapshots`)             | Generated/derived data (it's recomputed on read)   |
| Transactions (`transactions`)                          |                                                    |
| Join rows (`categoriesOnAssets`, `tagsOnAssets`)       |                                                    |

If you store attachments, screenshots, or notes outside the database, **back
those up separately** — Strata won't see them.

---

## JSON backup format

The export endpoint returns a single JSON document with three top-level keys:

```json
{
  "schemaVersion": "1",
  "exportedAt": "2025-01-15T09:42:11.123Z",
  "data": {
    "assetTypes":         [ /* ... */ ],
    "portfolios":         [ /* ... */ ],
    "categories":         [ /* ... */ ],
    "tags":               [ /* ... */ ],
    "assets":             [ /* ... */ ],
    "assetSnapshots":     [ /* ... */ ],
    "portfolioSnapshots": [ /* ... */ ],
    "transactions":       [ /* ... */ ],
    "categoriesOnAssets": [ /* ... */ ],
    "tagsOnAssets":       [ /* ... */ ]
  }
}
```

Minimal example:

```json
{
  "schemaVersion": "1",
  "exportedAt": "2025-01-15T09:42:11.123Z",
  "data": {
    "assetTypes": [
      { "id": "at_cash", "code": "CASH", "label": "Cash" }
    ],
    "portfolios": [
      { "id": "p_1", "name": "Main", "baseCurrency": "EUR", "createdAt": "2025-01-10T08:00:00.000Z" }
    ],
    "assets": [
      { "id": "a_1", "portfolioId": "p_1", "assetTypeId": "at_cash", "name": "Wallet", "quantity": "1.00000000" }
    ],
    "assetSnapshots": [
      { "id": "s_1", "assetId": "a_1", "value": "250.00", "observedAt": "2025-01-15T00:00:00.000Z" }
    ],
    "categories": [], "tags": [],
    "portfolioSnapshots": [], "transactions": [],
    "categoriesOnAssets": [], "tagsOnAssets": []
  }
}
```

### Serialization rules

- **`Decimal` values** (monetary amounts, quantities) are emitted as **strings**
  in plain decimal notation (no scientific notation). This avoids any
  floating-point loss.
- **Timestamps** (any field ending in `At`) are ISO 8601 strings; they are
  parsed back to `Date` on import.

### `schemaVersion` strategy

`schemaVersion` is currently **`"1"`**. The contract:

- **Bump on breaking format changes only** — renamed/removed fields, structural
  reshapes, semantic changes that the importer can't auto-handle.
- **Don't bump for additive changes** — new optional fields, new entity tables.
  Older backups stay restorable; new fields simply default.
- When bumped, Strata ships a **migration note** in the release notes
  describing how to upgrade an older JSON to the new version (and, where
  feasible, a one-shot conversion script).

The `/admin/restore` endpoint **rejects unknown versions** with HTTP 400 rather
than guessing — you'll never silently lose data to a format mismatch.

---

## API: Export

```bash
curl -fsS http://localhost:3000/api/v1/admin/backup \
  -o "strata-backup-$(date +%F).json"
```

Result: a file like `strata-backup-2025-01-15.json` in your current directory.
The file is plain JSON — open it in any editor, diff it, grep it.

---

## API: Restore

The restore endpoint accepts the same payload shape, plus an optional `mode`:

| Mode      | Behaviour                                                                 |
| --------- | ------------------------------------------------------------------------- |
| `replace` | (default) **Wipe** every domain table, then insert the backup. Destructive. |
| `merge`   | **Upsert** rows by primary key. Existing rows with matching ids are updated; non-matching rows are kept. |

Both modes run inside a single Prisma transaction — if any row fails, the
entire restore is rolled back (all-or-nothing).

### Replace (clean restore)

> ⚠️ **`replace` deletes everything currently in the database** before inserting
> the backup. Take a fresh export _first_ if there's any chance you want to keep
> the current state.

```bash
curl -fsS -X POST http://localhost:3000/api/v1/admin/restore \
  -H 'Content-Type: application/json' \
  --data-binary @strata-backup-2025-01-15.json
```

(The exported file already has the `{schemaVersion, exportedAt, data}` shape
the endpoint expects. `mode` defaults to `replace`.)

### Merge (additive)

```bash
jq '. + {mode: "merge"}' strata-backup-2025-01-15.json \
  | curl -fsS -X POST http://localhost:3000/api/v1/admin/restore \
      -H 'Content-Type: application/json' \
      --data-binary @-
```

Response:

```json
{
  "schemaVersion": "1",
  "mode": "replace",
  "counts": {
    "assetTypes": 13,
    "portfolios": 1,
    "categories": 5,
    "tags": 3,
    "assets": 12,
    "assetSnapshots": 47,
    "portfolioSnapshots": 8,
    "transactions": 0,
    "categoriesOnAssets": 9,
    "tagsOnAssets": 4
  }
}
```

`counts` is the number of rows the importer touched per table — a quick sanity
check against your expectations.

---

## UI: Tauri / Web

The Settings page (`front/` → **Settings → Backup**) wraps the same two
endpoints with a friendlier flow:

- **Export** — click *Export*; the browser (or Tauri file dialog) prompts you
  to save `strata-backup-YYYY-MM-DD.json` wherever you want.
- **Import** — click *Import*, pick a `.json` file with the file picker, review
  the parsed summary, then confirm. The confirm step is deliberate: import
  defaults to `replace` mode and overwrites your current data.

Under the hood it's the exact same `GET /api/v1/admin/backup` and
`POST /api/v1/admin/restore` calls — the UI adds nothing the API doesn't.

---

## Raw SQLite alternative

For a **full-fidelity, byte-for-byte copy**, just copy the database file:

```bash
# Stop the backend (or `docker compose stop backend`) so SQLite isn't mid-write
cp backend/.data/strata.db backup-strata-$(date +%F).db
```

When to prefer the raw file:

- You want **identical** state restored — including Prisma migration history
  and any future tables not yet covered by the JSON exporter.
- You want the smallest possible recovery (no API needed — just drop the file
  back into `backend/.data/`).
- You're snapshotting before a risky operation and want a one-line rollback.

When to prefer JSON:

- You're moving between machines / OSes / Docker volumes.
- You want a human-readable, diff-able, grep-able archive.
- You want forward-compatibility across schema changes (the importer normalises
  old shapes; a raw `.db` from an older Prisma schema may not open against a
  newer binary without running migrations).

**Both at once is fine.** Recommended.

---

## Restoring on a fresh laptop

The "three years from now, new laptop, where do I start?" recipe. See also
[Quick Start → Recovery](QuickStart.md#recovery-fresh-laptop-three-years-from-now)
for the full walkthrough; below is the short version assuming you have a JSON
backup in hand.

```bash
# 1. Install Docker Desktop, then:
git clone https://github.com/francoiducat/strata.git
cd strata

# 2. Boot the stack — this applies migrations and seeds reference data.
docker compose up --build -d
# Wait until backend logs show "Nest application successfully started"

# 3. Restore your backup (replace mode wipes the freshly-seeded empty DB).
curl -fsS -X POST http://localhost:3000/api/v1/admin/restore \
  -H 'Content-Type: application/json' \
  --data-binary @/path/to/strata-backup-YYYY-MM-DD.json

# 4. Verify.
curl -fsS http://localhost:3000/api/v1/portfolios | jq 'length'
open http://localhost:4321
```

If you also kept the raw `strata.db`, you can skip step 3 entirely:

```bash
docker compose down
cp /path/to/your/strata.db backend/.data/strata.db
docker compose up -d
```

---

## Backup hygiene tips

- **Encrypt at rest.** Backups contain your full financial picture. Store them
  in an encrypted volume (FileVault / LUKS / VeraCrypt) or encrypt the file
  itself: `gpg --symmetric --cipher-algo AES256 strata-backup-2025-01-15.json`.
- **Keep an off-laptop copy.** A backup that lives only on the laptop you're
  trying to recover is not a backup. Cloud storage (encrypted), an external
  drive, a second machine — anything off-machine.
- **Export on a schedule.** A reasonable baseline:
  - Manual export after any large data-entry session.
  - Automated weekly export (a cron + the `curl` snippet above).
  - Monthly raw `strata.db` copy as a "belt" backup.
- **Test the restore.** Once a quarter, restore your latest backup into a
  throwaway directory and confirm the dashboard looks right. An untested
  backup is a wish, not a backup.
- **Version your backups.** Keep at least the last few — if a corrupted state
  gets exported, you'll want yesterday's file, not just today's.

---

## Troubleshooting

### `Unsupported backup schemaVersion 'X', expected '1'`

The file you're importing was produced by a Strata version with a different
backup format. Check release notes for a migration script, or open the file
and bump `schemaVersion` only if the release notes say it's safe.

### `400 Bad Request` on restore

`RestoreBackupDto` validates that `schemaVersion` is a non-empty string and
`data` is an object. The most common causes:

- The file is wrapped in something extra (e.g. an `axios` response with
  `{ data: { schemaVersion, ... } }`). Send the inner object only.
- `Content-Type` is not `application/json`.
- The file was edited by hand and is no longer valid JSON (`jq . file.json`
  to verify).

### Partial restore? (no — it's all-or-nothing)

The importer runs every delete + every insert inside a single Prisma
transaction. If any single row fails (FK violation, unique-constraint
collision in `merge` mode, malformed value), the **whole transaction is rolled
back** and your existing data is untouched. There is no "half-restored" state
to clean up.

### `replace` deleted my data and the import then failed

It can't — the wipe and the inserts are in the same transaction. If you see
empty tables after a failed restore, something else is wrong (e.g. you ran a
manual `DELETE` separately). Restore from your most recent backup.

### Decimal precision drift

All `Decimal` fields round-trip as strings. If you see a value like `"1.5"`
restored as `"1.50"`, that's expected: Prisma re-formats Decimals according to
their column scale (`Numeric(20, 2)` for money, `Numeric(20, 8)` for
quantities). The mathematical value is identical.
