"""
Database configuration and session management.
"""
from pathlib import Path
from typing import Generator, Optional
import os
import logging

from dotenv import load_dotenv
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker


def _load_backend_dotenv_if_needed() -> None:
    """
    Load `backend/.env` into the environment only when:
    - `DATABASE_URL` is not already set, and
    - `ENV` is not 'production', and
    - the file exists.
    """
    if os.getenv("DATABASE_URL"):
        return

    if os.getenv("ENV", "").lower() == "production":
        return

    dotenv_path = Path(__file__).parents[4] / ".env"
    if dotenv_path.exists():
        load_dotenv(dotenv_path=str(dotenv_path))


_load_backend_dotenv_if_needed()

# -------------------------------------------------------------------
# Database configuration
# -------------------------------------------------------------------

# Default to backend/.data/strata.db inside the repository so local imports
# don't attempt to write to /app which may be read-only outside Docker.
_default_db_path = (Path(__file__).parents[4] / ".data" / "strata.db").resolve()
DEFAULT_DATABASE_URL = f"sqlite:///{_default_db_path.as_posix()}"

# Read environment or fallback to default
DATABASE_URL: str = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)

# If the env provided a Docker-style path (e.g. sqlite:////app/.data/...),
# and we are running outside Docker where /app may be read-only or missing,
# try to create the parent dir; if that fails, fall back to the repo-local DB.
if DATABASE_URL.startswith("sqlite"):
    if DATABASE_URL.startswith("sqlite:////"):
        db_path_str = DATABASE_URL.replace("sqlite:////", "/", 1)
    elif DATABASE_URL.startswith("sqlite:///"):
        db_path_str = DATABASE_URL.replace("sqlite:///", "", 1)
    else:
        raise ValueError(f"Invalid SQLite URL format: {DATABASE_URL}")

    db_path = Path(db_path_str).resolve()

    try:
        db_path.parent.mkdir(parents=True, exist_ok=True)
        # Use the requested path
        DATABASE_URL = f"sqlite:///{db_path.as_posix()}"
    except Exception as exc:  # pragma: no cover - environment dependent
        logging.warning(
            "Could not create database parent directory '%s' (permission or read-only): %s",
            db_path.parent,
            exc,
        )
        # If the requested DB path looks like the Docker-mounted /app path, fall back
        # to the repository-local default so local runs don't fail.
        try:
            fallback_db = _default_db_path
            fallback_db.parent.mkdir(parents=True, exist_ok=True)
            DATABASE_URL = f"sqlite:///{fallback_db.as_posix()}"
            logging.info("Falling back to local database path: %s", DATABASE_URL)
        except Exception:
            # If even fallback cannot be created, re-raise the original exception
            raise

_connect_args: Optional[dict] = (
    {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else None
)

engine = create_engine(DATABASE_URL, connect_args=_connect_args or {})


def _configure_sqlite_connection(dbapi_connection, _connection_record) -> None:
    """Force classic rollback-journal mode for SQLite connections."""
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("PRAGMA journal_mode=DELETE;")
    finally:
        cursor.close()


if DATABASE_URL.startswith("sqlite"):
    event.listen(engine, "connect", _configure_sqlite_connection)


# -------------------------------------------------------------------
# Base class for models
# -------------------------------------------------------------------

class Base(DeclarativeBase):
    """Declarative base for ORM models."""
    pass


# -------------------------------------------------------------------
# Session factory
# -------------------------------------------------------------------

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


# -------------------------------------------------------------------
# FastAPI dependency
# -------------------------------------------------------------------

def get_db() -> Generator:
    """FastAPI dependency that yields a SQLAlchemy session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
