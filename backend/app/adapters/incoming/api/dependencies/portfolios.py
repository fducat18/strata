"""
Portfolio-related dependency providers: repository and portfolio use-cases.
Single-responsibility: this module only exposes portfolio-related DI providers.
"""
from fastapi import Depends
from sqlalchemy.orm import Session

from app.application.use_cases.portfolio.create_portfolio import CreatePortfolioUseCase
from app.application.use_cases.portfolio.get_portfolio import GetPortfolioUseCase
from app.application.use_cases.portfolio.delete_portfolio import DeletePortfolioUseCase
from app.application.use_cases.portfolio.get_all_portfolios import GetAllPortfoliosUseCase
from app.application.use_cases.portfolio.take_portfolio_snapshot import TakePortfolioSnapshotUseCase
from app.application.use_cases.portfolio.get_portfolio_snapshots import GetPortfolioSnapshotsUseCase
from app.application.use_cases.portfolio.update_portfolio import UpdatePortfolioUseCase
from app.domain.ports.repository import IPortfolioRepository
from app.adapters.incoming.api.dependencies.db_session import get_db_session
from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_repository import SQLAlchemyPortfolioRepository


# Repository provider for portfolios
def get_portfolio_repository(db: Session = Depends(get_db_session)) -> IPortfolioRepository:
    return SQLAlchemyPortfolioRepository(db)


# Portfolio use case providers
def create_portfolio_use_case(
    portfolio_repository: IPortfolioRepository = Depends(get_portfolio_repository),
) -> CreatePortfolioUseCase:
    return CreatePortfolioUseCase(portfolio_repository)


def get_portfolio_use_case(
    portfolio_repository: IPortfolioRepository = Depends(get_portfolio_repository),
) -> GetPortfolioUseCase:
    return GetPortfolioUseCase(portfolio_repository)


def delete_portfolio_use_case(
    portfolio_repository: IPortfolioRepository = Depends(get_portfolio_repository),
) -> DeletePortfolioUseCase:
    return DeletePortfolioUseCase(portfolio_repository)


def get_all_portfolios_use_case(
    portfolio_repository: IPortfolioRepository = Depends(get_portfolio_repository),
) -> GetAllPortfoliosUseCase:
    return GetAllPortfoliosUseCase(portfolio_repository)


def take_portfolio_snapshot_use_case(
    portfolio_repository: IPortfolioRepository = Depends(get_portfolio_repository),
) -> TakePortfolioSnapshotUseCase:
    return TakePortfolioSnapshotUseCase(portfolio_repository)


def get_portfolio_snapshots_use_case(
    portfolio_repository: IPortfolioRepository = Depends(get_portfolio_repository),
) -> GetPortfolioSnapshotsUseCase:
    return GetPortfolioSnapshotsUseCase(portfolio_repository)


def update_portfolio_use_case(
    portfolio_repository: IPortfolioRepository = Depends(get_portfolio_repository),
) -> UpdatePortfolioUseCase:
    return UpdatePortfolioUseCase(portfolio_repository)


__all__ = [
    'get_portfolio_repository',
    'create_portfolio_use_case',
    'get_portfolio_use_case',
    'delete_portfolio_use_case',
    'get_all_portfolios_use_case',
    'take_portfolio_snapshot_use_case',
    'get_portfolio_snapshots_use_case',
    'update_portfolio_use_case',
]
