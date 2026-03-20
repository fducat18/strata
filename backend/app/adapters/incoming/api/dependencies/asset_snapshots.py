"""Asset-snapshot dependency providers."""
from fastapi import Depends
from sqlalchemy.orm import Session

from app.application.use_cases.asset_snapshot.create_asset_snapshot import CreateAssetSnapshotUseCase
from app.application.use_cases.asset_snapshot.get_asset_snapshots import GetAssetSnapshotsUseCase
from app.adapters.incoming.api.dependencies.db_session import get_db_session
from app.adapters.incoming.api.dependencies.assets import get_asset_repository
from app.domain.ports.repository import IAssetRepository, IAssetSnapshotRepository
from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_snapshot_repository import SQLAlchemyAssetSnapshotRepository


def get_asset_snapshot_repository(db: Session = Depends(get_db_session)) -> IAssetSnapshotRepository:
    return SQLAlchemyAssetSnapshotRepository(db)


def create_asset_snapshot_use_case(
    snapshot_repo: IAssetSnapshotRepository = Depends(get_asset_snapshot_repository),
    asset_repo: IAssetRepository = Depends(get_asset_repository),
) -> CreateAssetSnapshotUseCase:
    return CreateAssetSnapshotUseCase(snapshot_repo, asset_repo)


def get_asset_snapshots_use_case(
    snapshot_repo: IAssetSnapshotRepository = Depends(get_asset_snapshot_repository),
    asset_repo: IAssetRepository = Depends(get_asset_repository),
) -> GetAssetSnapshotsUseCase:
    return GetAssetSnapshotsUseCase(snapshot_repo, asset_repo)


__all__ = [
    'get_asset_snapshot_repository',
    'create_asset_snapshot_use_case',
    'get_asset_snapshots_use_case',
]
