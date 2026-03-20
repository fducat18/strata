"""Shared database-session dependency provider for incoming API adapters."""
from typing import Generator

from sqlalchemy.orm import Session

from app.adapters.outgoing.persistence.database import SessionLocal


def get_db_session() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


__all__ = ['get_db_session']
