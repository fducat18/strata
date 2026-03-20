from unittest.mock import MagicMock

import pytest

from app.adapters.incoming.api.dependencies import assets as assets_deps


def test_assets_module_exports():
    expected = [
        'get_db_session',
        'get_asset_repository',
        'get_asset_type_repository',
        'get_all_assets_use_case',
        'get_asset_use_case',
        'create_asset_use_case',
        'update_asset_use_case',
        'delete_asset_use_case',
    ]
    for name in expected:
        assert hasattr(assets_deps, name)


def test_get_asset_repository_returns_object():
    repo = assets_deps.get_asset_repository()
    assert repo is not None


def test_get_db_session_commits_and_closes(monkeypatch):
    session = MagicMock()
    monkeypatch.setattr(assets_deps, "SessionLocal", lambda: session)

    generator = assets_deps.get_db_session()

    assert next(generator) is session

    with pytest.raises(StopIteration):
        next(generator)

    session.commit.assert_called_once_with()
    session.rollback.assert_not_called()
    session.close.assert_called_once_with()


def test_get_db_session_rolls_back_on_error(monkeypatch):
    session = MagicMock()
    monkeypatch.setattr(assets_deps, "SessionLocal", lambda: session)

    generator = assets_deps.get_db_session()
    assert next(generator) is session

    with pytest.raises(RuntimeError):
        generator.throw(RuntimeError("boom"))

    session.commit.assert_not_called()
    session.rollback.assert_called_once_with()
    session.close.assert_called_once_with()
