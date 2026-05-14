"""Unit tests for the xlsx → Strata importer (parser-level functions).

Uses synthetic fixture data only — no personal asset names appear here.
Run with:
    python3 -m unittest scripts.data_migration.test_import_xlsx
or simply:
    python3 scripts/data-migration/test_import_xlsx.py
"""
from __future__ import annotations

import datetime as dt
import os
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path

THIS_DIR = Path(__file__).parent
sys.path.insert(0, str(THIS_DIR))

import import_xlsx as ix  # noqa: E402


class ParseDateTests(unittest.TestCase):
    def test_datetime_passthrough(self):
        d = dt.datetime(2024, 5, 14)
        self.assertEqual(ix.parse_date(d), dt.date(2024, 5, 14))

    def test_date_passthrough(self):
        d = dt.date(2024, 5, 14)
        self.assertEqual(ix.parse_date(d), d)

    def test_dd_mm_yyyy(self):
        self.assertEqual(ix.parse_date("30/01/2026"), dt.date(2026, 1, 30))

    def test_d_m_yyyy_short(self):
        self.assertEqual(ix.parse_date("5/11/2024"), dt.date(2024, 11, 5))

    def test_two_digit_year(self):
        self.assertEqual(ix.parse_date("01/02/24"), dt.date(2024, 2, 1))

    def test_french_full(self):
        self.assertEqual(ix.parse_date("14 Mars 2017"), dt.date(2017, 3, 14))

    def test_french_with_accent(self):
        self.assertEqual(ix.parse_date("4 décembre 2017"), dt.date(2017, 12, 4))

    def test_french_no_accent(self):
        self.assertEqual(ix.parse_date("4 decembre 2017"), dt.date(2017, 12, 4))

    def test_french_month_only_defaults_to_15(self):
        self.assertEqual(ix.parse_date("septembre 2018"), dt.date(2018, 9, 15))

    def test_empty(self):
        self.assertIsNone(ix.parse_date(""))
        self.assertIsNone(ix.parse_date(None))
        self.assertIsNone(ix.parse_date("   "))

    def test_french_no_space_day_month(self):
        self.assertEqual(ix.parse_date("14decembre 2019"), dt.date(2019, 12, 14))

    def test_column_placeholder_returns_none(self):
        self.assertIsNone(ix.parse_date("Column 5"))
        self.assertIsNone(ix.parse_date("column 12"))

    def test_garbage(self):
        self.assertIsNone(ix.parse_date("not a date"))


class RowClassificationTests(unittest.TestCase):
    def test_table_header_match(self):
        self.assertTrue(ix.is_table_header("2023/2024", ["2023/2024", "2022/2023"]))

    def test_table_header_no_match(self):
        self.assertFalse(ix.is_table_header("Checking", ["2023/2024"]))

    def test_table_header_empty(self):
        self.assertFalse(ix.is_table_header("", ["2023/2024"]))

    def test_skip_row_prefix(self):
        self.assertTrue(ix.is_skip_row("TOTAL CASH", ["TOTAL"]))
        self.assertTrue(ix.is_skip_row("GRAND TOTAL", ["GRAND TOTAL", "Growth"]))
        self.assertTrue(ix.is_skip_row("Growth Percentage", ["Growth"]))

    def test_skip_row_case_insensitive(self):
        self.assertTrue(ix.is_skip_row("total cash", ["TOTAL"]))

    def test_skip_row_no_match(self):
        self.assertFalse(ix.is_skip_row("Checking 1", ["TOTAL", "Growth"]))


class ResolveAssetTests(unittest.TestCase):
    BASE_CONFIG = {
        "rows": {
            "row a": {"action": "map", "asset_name": "Asset A"},
            "row b": {"action": "skip"},
            "row c": {"action": "create", "asset_name": "Asset C", "asset_type_code": "CHECKING_ACCOUNT"},
        },
        "context_overrides": [
            {"row_label": "shared", "before": "2024-01-01", "asset_name": "Legacy Asset"},
        ],
    }

    def test_map(self):
        r = ix.resolve_asset("Row A", dt.date(2024, 5, 1), self.BASE_CONFIG)
        self.assertEqual(r, ("Asset A", {"action": "map", "asset_name": "Asset A"}))

    def test_skip(self):
        r = ix.resolve_asset("Row B", dt.date(2024, 5, 1), self.BASE_CONFIG)
        self.assertIsNone(r)

    def test_create(self):
        r = ix.resolve_asset("Row C", dt.date(2024, 5, 1), self.BASE_CONFIG)
        self.assertEqual(r[0], "Asset C")
        self.assertEqual(r[1]["action"], "create")

    def test_unknown_label_returns_none(self):
        self.assertIsNone(ix.resolve_asset("Row Z", dt.date(2024, 5, 1), self.BASE_CONFIG))

    def test_context_override_before(self):
        r = ix.resolve_asset("Shared", dt.date(2023, 12, 31), self.BASE_CONFIG)
        self.assertEqual(r, ("Legacy Asset", {"action": "map"}))

    def test_context_override_after_falls_through(self):
        # No 'shared' base row → after 2024 there's no fallback, returns None.
        self.assertIsNone(ix.resolve_asset("Shared", dt.date(2024, 6, 1), self.BASE_CONFIG))


class FormatDecimalTests(unittest.TestCase):
    def test_int(self):
        self.assertEqual(ix.format_decimal(58805), "58805.00")

    def test_float_rounding(self):
        self.assertEqual(ix.format_decimal(290.44), "290.44")
        self.assertEqual(ix.format_decimal(290.456), "290.46")

    def test_zero(self):
        self.assertEqual(ix.format_decimal(0), "0.00")


