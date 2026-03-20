"""
SQLAlchemy Portfolio Repository Implementation
"""
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session, joinedload, subqueryload

from app.domain.entities.portfolio import Portfolio
from app.domain.entities.portfolio_snapshot import PortfolioSnapshot
from app.domain.ports.repository.portfolio_repository import IPortfolioRepository
from app.adapters.outgoing.persistence.models import PortfolioModel
from app.adapters.outgoing.persistence.models.asset import AssetModel
from app.adapters.outgoing.persistence.models.asset_type import AssetTypeModel
from app.adapters.outgoing.persistence.models.category import CategoryModel
from app.adapters.outgoing.persistence.models.portfolio_snapshot import PortfolioSnapshotModel
from app.adapters.outgoing.persistence.mappers.persistence_mapper import PersistenceMapper


class SQLAlchemyPortfolioRepository(IPortfolioRepository):
    """SQLAlchemy implementation of PortfolioRepository."""

    def __init__(self, session: Session):
        self._session = session

    def save(self, entity: Portfolio) -> Portfolio:
        orm_obj = self._session.get(PortfolioModel, str(entity.id))
        if orm_obj:
            orm_obj.name = entity.name
            orm_obj.base_currency = entity.base_currency
            orm_obj.updated_at = entity.updated_at
        else:
            orm_obj = PersistenceMapper.portfolio_to_orm(entity)
            self._session.add(orm_obj)
        self._session.flush()
        return entity

    def find_by_id(self, entity_id: str) -> Optional[Portfolio]:
        entity_id = str(entity_id)
        orm_obj = self._session.query(PortfolioModel).filter(
            PortfolioModel.id == entity_id
        ).first()
        return PersistenceMapper.portfolio_to_domain(orm_obj) if orm_obj else None

    def find_all(self) -> List[Portfolio]:
        rows = self._session.query(PortfolioModel).options(
            joinedload(PortfolioModel.assets).joinedload(AssetModel.asset_type),
            joinedload(PortfolioModel.assets).subqueryload(AssetModel.snapshots),
        ).all()
        return [PersistenceMapper.portfolio_to_domain(r, load_assets=True) for r in rows]

    def delete(self, entity_id: str) -> bool:
        entity_id = str(entity_id)
        orm_obj = self._session.query(PortfolioModel).filter(
            PortfolioModel.id == entity_id
        ).first()
        if orm_obj:
            self._session.delete(orm_obj)
            self._session.flush()
            return True
        return False

    def exists(self, entity_id: str) -> bool:
        entity_id = str(entity_id)
        return self._session.query(
            self._session.query(PortfolioModel).filter(
                PortfolioModel.id == entity_id
            ).exists()
        ).scalar()

    def find_by_name(self, name: str) -> Optional[Portfolio]:
        orm_obj = self._session.query(PortfolioModel).filter(
            PortfolioModel.name == name
        ).first()
        return PersistenceMapper.portfolio_to_domain(orm_obj) if orm_obj else None

    def find_with_assets(self, portfolio_id: str) -> Optional[Portfolio]:
        portfolio_id = str(portfolio_id)
        orm_obj = self._session.query(PortfolioModel).options(
            joinedload(PortfolioModel.assets).joinedload(AssetModel.asset_type),
            joinedload(PortfolioModel.assets).subqueryload(AssetModel.snapshots),
            joinedload(PortfolioModel.assets).subqueryload(AssetModel.tags),
            joinedload(PortfolioModel.assets).subqueryload(AssetModel.categories).joinedload(CategoryModel.parent),
        ).filter(PortfolioModel.id == portfolio_id).first()
        return PersistenceMapper.portfolio_to_domain(orm_obj, load_assets=True) if orm_obj else None

    def find_with_snapshots(
        self,
        portfolio_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Optional[Portfolio]:
        portfolio_id = str(portfolio_id)
        orm_obj = self._session.query(PortfolioModel).filter(
            PortfolioModel.id == portfolio_id
        ).first()
        if not orm_obj:
            return None

        snapshot_query = self._session.query(PortfolioSnapshotModel).filter(
            PortfolioSnapshotModel.portfolio_id == portfolio_id
        )
        if start_date:
            snapshot_query = snapshot_query.filter(PortfolioSnapshotModel.observed_at >= start_date)
        if end_date:
            snapshot_query = snapshot_query.filter(PortfolioSnapshotModel.observed_at <= end_date)

        portfolio = PersistenceMapper.portfolio_to_domain(orm_obj)
        portfolio.snapshots = [
            PersistenceMapper.portfolio_snapshot_to_domain(s)
            for s in snapshot_query.order_by(PortfolioSnapshotModel.observed_at.desc()).all()
        ]
        return portfolio

    def save_snapshot(self, snapshot: PortfolioSnapshot) -> None:
        orm_obj = PersistenceMapper.portfolio_snapshot_to_orm(snapshot)
        self._session.add(orm_obj)
        self._session.flush()

    def count_assets(self, portfolio_id: str) -> int:
        portfolio_id = str(portfolio_id)
        return self._session.query(AssetModel).filter(
            AssetModel.portfolio_id == portfolio_id
        ).count()
