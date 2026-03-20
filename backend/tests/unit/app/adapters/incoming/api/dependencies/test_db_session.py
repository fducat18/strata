from unittest.mock import MagicMock

import pytest

from app.adapters.incoming.api.dependencies import db_session as db_session_deps


def test_db_session_module_exports():
    assert hasattr(db_session_deps, 'get_db_session')


def test_get_db_session_commits_and_closes(monkeypatch):
    session = MagicMock()
    monkeypatch.setattr(db_session_deps, "SessionLocal", lambda: session)

    generator = db_session_deps.get_db_session()

    assert next(generator) is session

    with pytest.raises(StopIteration):
        next(generator)

    session.commit.assert_called_once_with()
    session.rollback.assert_not_called()
    session.close.assert_called_once_with()


def test_get_db_session_rolls_back_on_error(monkeypatch):
    session = MagicMock()
    monkeypatch.setattr(db_session_deps, "SessionLocal", lambda: session)

    generator = db_session_deps.get_db_session()
    assert next(generator) is session

    with pytest.raises(RuntimeError):
        generator.throw(RuntimeError("boom"))

    session.commit.assert_not_called()
    session.rollback.assert_called_once_with()
    session.close.assert_called_once_with()
