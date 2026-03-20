"""
Asset-related dependency providers: repositories and asset use-cases.
Single-responsibility: this module only exposes asset-related DI providers.
"""
from fastapi import Depends
from sqlalchemy.orm import Session

from app.application.use_cases.asset.create_asset import CreateAssetUseCase
from app.application.use_cases.asset.get_asset import GetAssetUseCase
from app.application.use_cases.asset.get_all_assets import GetAllAssetsUseCase
from app.application.use_cases.asset.update_asset import UpdateAssetUseCase
from app.application.use_cases.asset.delete_asset import DeleteAssetUseCase
from app.application.use_cases.asset.dispose_asset import DisposeAssetUseCase
from app.application.use_cases.asset.get_assets_by_portfolio import GetAssetsByPortfolioUseCase
from app.domain.ports.repository import IAssetRepository, IAssetTypeRepository, IPortfolioRepository
from app.adapters.incoming.api.dependencies.db_session import get_db_session
from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_repository import SQLAlchemyAssetRepository
from app.adapters.outgoing.persistence.repository.sqlalchemy_asset_type_repository import SQLAlchemyAssetTypeRepository
from app.adapters.outgoing.persistence.repository.sqlalchemy_portfolio_repository import SQLAlchemyPortfolioRepository


def _get_portfolio_repository(db: Session = Depends(get_db_session)) -> IPortfolioRepository:
    """Portfolio repository using the assets module's DB session."""
    return SQLAlchemyPortfolioRepository(db)


# Repository providers for assets
def get_asset_repository(db: Session = Depends(get_db_session)) -> IAssetRepository:
    return SQLAlchemyAssetRepository(db)


def get_asset_type_repository(db: Session = Depends(get_db_session)) -> IAssetTypeRepository:
    return SQLAlchemyAssetTypeRepository(db)


# Asset use case providers
def get_all_assets_use_case(
    asset_repository: IAssetRepository = Depends(get_asset_repository),
) -> GetAllAssetsUseCase:
    return GetAllAssetsUseCase(asset_repository)


def get_asset_use_case(
    asset_repository: IAssetRepository = Depends(get_asset_repository),
) -> GetAssetUseCase:
    return GetAssetUseCase(asset_repository)


def create_asset_use_case(
    asset_repo: IAssetRepository = Depends(get_asset_repository),
    asset_type_repo: IAssetTypeRepository = Depends(get_asset_type_repository),
    portfolio_repo: IPortfolioRepository = Depends(_get_portfolio_repository),
) -> CreateAssetUseCase:
    return CreateAssetUseCase(asset_repo, portfolio_repo, asset_type_repo)


def update_asset_use_case(
    asset_repository: IAssetRepository = Depends(get_asset_repository),
) -> UpdateAssetUseCase:
    return UpdateAssetUseCase(asset_repository)


def delete_asset_use_case(
    asset_repository: IAssetRepository = Depends(get_asset_repository),
) -> DeleteAssetUseCase:
    return DeleteAssetUseCase(asset_repository)


def dispose_asset_use_case(
    asset_repository: IAssetRepository = Depends(get_asset_repository),
) -> DisposeAssetUseCase:
    return DisposeAssetUseCase(asset_repository)


def get_assets_by_portfolio_use_case(
    asset_repo: IAssetRepository = Depends(get_asset_repository),
    portfolio_repo: IPortfolioRepository = Depends(_get_portfolio_repository),
) -> GetAssetsByPortfolioUseCase:
    return GetAssetsByPortfolioUseCase(asset_repo, portfolio_repo)


__all__ = [
    'get_asset_repository',
    'get_asset_type_repository',
    'get_all_assets_use_case',
    'get_asset_use_case',
    'create_asset_use_case',
    'update_asset_use_case',
    'delete_asset_use_case',
    'dispose_asset_use_case',
    'get_assets_by_portfolio_use_case',
]
