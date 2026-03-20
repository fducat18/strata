"""Comprehensive integration tests to cover all SQLAlchemy repository methods and routes."""
from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4
import pytest


# ---------------------------------------------------------------------------
# Portfolio routes and repository coverage
# ---------------------------------------------------------------------------

def test_get_all_portfolios(integration_client, seeded_portfolio):
    resp = integration_client.get("/api/v1/portfolios/")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert any(portfolio["id"] == seeded_portfolio["id"] for portfolio in data)


def test_delete_portfolio_success(integration_client, seeded_portfolio):
    portfolio_id = seeded_portfolio["id"]
    resp = integration_client.delete(f"/api/v1/portfolios/{portfolio_id}")
    assert resp.status_code == 204


def test_delete_portfolio_not_found(integration_client):
    resp = integration_client.delete(f"/api/v1/portfolios/{uuid4()}")
    assert resp.status_code == 404


def test_take_and_get_portfolio_snapshots(integration_client, seeded_portfolio):
    portfolio_id = seeded_portfolio["id"]

    # Take a snapshot
    resp = integration_client.post(f"/api/v1/portfolios/{portfolio_id}/snapshots")
    assert resp.status_code == 201
    snap = resp.json()
    assert snap["portfolio_id"] == portfolio_id

    # Get snapshots
    resp = integration_client.get(f"/api/v1/portfolios/{portfolio_id}/snapshots")
    assert resp.status_code == 200
    assert any(snapshot["id"] == snap["id"] for snapshot in resp.json())


def test_get_portfolio_snapshots_not_found(integration_client):
    resp = integration_client.get(f"/api/v1/portfolios/{uuid4()}/snapshots")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Asset routes and repository coverage
# ---------------------------------------------------------------------------

def test_get_all_assets(integration_client, seeded_asset_type, seeded_portfolio):
    portfolio_id = seeded_portfolio["id"]
    asset_type_id = str(seeded_asset_type.id)

    # Create an asset first
    create_resp = integration_client.post("/api/v1/assets/", json={
        "portfolio_id": portfolio_id,
        "asset_type_id": asset_type_id,
        "name": "Asset for get_all",
        "created_by": "user"
    })
    assert create_resp.status_code == 201
    asset_id = create_resp.json()["id"]

    resp = integration_client.get("/api/v1/assets/")
    assert resp.status_code == 200
    assert any(asset["id"] == asset_id for asset in resp.json())


def test_get_assets_by_portfolio(integration_client, seeded_asset_type, seeded_portfolio):
    portfolio_id = seeded_portfolio["id"]
    asset_type_id = str(seeded_asset_type.id)

    create_resp = integration_client.post("/api/v1/assets/", json={
        "portfolio_id": portfolio_id,
        "asset_type_id": asset_type_id,
        "name": "Portfolio Asset",
        "created_by": "user"
    })
    assert create_resp.status_code == 201
    asset_id = create_resp.json()["id"]

    resp = integration_client.get(f"/api/v1/assets/?portfolio_id={portfolio_id}")
    assert resp.status_code == 200
    assert any(asset["id"] == asset_id for asset in resp.json())


def test_get_assets_by_portfolio_not_found(integration_client):
    resp = integration_client.get(f"/api/v1/assets/?portfolio_id={uuid4()}")
    assert resp.status_code == 404


def test_delete_asset_success(integration_client, seeded_asset_type, seeded_portfolio):
    portfolio_id = seeded_portfolio["id"]
    asset_type_id = str(seeded_asset_type.id)

    resp = integration_client.post("/api/v1/assets/", json={
        "portfolio_id": portfolio_id,
        "asset_type_id": asset_type_id,
        "name": "To Delete",
        "created_by": "user"
    })
    asset_id = resp.json()["id"]

    resp = integration_client.delete(f"/api/v1/assets/{asset_id}")
    assert resp.status_code == 204


def test_delete_asset_not_found(integration_client):
    resp = integration_client.delete(f"/api/v1/assets/{uuid4()}")
    assert resp.status_code == 404


def test_get_asset_snapshots_via_route(integration_client, seeded_asset_type, seeded_portfolio):
    portfolio_id = seeded_portfolio["id"]
    asset_type_id = str(seeded_asset_type.id)

    asset_resp = integration_client.post("/api/v1/assets/", json={
        "portfolio_id": portfolio_id,
        "asset_type_id": asset_type_id,
        "name": "Snapshot Asset",
        "created_by": "user",
    })
    assert asset_resp.status_code == 201
    asset_id = asset_resp.json()["id"]

    snapshot_resp = integration_client.post(f"/api/v1/assets/{asset_id}/snapshots", json={
        "value": "123.45",
    })
    assert snapshot_resp.status_code == 201
    snapshot_id = snapshot_resp.json()["id"]

    resp = integration_client.get(f"/api/v1/assets/{asset_id}/snapshots")
    assert resp.status_code == 200
    assert any(snapshot["id"] == snapshot_id for snapshot in resp.json())


# ---------------------------------------------------------------------------
# Tag routes and repository coverage
# ---------------------------------------------------------------------------

def test_get_all_tags(integration_client):
    tag_name = f"tag-{uuid4()}"
    create_resp = integration_client.post("/api/v1/tags/", json={"name": tag_name})
    assert create_resp.status_code == 201
    tag_id = create_resp.json()["id"]
    resp = integration_client.get("/api/v1/tags/")
    assert resp.status_code == 200
    assert any(tag["id"] == tag_id and tag["name"] == tag_name for tag in resp.json())


