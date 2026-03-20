"""
SQLAlchemy PortfolioSnapshot Repository Implementation
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session

from app.domain.entities.portfolio_snapshot import PortfolioSnapshot
from app.domain.ports.repository.portfolio_snapshot_repository import IPortfolioSnapshotRepository
from app.adapters.outgoing.persistence.models import PortfolioSnapshotModel
from app.adapters.outgoing.persistence.mappers.persistence_mapper import PersistenceMapper


class SQLAlchemyPortfolioSnapshotRepository(IPortfolioSnapshotRepository):
    """SQLAlchemy implementation of PortfolioSnapshotRepository."""

    def __init__(self, session: Session):
        self._session = session

    def save(self, entity: PortfolioSnapshot) -> PortfolioSnapshot:
        orm_obj = self._session.get(PortfolioSnapshotModel, str(entity.id))
        if orm_obj:
            orm_obj.value = entity.value
            orm_obj.observed_at = entity.observed_at
        else:
            orm_obj = PersistenceMapper.portfolio_snapshot_to_orm(entity)
            self._session.add(orm_obj)
        self._session.flush()
        return entity

    def find_by_id(self, entity_id: str) -> Optional[PortfolioSnapshot]:
        entity_id = str(entity_id)
        orm_obj = self._session.query(PortfolioSnapshotModel).filter(
            PortfolioSnapshotModel.id == entity_id
        ).first()
        return PersistenceMapper.portfolio_snapshot_to_domain(orm_obj) if orm_obj else None

    def find_all(self) -> List[PortfolioSnapshot]:
        return [
            PersistenceMapper.portfolio_snapshot_to_domain(s)
            for s in self._session.query(PortfolioSnapshotModel).all()
        ]

    def delete(self, entity_id: str) -> bool:
        entity_id = str(entity_id)
        orm_obj = self._session.query(PortfolioSnapshotModel).filter(
            PortfolioSnapshotModel.id == entity_id
        ).first()
        if orm_obj:
            self._session.delete(orm_obj)
            self._session.flush()
            return True
        return False

    def exists(self, entity_id: str) -> bool:
        entity_id = str(entity_id)
        return self._session.query(
            self._session.query(PortfolioSnapshotModel).filter(
                PortfolioSnapshotModel.id == entity_id
            ).exists()
        ).scalar()

    def get_snapshots(
        self,
        portfolio_id: UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[PortfolioSnapshot]:
        query = self._session.query(PortfolioSnapshotModel).filter(
            PortfolioSnapshotModel.portfolio_id == str(portfolio_id)
        )
        if start_date:
            query = query.filter(PortfolioSnapshotModel.observed_at >= start_date)
        if end_date:
            query = query.filter(PortfolioSnapshotModel.observed_at <= end_date)

        rows = query.order_by(PortfolioSnapshotModel.observed_at.asc()).all()
        return [PersistenceMapper.portfolio_snapshot_to_domain(s) for s in rows]

    def get_latest_snapshot(self, portfolio_id: UUID) -> Optional[PortfolioSnapshot]:
        orm_obj = self._session.query(PortfolioSnapshotModel).filter(
            PortfolioSnapshotModel.portfolio_id == str(portfolio_id)
        ).order_by(PortfolioSnapshotModel.observed_at.desc()).first()
        return PersistenceMapper.portfolio_snapshot_to_domain(orm_obj) if orm_obj else None