class SchemaIntegrationTests(unittest.TestCase):
    """End-to-end with a tiny in-memory SQLite mirroring the Strata schema."""

    SCHEMA_SQL = """
    CREATE TABLE asset_types (id TEXT PRIMARY KEY, code TEXT UNIQUE, label TEXT, "group" TEXT);
    CREATE TABLE assets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        quantity DECIMAL,
        disposed INTEGER NOT NULL DEFAULT 0,
        asset_type_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    CREATE TABLE asset_snapshots (
        id TEXT PRIMARY KEY,
        asset_id TEXT NOT NULL,
        value DECIMAL NOT NULL,
        observed_at TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    CREATE TABLE transactions (
        id TEXT PRIMARY KEY,
        asset_id TEXT NOT NULL,
        type TEXT NOT NULL,
        unit_price DECIMAL NOT NULL,
        quantity DECIMAL NOT NULL,
        currency TEXT NOT NULL,
        occurred_at TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """

    def setUp(self):
        self.conn = sqlite3.connect(":memory:")
        self.conn.executescript(self.SCHEMA_SQL)
        self.conn.execute(
            "INSERT INTO asset_types VALUES (?, ?, ?, ?)",
            ("at-1", "CHECKING_ACCOUNT", "Checking Account", "FINANCIAL"),
        )
        # Pre-existing asset
        self.conn.execute(
            "INSERT INTO assets VALUES (?, ?, NULL, 0, ?, ?, ?)",
            ("a-1", "Existing Asset", "at-1", "2024-01-01", "2024-01-01"),
        )

    def test_ensure_asset_existing(self):
        aid, created = ix.ensure_asset(self.conn, "Existing Asset", "CHECKING_ACCOUNT", dt.date(2024, 1, 1), 100.0)
        self.assertEqual(aid, "a-1")
        self.assertFalse(created)
        # No transaction inserted
        cur = self.conn.execute("SELECT COUNT(*) FROM transactions")
        self.assertEqual(cur.fetchone()[0], 0)

    def test_ensure_asset_creates_with_acquire(self):
        aid, created = ix.ensure_asset(self.conn, "Brand New", "CHECKING_ACCOUNT", dt.date(2024, 5, 1), 500.0)
        self.assertTrue(created)
        cur = self.conn.execute("SELECT name FROM assets WHERE id = ?", (aid,))
        self.assertEqual(cur.fetchone()[0], "Brand New")
        cur = self.conn.execute("SELECT type, CAST(unit_price AS TEXT), occurred_at FROM transactions WHERE asset_id = ?", (aid,))
        row = cur.fetchone()
        self.assertEqual(row[0], "ACQUIRE")
        self.assertIn(row[1], ("500.00", "500"))
        self.assertTrue(row[2].startswith("2024-05-01"))

    def test_insert_snapshot_idempotent(self):
        ok1 = ix.insert_snapshot(self.conn, "a-1", dt.date(2024, 5, 1), 1234.56)
        ok2 = ix.insert_snapshot(self.conn, "a-1", dt.date(2024, 5, 1), 1234.56)
        self.assertTrue(ok1)
        self.assertFalse(ok2)
        cur = self.conn.execute("SELECT COUNT(*) FROM asset_snapshots WHERE asset_id = ?", ("a-1",))
        self.assertEqual(cur.fetchone()[0], 1)

    def test_apply_renames(self):
        results = ix.apply_renames(self.conn, [
            {"from": "Existing Asset", "to": "Renamed Asset"},
            {"from": "Does Not Exist", "to": "Whatever"},
        ])
        self.assertEqual(results[0], ("Existing Asset", "Renamed Asset", True))
        self.assertEqual(results[1], ("Does Not Exist", "Whatever", False))
        cur = self.conn.execute("SELECT name FROM assets WHERE id = 'a-1'")
        self.assertEqual(cur.fetchone()[0], "Renamed Asset")

    def test_walk_and_import_end_to_end(self):
        rows = [
            ("2024", dt.datetime(2024, 1, 15), dt.datetime(2024, 2, 15)),
            ("Existing Asset", 100.0, 110.0),
            ("Brand New", 500.0, 550.0),
            ("TOTAL", 600.0, 660.0),  # should be skipped
        ]
        config = {
            "table_headers": ["2024"],
            "skip_rows": ["TOTAL"],
            "renames": [],
            "rows": {
                "existing asset": {"action": "map", "asset_name": "Existing Asset"},
                "brand new": {
                    "action": "create",
                    "asset_name": "Brand New",
                    "asset_type_code": "CHECKING_ACCOUNT",
                },
            },
        }
        report = ix.walk_and_import(self.conn, rows, config, dry_run=False)
        self.assertEqual(report["snapshots_inserted"], 4)
        self.assertEqual(report["rows_skipped_aggregate"], 1)
        # Brand New should have been created with an ACQUIRE txn
        cur = self.conn.execute("SELECT COUNT(*) FROM assets WHERE name = 'Brand New'")
        self.assertEqual(cur.fetchone()[0], 1)
        cur = self.conn.execute(
            "SELECT type, occurred_at FROM transactions JOIN assets ON transactions.asset_id = assets.id "
            "WHERE assets.name = 'Brand New'"
        )
        row = cur.fetchone()
        self.assertEqual(row[0], "ACQUIRE")
        self.assertTrue(row[1].startswith("2024-01-15"))


if __name__ == "__main__":
    unittest.main()