def test_get_tag_by_id(integration_client):
    tag_name = f"tag-{str(uuid4())[:8]}"
    create_resp = integration_client.post("/api/v1/tags/", json={"name": tag_name})
    tag_id = create_resp.json()["id"]

    resp = integration_client.get(f"/api/v1/tags/{tag_id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == tag_name


def test_delete_tag_success(integration_client):
    tag_name = f"del-tag-{str(uuid4())[:8]}"
    create_resp = integration_client.post("/api/v1/tags/", json={"name": tag_name})
    tag_id = create_resp.json()["id"]

    resp = integration_client.delete(f"/api/v1/tags/{tag_id}")
    assert resp.status_code == 204


def test_delete_tag_not_found(integration_client):
    resp = integration_client.delete(f"/api/v1/tags/{uuid4()}")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Category routes and repository coverage
# ---------------------------------------------------------------------------

def test_get_all_categories(integration_client):
    category_name = f"cat-{str(uuid4())[:8]}"
    create_resp = integration_client.post("/api/v1/categories/", json={"name": category_name})
    assert create_resp.status_code == 201
    category_id = create_resp.json()["id"]
    resp = integration_client.get("/api/v1/categories/")
    assert resp.status_code == 200
    assert any(category["id"] == category_id and category["name"] == category_name for category in resp.json())


def test_get_category_by_id(integration_client):
    cat_name = f"cat-{str(uuid4())[:8]}"
    create_resp = integration_client.post("/api/v1/categories/", json={"name": cat_name})
    cat_id = create_resp.json()["id"]

    resp = integration_client.get(f"/api/v1/categories/{cat_id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == cat_name


def test_assign_asset_to_category(integration_client, seeded_asset_type, seeded_portfolio):
    portfolio_id = seeded_portfolio["id"]
    asset_type_id = str(seeded_asset_type.id)

    asset_resp = integration_client.post("/api/v1/assets/", json={
        "portfolio_id": portfolio_id,
        "asset_type_id": asset_type_id,
        "name": "Cat Asset",
        "created_by": "user"
    })
    asset_id = asset_resp.json()["id"]

    cat_name = f"assign-cat-{str(uuid4())[:8]}"
    cat_resp = integration_client.post("/api/v1/categories/", json={"name": cat_name})
    cat_id = cat_resp.json()["id"]

    resp = integration_client.post(
        f"/api/v1/categories/{cat_id}/assets",
        json={"asset_id": asset_id}
    )
    assert resp.status_code == 200


def test_assign_asset_to_category_asset_not_found(integration_client):
    cat_name = f"cat-{str(uuid4())[:8]}"
    cat_resp = integration_client.post("/api/v1/categories/", json={"name": cat_name})
    cat_id = cat_resp.json()["id"]

    resp = integration_client.post(
        f"/api/v1/categories/{cat_id}/assets",
        json={"asset_id": str(uuid4())}
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Asset type routes coverage
# ---------------------------------------------------------------------------

def test_get_asset_type_by_id(integration_client, seeded_asset_type):
    asset_type_id = str(seeded_asset_type.id)
    resp = integration_client.get(f"/api/v1/asset-types/{asset_type_id}")
    assert resp.status_code == 200


def test_get_all_asset_types(integration_client, seeded_asset_type):
    resp = integration_client.get("/api/v1/asset-types/")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# ---------------------------------------------------------------------------
# Direct SQLAlchemy repository tests (not covered via HTTP)
# ---------------------------------------------------------------------------

@pytest.fixture
def repo_session(integration_session):
    return integration_session


@pytest.fixture
def seeded_data(repo_session):
    """Seed all needed records for repo tests."""
    from app.adapters.outgoing.persistence.models.portfolio import PortfolioModel
    from app.adapters.outgoing.persistence.models.asset import AssetModel
    from app.adapters.outgoing.persistence.models.asset_type import AssetTypeModel
    from app.adapters.outgoing.persistence.models.tag import TagModel
    from app.adapters.outgoing.persistence.models.category import CategoryModel
    from app.adapters.outgoing.persistence.models.asset_snapshot import AssetSnapshotModel
    now = datetime.now(timezone.utc)

    portfolio = PortfolioModel(
        id=str(uuid4()), name=f"TestPortfolio-{str(uuid4())[:8]}",
        base_currency="EUR", created_at=now, updated_at=now
    )
    repo_session.add(portfolio)

    asset_type = AssetTypeModel(id=str(uuid4()), code=f"T{str(uuid4())[:4]}", label="Test")
    repo_session.add(asset_type)

    asset = AssetModel(
        id=str(uuid4()), name="TestAsset", portfolio_id=portfolio.id,
        asset_type_id=asset_type.id, disposed=False,
        created_at=now, updated_at=now, created_by="u", updated_by="u"
    )
    repo_session.add(asset)

    tag = TagModel(id=str(uuid4()), name=f"tag-{str(uuid4())[:8]}")
    repo_session.add(tag)

    category = CategoryModel(id=str(uuid4()), name=f"cat-{str(uuid4())[:8]}")
    repo_session.add(category)

    snapshot = AssetSnapshotModel(
        id=str(uuid4()), asset_id=asset.id,
        value=Decimal("100.0"), observed_at=now
    )
    repo_session.add(snapshot)

    repo_session.flush()
    return {
        "portfolio": portfolio,
        "asset_type": asset_type,
        "asset": asset,
        "tag": tag,
        "category": category,
        "snapshot": snapshot,
    }


class TestPortfolioRepository:
    def test_find_all(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_repository import SQLAlchemyPortfolioRepository
        repo = SQLAlchemyPortfolioRepository(repo_session)
        result = repo.find_all()
        assert len(result) >= 1

    def test_delete_success(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_repository import SQLAlchemyPortfolioRepository
        from app.adapters.outgoing.persistence.models.portfolio import PortfolioModel
        now = datetime.now(timezone.utc)
        p = PortfolioModel(id=str(uuid4()), name=f"del-{str(uuid4())[:8]}", base_currency="EUR", created_at=now, updated_at=now)
        repo_session.add(p)
        repo_session.flush()

        repo = SQLAlchemyPortfolioRepository(repo_session)
        assert repo.delete(p.id) is True

    def test_delete_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_repository import SQLAlchemyPortfolioRepository
        repo = SQLAlchemyPortfolioRepository(repo_session)
        assert repo.delete(str(uuid4())) is False

    def test_exists_true(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_repository import SQLAlchemyPortfolioRepository
        repo = SQLAlchemyPortfolioRepository(repo_session)
        assert repo.exists(seeded_data["portfolio"].id) is True

    def test_exists_false(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_repository import SQLAlchemyPortfolioRepository
        repo = SQLAlchemyPortfolioRepository(repo_session)
        assert repo.exists(str(uuid4())) is False

    def test_find_by_name(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_repository import SQLAlchemyPortfolioRepository
        repo = SQLAlchemyPortfolioRepository(repo_session)
        name = seeded_data["portfolio"].name
        result = repo.find_by_name(name)
        assert result is not None

    def test_find_by_name_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_repository import SQLAlchemyPortfolioRepository
        repo = SQLAlchemyPortfolioRepository(repo_session)
        assert repo.find_by_name("nonexistent-portfolio") is None

    def test_find_with_assets_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_repository import SQLAlchemyPortfolioRepository
        repo = SQLAlchemyPortfolioRepository(repo_session)
        assert repo.find_with_assets(str(uuid4())) is None

    def test_find_with_snapshots(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_repository import SQLAlchemyPortfolioRepository
        from app.adapters.outgoing.persistence.models.portfolio_snapshot import PortfolioSnapshotModel
        now = datetime.now(timezone.utc)
        ps = PortfolioSnapshotModel(
            id=str(uuid4()), portfolio_id=seeded_data["portfolio"].id,
            value=Decimal("500.0"), observed_at=now
        )
        repo_session.add(ps)
        repo_session.flush()

        repo = SQLAlchemyPortfolioRepository(repo_session)
        result = repo.find_with_snapshots(seeded_data["portfolio"].id)
        assert result is not None
        assert len(result.snapshots) >= 1

    def test_find_with_snapshots_with_dates(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_repository import SQLAlchemyPortfolioRepository
        from app.adapters.outgoing.persistence.models.portfolio_snapshot import PortfolioSnapshotModel
        now = datetime.now(timezone.utc)
        ps = PortfolioSnapshotModel(
            id=str(uuid4()), portfolio_id=seeded_data["portfolio"].id,
            value=Decimal("200.0"), observed_at=now
        )
        repo_session.add(ps)
        repo_session.flush()

        repo = SQLAlchemyPortfolioRepository(repo_session)
        from datetime import timedelta
        start = now - timedelta(hours=1)
        end = now + timedelta(hours=1)
        result = repo.find_with_snapshots(seeded_data["portfolio"].id, start_date=start, end_date=end)
        assert result is not None

    def test_find_with_snapshots_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_repository import SQLAlchemyPortfolioRepository
        repo = SQLAlchemyPortfolioRepository(repo_session)
        assert repo.find_with_snapshots(str(uuid4())) is None

    def test_save_snapshot(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_repository import SQLAlchemyPortfolioRepository
        from app.domain.entities.portfolio_snapshot import PortfolioSnapshot
        repo = SQLAlchemyPortfolioRepository(repo_session)
        snap = PortfolioSnapshot(
            id=uuid4(), portfolio_id=uuid4(),
            value=Decimal("300.0"), observed_at=datetime.now(timezone.utc)
        )
        repo.save_snapshot(snap)

    def test_count_assets(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_repository import SQLAlchemyPortfolioRepository
        repo = SQLAlchemyPortfolioRepository(repo_session)
        count = repo.count_assets(seeded_data["portfolio"].id)
        assert count >= 1

    def test_save_update_existing(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_repository import SQLAlchemyPortfolioRepository
        from app.domain.entities.portfolio import Portfolio
        now = datetime.now(timezone.utc)
        p_id = uuid4()
        # First save
        portfolio = Portfolio(id=p_id, name="Original", base_currency="EUR", created_at=now, updated_at=now)
        repo = SQLAlchemyPortfolioRepository(repo_session)
        repo.save(portfolio)
        # Update
        portfolio.name = "Updated"
        repo.save(portfolio)


class TestAssetRepository:
    def test_find_all(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        repo = SQLAlchemyAssetRepository(repo_session)
        result = repo.find_all()
        assert len(result) >= 1

    def test_delete_success(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        from app.adapters.outgoing.persistence.models.asset import AssetModel
        now = datetime.now(timezone.utc)
        a = AssetModel(
            id=str(uuid4()), name="del-asset",
            portfolio_id=seeded_data["portfolio"].id,
            asset_type_id=seeded_data["asset_type"].id,
            created_at=now, updated_at=now, created_by="u", updated_by="u"
        )
        repo_session.add(a)
        repo_session.flush()

        repo = SQLAlchemyAssetRepository(repo_session)
        assert repo.delete(a.id) is True

    def test_delete_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        repo = SQLAlchemyAssetRepository(repo_session)
        assert repo.delete(str(uuid4())) is False

    def test_exists_true(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        repo = SQLAlchemyAssetRepository(repo_session)
        assert repo.exists(seeded_data["asset"].id) is True

    def test_exists_false(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        repo = SQLAlchemyAssetRepository(repo_session)
        assert repo.exists(str(uuid4())) is False

    def test_find_by_type(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        repo = SQLAlchemyAssetRepository(repo_session)
        code = seeded_data["asset_type"].code
        result = repo.find_by_type(code)
        assert len(result) >= 1

    def test_find_by_category(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        from app.adapters.outgoing.persistence.models.category import CategoryModel
        # Assign category to asset
        cat = seeded_data["category"]
        asset = seeded_data["asset"]
        asset.categories.append(cat)
        repo_session.flush()

        repo = SQLAlchemyAssetRepository(repo_session)
        result = repo.find_by_category(cat.id)
        assert len(result) >= 1

    def test_find_by_tag(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        tag = seeded_data["tag"]
        asset = seeded_data["asset"]
        asset.tags.append(tag)
        repo_session.flush()

        repo = SQLAlchemyAssetRepository(repo_session)
        result = repo.find_by_tag(tag.id)
        assert len(result) >= 1

    def test_find_active(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        repo = SQLAlchemyAssetRepository(repo_session)
        result = repo.find_active(seeded_data["portfolio"].id)
        assert len(result) >= 1

    def test_find_disposed(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        asset = seeded_data["asset"]
        asset.disposed = True
        repo_session.flush()

        repo = SQLAlchemyAssetRepository(repo_session)
        result = repo.find_disposed(seeded_data["portfolio"].id)
        assert len(result) >= 1

    def test_find_with_snapshots(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        repo = SQLAlchemyAssetRepository(repo_session)
        result = repo.find_with_snapshots(seeded_data["asset"].id)
        assert result is not None

    def test_find_with_snapshots_with_dates(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        from datetime import timedelta
        now = datetime.now(timezone.utc)
        start = now - timedelta(hours=1)
        end = now + timedelta(hours=1)
        repo = SQLAlchemyAssetRepository(repo_session)
        result = repo.find_with_snapshots(seeded_data["asset"].id, start_date=start, end_date=end)
        assert result is not None

    def test_find_with_snapshots_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        repo = SQLAlchemyAssetRepository(repo_session)
        assert repo.find_with_snapshots(str(uuid4())) is None

    def test_add_category_and_remove(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        repo = SQLAlchemyAssetRepository(repo_session)
        asset_id = seeded_data["asset"].id
        cat_id = seeded_data["category"].id
        assert repo.add_category(asset_id, cat_id) is True
        assert repo.remove_category(asset_id, cat_id) is True

    def test_add_category_already_assigned(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        repo = SQLAlchemyAssetRepository(repo_session)
        asset_id = seeded_data["asset"].id
        cat_id = seeded_data["category"].id
        repo.add_category(asset_id, cat_id)
        # Add again - should return True (already assigned)
        assert repo.add_category(asset_id, cat_id) is True

    def test_add_category_asset_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        repo = SQLAlchemyAssetRepository(repo_session)
        assert repo.add_category(str(uuid4()), str(uuid4())) is False

    def test_add_category_cat_not_found(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        repo = SQLAlchemyAssetRepository(repo_session)
        assert repo.add_category(seeded_data["asset"].id, str(uuid4())) is False

    def test_remove_category_not_found(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        repo = SQLAlchemyAssetRepository(repo_session)
        # Category not assigned
        assert repo.remove_category(seeded_data["asset"].id, str(uuid4())) is False

    def test_remove_category_asset_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        repo = SQLAlchemyAssetRepository(repo_session)
        assert repo.remove_category(str(uuid4()), str(uuid4())) is False

    def test_add_tag_and_remove(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        repo = SQLAlchemyAssetRepository(repo_session)
        asset_id = seeded_data["asset"].id
        tag_id = seeded_data["tag"].id
        assert repo.add_tag(asset_id, tag_id) is True
        assert repo.remove_tag(asset_id, tag_id) is True

    def test_add_tag_already_assigned(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        repo = SQLAlchemyAssetRepository(repo_session)
        asset_id = seeded_data["asset"].id
        tag_id = seeded_data["tag"].id
        repo.add_tag(asset_id, tag_id)
        # Add again
        assert repo.add_tag(asset_id, tag_id) is True

    def test_add_tag_asset_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        repo = SQLAlchemyAssetRepository(repo_session)
        assert repo.add_tag(str(uuid4()), str(uuid4())) is False

    def test_add_tag_tag_not_found(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        repo = SQLAlchemyAssetRepository(repo_session)
        assert repo.add_tag(seeded_data["asset"].id, str(uuid4())) is False

    def test_remove_tag_not_found(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        repo = SQLAlchemyAssetRepository(repo_session)
        assert repo.remove_tag(seeded_data["asset"].id, str(uuid4())) is False

    def test_remove_tag_asset_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        repo = SQLAlchemyAssetRepository(repo_session)
        assert repo.remove_tag(str(uuid4()), str(uuid4())) is False

    def test_save_update_existing(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
        from app.domain.entities.asset import Asset
        from app.domain.entities.portfolio import Portfolio
        from app.domain.entities.asset_type import AssetType
        now = datetime.now(timezone.utc)
        pid = uuid4()
        portfolio = Portfolio(id=pid, name="P2", base_currency="EUR", created_at=now, updated_at=now)
        # Add portfolio to DB
        from app.adapters.outgoing.persistence.models.portfolio import PortfolioModel
        pm = PortfolioModel(id=str(pid), name="P2", base_currency="EUR", created_at=now, updated_at=now)
        repo_session.add(pm)
        repo_session.flush()

        at_id = uuid4()
        from app.adapters.outgoing.persistence.models.asset_type import AssetTypeModel
        atm = AssetTypeModel(id=str(at_id), code=f"Z{str(uuid4())[:4]}", label="Z")
        repo_session.add(atm)
        repo_session.flush()

        asset_type = AssetType(id=at_id, code=atm.code, label=atm.label)
        aid = uuid4()
        asset = Asset(
            id=aid, name="Upd", portfolio=portfolio, asset_type=asset_type,
            created_at=now, updated_at=now, created_by="u", updated_by="u"
        )
        repo = SQLAlchemyAssetRepository(repo_session)
        repo.save(asset)
        # Update path
        asset.name = "Updated"
        repo.save(asset)


class TestTagRepository:
    def test_find_all(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_tag_repository import SQLAlchemyTagRepository
        repo = SQLAlchemyTagRepository(repo_session)
        result = repo.find_all()
        assert len(result) >= 1

    def test_delete_success(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_tag_repository import SQLAlchemyTagRepository
        from app.adapters.outgoing.persistence.models.tag import TagModel
        t = TagModel(id=str(uuid4()), name=f"del-{str(uuid4())[:8]}")
        repo_session.add(t)
        repo_session.flush()

        repo = SQLAlchemyTagRepository(repo_session)
        assert repo.delete(t.id) is True

    def test_delete_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_tag_repository import SQLAlchemyTagRepository
        repo = SQLAlchemyTagRepository(repo_session)
        assert repo.delete(str(uuid4())) is False

    def test_exists_true(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_tag_repository import SQLAlchemyTagRepository
        repo = SQLAlchemyTagRepository(repo_session)
        assert repo.exists(seeded_data["tag"].id) is True

    def test_exists_false(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_tag_repository import SQLAlchemyTagRepository
        repo = SQLAlchemyTagRepository(repo_session)
        assert repo.exists(str(uuid4())) is False

    def test_find_by_name(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_tag_repository import SQLAlchemyTagRepository
        repo = SQLAlchemyTagRepository(repo_session)
        result = repo.find_by_name(seeded_data["tag"].name)
        assert result is not None

    def test_find_by_name_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_tag_repository import SQLAlchemyTagRepository
        repo = SQLAlchemyTagRepository(repo_session)
        assert repo.find_by_name("nonexistent-tag") is None

    def test_find_by_asset(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_tag_repository import SQLAlchemyTagRepository
        tag = seeded_data["tag"]
        asset = seeded_data["asset"]
        asset.tags.append(tag)
        repo_session.flush()

        repo = SQLAlchemyTagRepository(repo_session)
        result = repo.find_by_asset(asset.id)
        assert len(result) >= 1

    def test_find_by_asset_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_tag_repository import SQLAlchemyTagRepository
        repo = SQLAlchemyTagRepository(repo_session)
        result = repo.find_by_asset(str(uuid4()))
        assert result == []

    def test_attach_and_detach_from_asset(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_tag_repository import SQLAlchemyTagRepository
        repo = SQLAlchemyTagRepository(repo_session)
        asset_id = seeded_data["asset"].id
        tag_id = seeded_data["tag"].id
        assert repo.attach_to_asset(asset_id, tag_id) is True
        assert repo.detach_from_asset(asset_id, tag_id) is True

    def test_attach_already_attached(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_tag_repository import SQLAlchemyTagRepository
        repo = SQLAlchemyTagRepository(repo_session)
        asset_id = seeded_data["asset"].id
        tag_id = seeded_data["tag"].id
        repo.attach_to_asset(asset_id, tag_id)
        # attach again - already attached returns False
        assert repo.attach_to_asset(asset_id, tag_id) is False

    def test_attach_asset_or_tag_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_tag_repository import SQLAlchemyTagRepository
        repo = SQLAlchemyTagRepository(repo_session)
        assert repo.attach_to_asset(str(uuid4()), str(uuid4())) is False

    def test_detach_not_attached(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_tag_repository import SQLAlchemyTagRepository
        repo = SQLAlchemyTagRepository(repo_session)
        assert repo.detach_from_asset(seeded_data["asset"].id, str(uuid4())) is False

    def test_save_update_existing(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_tag_repository import SQLAlchemyTagRepository
        from app.domain.entities.tag import Tag
        tag_id = uuid4()
        from app.adapters.outgoing.persistence.models.tag import TagModel
        tm = TagModel(id=str(tag_id), name=f"update-me-{str(uuid4())[:8]}")
        repo_session.add(tm)
        repo_session.flush()

        repo = SQLAlchemyTagRepository(repo_session)
        tag = Tag(id=tag_id, name="updated-tag-name")
        repo.save(tag)


class TestCategoryRepository:
    def test_find_all(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_category_repository import SQLAlchemyCategoryRepository
        repo = SQLAlchemyCategoryRepository(repo_session)
        result = repo.find_all()
        assert len(result) >= 1

    def test_delete_success(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_category_repository import SQLAlchemyCategoryRepository
        from app.adapters.outgoing.persistence.models.category import CategoryModel
        c = CategoryModel(id=str(uuid4()), name=f"del-{str(uuid4())[:8]}")
        repo_session.add(c)
        repo_session.flush()

        repo = SQLAlchemyCategoryRepository(repo_session)
        assert repo.delete(c.id) is True

    def test_delete_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_category_repository import SQLAlchemyCategoryRepository
        repo = SQLAlchemyCategoryRepository(repo_session)
        assert repo.delete(str(uuid4())) is False

    def test_exists_true(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_category_repository import SQLAlchemyCategoryRepository
        repo = SQLAlchemyCategoryRepository(repo_session)
        assert repo.exists(seeded_data["category"].id) is True

    def test_exists_false(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_category_repository import SQLAlchemyCategoryRepository
        repo = SQLAlchemyCategoryRepository(repo_session)
        assert repo.exists(str(uuid4())) is False

    def test_find_by_name(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_category_repository import SQLAlchemyCategoryRepository
        repo = SQLAlchemyCategoryRepository(repo_session)
        result = repo.find_by_name(seeded_data["category"].name)
        assert result is not None

    def test_find_by_name_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_category_repository import SQLAlchemyCategoryRepository
        repo = SQLAlchemyCategoryRepository(repo_session)
        assert repo.find_by_name("nonexistent-category") is None

    def test_find_root_categories(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_category_repository import SQLAlchemyCategoryRepository
        repo = SQLAlchemyCategoryRepository(repo_session)
        result = repo.find_root_categories()
        assert len(result) >= 1

    def test_find_children(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_category_repository import SQLAlchemyCategoryRepository
        from app.adapters.outgoing.persistence.models.category import CategoryModel
        parent = seeded_data["category"]
        child = CategoryModel(id=str(uuid4()), name=f"child-{str(uuid4())[:8]}", parent_id=parent.id)
        repo_session.add(child)
        repo_session.flush()

        repo = SQLAlchemyCategoryRepository(repo_session)
        result = repo.find_children(parent.id)
        assert len(result) >= 1

    def test_count_assets(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_category_repository import SQLAlchemyCategoryRepository
        cat = seeded_data["category"]
        asset = seeded_data["asset"]
        asset.categories.append(cat)
        repo_session.flush()

        repo = SQLAlchemyCategoryRepository(repo_session)
        count = repo.count_assets(cat.id)
        assert count >= 1

    def test_attach_and_detach_from_asset(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_category_repository import SQLAlchemyCategoryRepository
        repo = SQLAlchemyCategoryRepository(repo_session)
        asset_id = seeded_data["asset"].id
        cat_id = seeded_data["category"].id
        assert repo.attach_to_asset(asset_id, cat_id) is True
        assert repo.detach_from_asset(asset_id, cat_id) is True

    def test_attach_already_attached(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_category_repository import SQLAlchemyCategoryRepository
        repo = SQLAlchemyCategoryRepository(repo_session)
        asset_id = seeded_data["asset"].id
        cat_id = seeded_data["category"].id
        repo.attach_to_asset(asset_id, cat_id)
        assert repo.attach_to_asset(asset_id, cat_id) is False

    def test_attach_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_category_repository import SQLAlchemyCategoryRepository
        repo = SQLAlchemyCategoryRepository(repo_session)
        assert repo.attach_to_asset(str(uuid4()), str(uuid4())) is False

    def test_detach_not_attached(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_category_repository import SQLAlchemyCategoryRepository
        repo = SQLAlchemyCategoryRepository(repo_session)
        assert repo.detach_from_asset(seeded_data["asset"].id, str(uuid4())) is False

    def test_save_update_existing(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_category_repository import SQLAlchemyCategoryRepository
        from app.domain.entities.category import Category
        from app.adapters.outgoing.persistence.models.category import CategoryModel
        cat_id = uuid4()
        cm = CategoryModel(id=str(cat_id), name=f"upd-cat-{str(uuid4())[:8]}")
        repo_session.add(cm)
        repo_session.flush()

        repo = SQLAlchemyCategoryRepository(repo_session)
        cat = Category(id=cat_id, name="updated-cat")
        repo.save(cat)

    def test_find_by_asset(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_category_repository import SQLAlchemyCategoryRepository
        cat = seeded_data["category"]
        asset = seeded_data["asset"]
        asset.categories.append(cat)
        repo_session.flush()

        repo = SQLAlchemyCategoryRepository(repo_session)
        result = repo.find_by_asset(asset.id)
        assert len(result) >= 1

    def test_find_by_asset_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_category_repository import SQLAlchemyCategoryRepository
        repo = SQLAlchemyCategoryRepository(repo_session)
        result = repo.find_by_asset(str(uuid4()))
        assert result == []
    def test_save_update_existing(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_snapshot_repository import SQLAlchemyAssetSnapshotRepository
        from app.domain.entities.asset_snapshot import AssetSnapshot
        snap_id = uuid4()
        from app.adapters.outgoing.persistence.models.asset_snapshot import AssetSnapshotModel
        now = datetime.now(timezone.utc)
        sm = AssetSnapshotModel(
            id=str(snap_id), asset_id=seeded_data["asset"].id,
            value=Decimal("100.0"), observed_at=now
        )
        repo_session.add(sm)
        repo_session.flush()

        repo = SQLAlchemyAssetSnapshotRepository(repo_session)
        snap = AssetSnapshot(id=snap_id, asset_id=uuid4(), value=Decimal("200.0"), observed_at=now)
        repo.save(snap)

    def test_delete_success(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_snapshot_repository import SQLAlchemyAssetSnapshotRepository
        snap_id = seeded_data["snapshot"].id
        repo = SQLAlchemyAssetSnapshotRepository(repo_session)
        assert repo.delete(snap_id) is True

    def test_delete_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_snapshot_repository import SQLAlchemyAssetSnapshotRepository
        repo = SQLAlchemyAssetSnapshotRepository(repo_session)
        assert repo.delete(str(uuid4())) is False

    def test_exists_true(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_snapshot_repository import SQLAlchemyAssetSnapshotRepository
        repo = SQLAlchemyAssetSnapshotRepository(repo_session)
        assert repo.exists(seeded_data["snapshot"].id) is True

    def test_exists_false(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_snapshot_repository import SQLAlchemyAssetSnapshotRepository
        repo = SQLAlchemyAssetSnapshotRepository(repo_session)
        assert repo.exists(str(uuid4())) is False

    def test_get_snapshots(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_snapshot_repository import SQLAlchemyAssetSnapshotRepository
        repo = SQLAlchemyAssetSnapshotRepository(repo_session)
        result = repo.get_snapshots(seeded_data["asset"].id)
        assert len(result) >= 1

    def test_get_latest_snapshot(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_snapshot_repository import SQLAlchemyAssetSnapshotRepository
        repo = SQLAlchemyAssetSnapshotRepository(repo_session)
        result = repo.get_latest_snapshot(seeded_data["asset"].id)
        assert result is not None

    def test_get_latest_snapshot_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_snapshot_repository import SQLAlchemyAssetSnapshotRepository
        repo = SQLAlchemyAssetSnapshotRepository(repo_session)
        result = repo.get_latest_snapshot(str(uuid4()))
        assert result is None

    def test_find_by_id_success(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_snapshot_repository import SQLAlchemyAssetSnapshotRepository
        repo = SQLAlchemyAssetSnapshotRepository(repo_session)
        snap_id = seeded_data["snapshot"].id
        result = repo.find_by_id(snap_id)
        assert result is not None

    def test_find_by_id_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_snapshot_repository import SQLAlchemyAssetSnapshotRepository
        repo = SQLAlchemyAssetSnapshotRepository(repo_session)
        assert repo.find_by_id(str(uuid4())) is None


class TestAssetTypeRepository:
    def test_save_update_existing(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_type_repository import SQLAlchemyAssetTypeRepository
        from app.domain.entities.asset_type import AssetType
        at_id = uuid4()
        from app.adapters.outgoing.persistence.models.asset_type import AssetTypeModel
        atm = AssetTypeModel(id=str(at_id), code=f"U{str(uuid4())[:4]}", label="Update")
        repo_session.add(atm)
        repo_session.flush()

        repo = SQLAlchemyAssetTypeRepository(repo_session)
        at = AssetType(id=at_id, code="UPDATED", label="Updated")
        repo.save(at)

    def test_delete_success(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_type_repository import SQLAlchemyAssetTypeRepository
        from app.adapters.outgoing.persistence.models.asset_type import AssetTypeModel
        at = AssetTypeModel(id=str(uuid4()), code=f"D{str(uuid4())[:4]}", label="Del")
        repo_session.add(at)
        repo_session.flush()

        repo = SQLAlchemyAssetTypeRepository(repo_session)
        assert repo.delete(at.id) is True

    def test_delete_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_type_repository import SQLAlchemyAssetTypeRepository
        repo = SQLAlchemyAssetTypeRepository(repo_session)
        assert repo.delete(str(uuid4())) is False

    def test_exists_true(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_type_repository import SQLAlchemyAssetTypeRepository
        repo = SQLAlchemyAssetTypeRepository(repo_session)
        assert repo.exists(seeded_data["asset_type"].id) is True

    def test_exists_false(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_type_repository import SQLAlchemyAssetTypeRepository
        repo = SQLAlchemyAssetTypeRepository(repo_session)
        assert repo.exists(str(uuid4())) is False

    def test_find_by_code(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_type_repository import SQLAlchemyAssetTypeRepository
        repo = SQLAlchemyAssetTypeRepository(repo_session)
        result = repo.find_by_code(seeded_data["asset_type"].code)
        assert result is not None

    def test_find_by_code_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_type_repository import SQLAlchemyAssetTypeRepository
        repo = SQLAlchemyAssetTypeRepository(repo_session)
        assert repo.find_by_code("NONEXISTENT") is None

    def test_find_all_codes(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_type_repository import SQLAlchemyAssetTypeRepository
        repo = SQLAlchemyAssetTypeRepository(repo_session)
        codes = repo.find_all_codes()
        assert len(codes) >= 1

    def test_save_new_asset_type(self, repo_session):
        """Covers the else (create new) branch in save."""
        from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_type_repository import SQLAlchemyAssetTypeRepository
        from app.domain.entities.asset_type import AssetType
        repo = SQLAlchemyAssetTypeRepository(repo_session)
        new_id = uuid4()
        at = AssetType(id=new_id, code=f"N{str(uuid4())[:4]}", label="New")
        repo.save(at)
        # Verify it was saved
        found = repo.find_by_id(str(new_id))
        assert found is not None


class TestPortfolioSnapshotRepository:
    def test_save_and_find(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_snapshot_repository import SQLAlchemyPortfolioSnapshotRepository
        from app.domain.entities.portfolio_snapshot import PortfolioSnapshot
        snap_id = uuid4()
        portfolio_id = uuid4()
        from app.adapters.outgoing.persistence.models.portfolio import PortfolioModel
        now = datetime.now(timezone.utc)
        pm = PortfolioModel(id=str(portfolio_id), name=f"ps-{str(uuid4())[:8]}", base_currency="EUR", created_at=now, updated_at=now)
        repo_session.add(pm)
        repo_session.flush()

        repo = SQLAlchemyPortfolioSnapshotRepository(repo_session)
        snap = PortfolioSnapshot(id=snap_id, portfolio_id=portfolio_id, value=Decimal("100"), observed_at=now)
        repo.save(snap)

        result = repo.find_by_id(str(snap_id))
        assert result is not None

    def test_save_update_existing(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_snapshot_repository import SQLAlchemyPortfolioSnapshotRepository
        from app.domain.entities.portfolio_snapshot import PortfolioSnapshot
        from app.adapters.outgoing.persistence.models.portfolio_snapshot import PortfolioSnapshotModel
        snap_id = uuid4()
        now = datetime.now(timezone.utc)
        sm = PortfolioSnapshotModel(
            id=str(snap_id), portfolio_id=seeded_data["portfolio"].id,
            value=Decimal("100"), observed_at=now
        )
        repo_session.add(sm)
        repo_session.flush()

        repo = SQLAlchemyPortfolioSnapshotRepository(repo_session)
        snap = PortfolioSnapshot(id=snap_id, portfolio_id=uuid4(), value=Decimal("200"), observed_at=now)
        repo.save(snap)

    def test_find_all(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_snapshot_repository import SQLAlchemyPortfolioSnapshotRepository
        repo = SQLAlchemyPortfolioSnapshotRepository(repo_session)
        # Save a snapshot first
        from app.adapters.outgoing.persistence.models.portfolio_snapshot import PortfolioSnapshotModel
        now = datetime.now(timezone.utc)
        sm = PortfolioSnapshotModel(
            id=str(uuid4()), portfolio_id=seeded_data["portfolio"].id,
            value=Decimal("100"), observed_at=now
        )
        repo_session.add(sm)
        repo_session.flush()
        result = repo.find_all()
        assert len(result) >= 1

    def test_delete_success(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_snapshot_repository import SQLAlchemyPortfolioSnapshotRepository
        from app.adapters.outgoing.persistence.models.portfolio_snapshot import PortfolioSnapshotModel
        now = datetime.now(timezone.utc)
        sm = PortfolioSnapshotModel(
            id=str(uuid4()), portfolio_id=seeded_data["portfolio"].id,
            value=Decimal("100"), observed_at=now
        )
        repo_session.add(sm)
        repo_session.flush()

        repo = SQLAlchemyPortfolioSnapshotRepository(repo_session)
        assert repo.delete(sm.id) is True

    def test_delete_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_snapshot_repository import SQLAlchemyPortfolioSnapshotRepository
        repo = SQLAlchemyPortfolioSnapshotRepository(repo_session)
        assert repo.delete(str(uuid4())) is False

    def test_exists_true(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_snapshot_repository import SQLAlchemyPortfolioSnapshotRepository
        from app.adapters.outgoing.persistence.models.portfolio_snapshot import PortfolioSnapshotModel
        now = datetime.now(timezone.utc)
        sm = PortfolioSnapshotModel(
            id=str(uuid4()), portfolio_id=seeded_data["portfolio"].id,
            value=Decimal("100"), observed_at=now
        )
        repo_session.add(sm)
        repo_session.flush()

        repo = SQLAlchemyPortfolioSnapshotRepository(repo_session)
        assert repo.exists(sm.id) is True

    def test_exists_false(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_snapshot_repository import SQLAlchemyPortfolioSnapshotRepository
        repo = SQLAlchemyPortfolioSnapshotRepository(repo_session)
        assert repo.exists(str(uuid4())) is False

    def test_get_snapshots(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_snapshot_repository import SQLAlchemyPortfolioSnapshotRepository
        from app.adapters.outgoing.persistence.models.portfolio_snapshot import PortfolioSnapshotModel
        now = datetime.now(timezone.utc)
        sm = PortfolioSnapshotModel(
            id=str(uuid4()), portfolio_id=seeded_data["portfolio"].id,
            value=Decimal("100"), observed_at=now
        )
        repo_session.add(sm)
        repo_session.flush()

        repo = SQLAlchemyPortfolioSnapshotRepository(repo_session)
        result = repo.get_snapshots(seeded_data["portfolio"].id)
        assert len(result) >= 1

    def test_get_latest_snapshot(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_snapshot_repository import SQLAlchemyPortfolioSnapshotRepository
        from app.adapters.outgoing.persistence.models.portfolio_snapshot import PortfolioSnapshotModel

        older = PortfolioSnapshotModel(
            id=str(uuid4()),
            portfolio_id=seeded_data["portfolio"].id,
            value=Decimal("100"),
            observed_at=datetime(2024, 1, 1, tzinfo=timezone.utc),
        )
        newer = PortfolioSnapshotModel(
            id=str(uuid4()),
            portfolio_id=seeded_data["portfolio"].id,
            value=Decimal("200"),
            observed_at=datetime(2024, 1, 2, tzinfo=timezone.utc),
        )
        repo_session.add_all([older, newer])
        repo_session.flush()

        repo = SQLAlchemyPortfolioSnapshotRepository(repo_session)
        result = repo.get_latest_snapshot(seeded_data["portfolio"].id)
        assert result is not None
        assert str(result.id) == newer.id

    def test_get_latest_snapshot_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_snapshot_repository import SQLAlchemyPortfolioSnapshotRepository
        repo = SQLAlchemyPortfolioSnapshotRepository(repo_session)
        assert repo.get_latest_snapshot(str(uuid4())) is None

    def test_find_by_id_not_found(self, repo_session):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_snapshot_repository import SQLAlchemyPortfolioSnapshotRepository
        repo = SQLAlchemyPortfolioSnapshotRepository(repo_session)
        assert repo.find_by_id(str(uuid4())) is None


class TestTransactionRepository:
    def test_save_find_delete(self, repo_session, seeded_data):
        from app.adapters.outgoing.persistence.repository.sqlalchemy_transaction_repository import SQLAlchemyTransactionRepository
        from app.adapters.outgoing.persistence.models.transaction import TransactionModel
        now = datetime.now(timezone.utc)
        t = TransactionModel(
            id=str(uuid4()), asset_id=seeded_data["asset"].id,
            type="BUY", unit_price="100.0", quantity="1.0",
            currency="EUR", occurred_at=now
        )
        repo = SQLAlchemyTransactionRepository(repo_session)
        repo.save(t)

        found = repo.find_by_id(t.id)
        assert found is not None

        all_t = repo.find_all()
        assert len(all_t) >= 1

        assert repo.exists(t.id) is True
        assert repo.exists(str(uuid4())) is False

        by_asset = repo.find_by_asset(seeded_data["asset"].id)
        assert len(by_asset) >= 1

        from datetime import timedelta
        between = repo.find_between_dates(now - timedelta(hours=1), now + timedelta(hours=1))
        assert len(between) >= 1

        assert repo.delete(t.id) is True
        assert repo.delete(str(uuid4())) is False


# ---------------------------------------------------------------------------
# Targeted tests for remaining uncovered lines
# ---------------------------------------------------------------------------

def test_category_repo_save_update_path(integration_session):
    """Covers lines 22-23 in sqlalchemy_category_repository: the update (if orm_obj) branch."""
    from app.adapters.outgoing.persistence.repository.sqlalchemy_category_repository import SQLAlchemyCategoryRepository
    from app.domain.entities.category import Category
    from uuid import uuid4

    repo = SQLAlchemyCategoryRepository(integration_session)
    cat_id = uuid4()

    # First save: creates new (else branch, lines 24-26)
    cat = Category(id=cat_id, name="first-save")
    repo.save(cat)

    # Second save with same ID: updates existing (if branch, lines 22-23)
    cat_updated = Category(id=cat_id, name="second-save")
    repo.save(cat_updated)
    # Verify name was updated
    found = repo.find_by_id(str(cat_id))
    assert found.name == "second-save"


def test_category_repo_delete_not_found(integration_session):
    """Covers line 52 in sqlalchemy_category_repository: return False in delete."""
    from app.adapters.outgoing.persistence.repository.sqlalchemy_category_repository import SQLAlchemyCategoryRepository
    from uuid import uuid4
    repo = SQLAlchemyCategoryRepository(integration_session)
    result = repo.delete(str(uuid4()))
    assert result is False


def test_category_repo_exists(integration_session):
    """Covers lines 55-58 in sqlalchemy_category_repository: exists method."""
    from app.adapters.outgoing.persistence.repository.sqlalchemy_category_repository import SQLAlchemyCategoryRepository
    from app.domain.entities.category import Category
    from uuid import uuid4

    repo = SQLAlchemyCategoryRepository(integration_session)
    cat_id = uuid4()
    cat = Category(id=cat_id, name="exists-test")
    repo.save(cat)

    assert repo.exists(str(cat_id)) is True
    assert repo.exists(str(uuid4())) is False


def test_asset_snapshot_repo_find_all(integration_session):
    """Covers line 39 in sqlalchemy_asset_snapshot_repository: find_all."""
    from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_snapshot_repository import SQLAlchemyAssetSnapshotRepository
    repo = SQLAlchemyAssetSnapshotRepository(integration_session)
    result = repo.find_all()
    assert isinstance(result, list)
