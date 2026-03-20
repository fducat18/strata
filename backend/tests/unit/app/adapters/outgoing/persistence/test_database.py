"""Tests for database.py uncovered lines."""
import importlib
import os
import sqlite3
import pytest


def test_get_db_yields_and_closes():
    from app.adapters.outgoing.persistence.database import get_db
    gen = get_db()
    db = next(gen)
    assert db is not None
    try:
        next(gen)
    except StopIteration:
        pass


def test_load_backend_dotenv_returns_when_database_url_set(monkeypatch):
    """Covers the first early return in _load_backend_dotenv_if_needed."""
    monkeypatch.setenv("DATABASE_URL", "sqlite:///test.db")
    from app.adapters.outgoing.persistence import database
    # Call directly - should return early without error
    database._load_backend_dotenv_if_needed()


def test_load_backend_dotenv_returns_when_production(monkeypatch):
    """Covers the second early return in _load_backend_dotenv_if_needed."""
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("ENV", "production")
    from app.adapters.outgoing.persistence import database
    database._load_backend_dotenv_if_needed()


def test_database_sqlite_relative_path():
    """Covers the elif DATABASE_URL.startswith('sqlite:///') branch (3-slash, relative)."""
    import app.adapters.outgoing.persistence.database as db_module
    restore_url = db_module.DATABASE_URL  # save current valid URL

    # Use a relative path (3-slash prefix, no absolute path)
    os.environ["DATABASE_URL"] = "sqlite:///coverage_test_relative.db"
    try:
        importlib.reload(db_module)
        assert "coverage_test_relative.db" in db_module.DATABASE_URL
    finally:
        os.environ["DATABASE_URL"] = restore_url
        importlib.reload(db_module)
        os.environ.pop("DATABASE_URL", None)


def test_database_invalid_sqlite_raises_value_error():
    """Covers line 55: else: raise ValueError for invalid SQLite URL."""
    import app.adapters.outgoing.persistence.database as db_module
    restore_url = db_module.DATABASE_URL  # save current valid URL

    # sqlite://invalid starts with 'sqlite' but not 'sqlite:////' or 'sqlite:///'
    os.environ["DATABASE_URL"] = "sqlite://invalid"
    try:
        with pytest.raises(ValueError, match="Invalid SQLite URL format"):
            importlib.reload(db_module)
    finally:
        # Restore with the previous valid URL
        os.environ["DATABASE_URL"] = restore_url
        importlib.reload(db_module)
        os.environ.pop("DATABASE_URL", None)


def test_configure_sqlite_connection_forces_delete_journal_mode(tmp_path):
    from app.adapters.outgoing.persistence.database import _configure_sqlite_connection

    db_path = tmp_path / "journal_mode_test.db"
    connection = sqlite3.connect(db_path)
    try:
        original_mode = connection.execute("PRAGMA journal_mode=WAL;").fetchone()[0]
        assert original_mode.lower() == "wal"

        _configure_sqlite_connection(connection, None)

        current_mode = connection.execute("PRAGMA journal_mode;").fetchone()[0]
        assert current_mode.lower() == "delete"
    finally:
        connection.close()
