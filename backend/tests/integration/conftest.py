"""
Integration test configuration.

Provides a shared in-memory SQLite database for integration tests.
The production database (strata.db) is never touched.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.adapters.outgoing.persistence.database import Base

# Import all models so they're registered with Base before create_all
import app.adapters.outgoing.persistence.models  # noqa: F401

from app.adapters.incoming.api.dependencies.db_session import get_db_session

from app.main import app as fastapi_app


@pytest.fixture(scope="function")
def integration_engine():
    """Create an isolated in-memory SQLite engine for each test."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture(scope="function")
def integration_session_factory(integration_engine):
    """Session factory that mirrors production transaction settings."""
    return sessionmaker(
        bind=integration_engine,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
        class_=Session,
    )


@pytest.fixture(scope="function")
def integration_session(integration_session_factory):
    """Provide a direct session for repository-style seeding in tests."""
    session = integration_session_factory()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture(scope="function")
def integration_client(integration_session_factory):
    """TestClient with fresh per-request DB sessions against the in-memory DB."""
    def override_get_db():
        session = integration_session_factory()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    fastapi_app.dependency_overrides[get_db_session] = override_get_db
    client = TestClient(fastapi_app)
    yield client
    fastapi_app.dependency_overrides.clear()


@pytest.fixture
def seeded_asset_type(integration_session):
    """Seed a minimal asset type for tests."""
    from app.adapters.outgoing.persistence.models.asset_type import AssetTypeModel
    from uuid import uuid4
    unique_code = f"TEST_{str(uuid4()).replace('-', '')[:8].upper()}"
    asset_type = AssetTypeModel(id=str(uuid4()), code=unique_code, label="Test Asset Type")
    integration_session.add(asset_type)
    integration_session.commit()
    return asset_type


@pytest.fixture
def seeded_portfolio(integration_client, integration_session):
    """Create a portfolio via the API."""
    resp = integration_client.post("/api/v1/portfolios/", json={"name": "Test Portfolio"})
    assert resp.status_code == 201
    return resp.json()
