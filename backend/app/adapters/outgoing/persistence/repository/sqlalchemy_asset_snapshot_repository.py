"""
SQLAlchemy AssetSnapshot Repository Implementation
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session

from app.domain.entities.asset_snapshot import AssetSnapshot
from app.domain.ports.repository.asset_snapshot_repository import IAssetSnapshotRepository
from app.adapters.outgoing.persistence.models import AssetSnapshotModel
from app.adapters.outgoing.persistence.mappers.persistence_mapper import PersistenceMapper


class SQLAlchemyAssetSnapshotRepository(IAssetSnapshotRepository):
    """SQLAlchemy implementation of AssetSnapshotRepository."""

    def __init__(self, session: Session):
        self._session = session

    def save(self, entity: AssetSnapshot) -> AssetSnapshot:
        orm_obj = self._session.get(AssetSnapshotModel, str(entity.id))
        if orm_obj:
            orm_obj.value = entity.value
            orm_obj.observed_at = entity.observed_at
        else:
            orm_obj = PersistenceMapper.asset_snapshot_to_orm(entity)
            self._session.add(orm_obj)
        self._session.flush()
        return entity

    def find_by_id(self, entity_id: str) -> Optional[AssetSnapshot]:
        entity_id = str(entity_id)
        orm_obj = self._session.query(AssetSnapshotModel).filter(
            AssetSnapshotModel.id == entity_id
        ).first()
        return PersistenceMapper.asset_snapshot_to_domain(orm_obj) if orm_obj else None

    def find_all(self) -> List[AssetSnapshot]:
        return [
            PersistenceMapper.asset_snapshot_to_domain(s)
            for s in self._session.query(AssetSnapshotModel).all()
        ]

    def delete(self, entity_id: str) -> bool:
        entity_id = str(entity_id)
        orm_obj = self._session.query(AssetSnapshotModel).filter(
            AssetSnapshotModel.id == entity_id
        ).first()
        if orm_obj:
            self._session.delete(orm_obj)
            self._session.flush()
            return True
        return False

    def exists(self, entity_id: str) -> bool:
        entity_id = str(entity_id)
        return self._session.query(
            self._session.query(AssetSnapshotModel).filter(
                AssetSnapshotModel.id == entity_id
            ).exists()
        ).scalar()

    def get_snapshots(
        self,
        asset_id: UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[AssetSnapshot]:
        query = self._session.query(AssetSnapshotModel).filter(
            AssetSnapshotModel.asset_id == str(asset_id)
        )
        if start_date:
            query = query.filter(AssetSnapshotModel.observed_at >= start_date)
        if end_date:
            query = query.filter(AssetSnapshotModel.observed_at <= end_date)

        rows = query.order_by(AssetSnapshotModel.observed_at.asc()).all()
        return [PersistenceMapper.asset_snapshot_to_domain(s) for s in rows]

    def get_latest_snapshot(self, asset_id: UUID) -> Optional[AssetSnapshot]:
        from app.adapters.outgoing.persistence.models.asset_snapshot import AssetSnapshotModel as ASM
        orm_obj = self._session.query(ASM).filter(
            ASM.asset_id == str(asset_id)
        ).order_by(ASM.observed_at.desc()).first()
        return PersistenceMapper.asset_snapshot_to_domain(orm_obj) if orm_obj else None
