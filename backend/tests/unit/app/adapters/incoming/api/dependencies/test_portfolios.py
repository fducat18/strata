from unittest.mock import MagicMock

import pytest

from app.adapters.incoming.api.dependencies import portfolios as portfolios_deps


def test_portfolios_module_exports():
    expected = [
        'get_db_session',
        'get_portfolio_repository',
        'create_portfolio_use_case',
        'get_portfolio_use_case',
        'delete_portfolio_use_case',
        'get_all_portfolios_use_case',
    ]
    for name in expected:
        assert hasattr(portfolios_deps, name)


def test_get_portfolio_repository_returns_object():
    repo = portfolios_deps.get_portfolio_repository()
    assert repo is not None


def test_get_db_session_commits_and_closes(monkeypatch):
    session = MagicMock()
    monkeypatch.setattr(portfolios_deps, "SessionLocal", lambda: session)

    generator = portfolios_deps.get_db_session()

    assert next(generator) is session

    with pytest.raises(StopIteration):
        next(generator)

    session.commit.assert_called_once_with()
    session.rollback.assert_not_called()
    session.close.assert_called_once_with()


def test_get_db_session_rolls_back_on_error(monkeypatch):
    session = MagicMock()
    monkeypatch.setattr(portfolios_deps, "SessionLocal", lambda: session)

    generator = portfolios_deps.get_db_session()
    assert next(generator) is session

    with pytest.raises(RuntimeError):
        generator.throw(RuntimeError("boom"))

    session.commit.assert_not_called()
    session.rollback.assert_called_once_with()
    session.close.assert_called_once_with()
