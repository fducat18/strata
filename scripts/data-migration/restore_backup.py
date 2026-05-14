#!/usr/bin/env python3
"""
Restore a Strata JSON backup into a SQLite database.

The backup format matches the response of `GET /api/v1/admin/backup`:
    {
      "schemaVersion": ...,
      "exportedAt": ...,
      "data": {
        "assetTypes": [...],
        "categories": [...],
        "tags": [...],
        "assets": [...],
        "assetSnapshots": [...],
        "portfolioSnapshots": [...],
        "transactions": [...],
        "categoriesOnAssets": [...],
        "tagsOnAssets": [...]
      }
    }

This is a low-level restore (direct SQLite INSERT in FK order). It assumes
the target DB has an empty schema already (e.g. just after `prisma migrate
deploy`). It is intended for the xlsx data-migration workflow where booting
the full NestJS app just to POST /restore is overkill.

Usage:
    python3 restore_backup.py --db PATH_TO_SQLITE --backup PATH_TO_JSON

Generic / no personal data — safe to commit.
"""
from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from pathlib import Path
from typing import Any


# Insertion order matters for foreign keys.
TABLES_IN_ORDER: list[tuple[str, str, list[str]]] = [
    # (json_key, sql_table, columns in sql)
    ("assetTypes", "asset_types", ["id", "code", "label", "group"]),
    ("categories", "categories", ["id", "name", "parent_id"]),
    ("tags", "tags", ["id", "name"]),
    (
        "assets",
        "assets",
        ["id", "name", "quantity", "disposed", "asset_type_id", "created_at", "updated_at"],
    ),
    (
        "assetSnapshots",
        "asset_snapshots",
        ["id", "asset_id", "value", "observed_at", "created_at"],
    ),
    (
        "portfolioSnapshots",
        "portfolio_snapshots",
        ["id", "value", "currency", "notes", "observed_at", "created_at"],
    ),
    (
        "transactions",
        "transactions",
        [
            "id",
            "asset_id",
            "type",
            "unit_price",
            "quantity",
            "currency",
            "occurred_at",
            "created_at",
        ],
    ),
    ("categoriesOnAssets", "asset_categories", ["asset_id", "category_id"]),
    ("tagsOnAssets", "asset_tags", ["asset_id", "tag_id"]),
]

# Mapping from JSON camelCase key → SQL snake_case column.
KEY_REMAP: dict[str, str] = {
    "parentId": "parent_id",
    "assetTypeId": "asset_type_id",
    "createdAt": "created_at",
    "updatedAt": "updated_at",
    "assetId": "asset_id",
    "observedAt": "observed_at",
    "unitPrice": "unit_price",
    "occurredAt": "occurred_at",
    "categoryId": "category_id",
    "tagId": "tag_id",
}


def to_sql_value(value: Any) -> Any:
    """Map JSON value → SQLite-compatible value."""
    if isinstance(value, bool):
        return 1 if value else 0
    return value


def restore(db_path: Path, backup_path: Path) -> dict[str, int]:
    with backup_path.open(encoding="utf-8") as f:
        payload = json.load(f)
    data = payload.get("data", payload)

    counts: dict[str, int] = {}
    conn = sqlite3.connect(str(db_path))
    try:
        conn.execute("PRAGMA foreign_keys = ON")
        for json_key, table, columns in TABLES_IN_ORDER:
            rows = data.get(json_key, []) or []
            if not rows:
                counts[table] = 0
                continue
            placeholders = ",".join(["?"] * len(columns))
            quoted_cols = ",".join(f'"{c}"' for c in columns)
            sql = f'INSERT INTO {table} ({quoted_cols}) VALUES ({placeholders})'
            payload_rows = []
            for row in rows:
                remapped = {KEY_REMAP.get(k, k): v for k, v in row.items()}
                payload_rows.append(tuple(to_sql_value(remapped.get(c)) for c in columns))
            conn.executemany(sql, payload_rows)
            counts[table] = len(payload_rows)
        conn.commit()
    finally:
        conn.close()
    return counts


def main() -> int:
    parser = argparse.ArgumentParser(description="Restore a Strata JSON backup into a SQLite DB.")
    parser.add_argument("--db", required=True, help="Path to target SQLite DB (must already have schema).")
    parser.add_argument("--backup", required=True, help="Path to backup JSON file.")
    args = parser.parse_args()

    db_path = Path(args.db).expanduser()
    backup_path = Path(args.backup).expanduser()
    if not db_path.exists():
        print(f"ERROR: DB not found at {db_path}", file=sys.stderr)
        return 1
    if not backup_path.exists():
        print(f"ERROR: backup not found at {backup_path}", file=sys.stderr)
        return 1

    counts = restore(db_path, backup_path)
    print("Restore complete. Inserted rows:")
    for table, n in counts.items():
        print(f"  {table:<22} {n}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
