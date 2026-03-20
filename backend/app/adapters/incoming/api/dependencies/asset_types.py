"""Asset-type dependency providers."""
from fastapi import Depends

from app.application.use_cases.asset_type.get_all_asset_types import GetAllAssetTypesUseCase
from app.application.use_cases.asset_type.get_asset_type import GetAssetTypeUseCase
from app.adapters.incoming.api.dependencies.assets import get_asset_type_repository
from app.domain.ports.repository import IAssetTypeRepository


def get_all_asset_types_use_case(
    repo: IAssetTypeRepository = Depends(get_asset_type_repository),
) -> GetAllAssetTypesUseCase:
    return GetAllAssetTypesUseCase(repo)


def get_asset_type_use_case(
    repo: IAssetTypeRepository = Depends(get_asset_type_repository),
) -> GetAssetTypeUseCase:
    return GetAssetTypeUseCase(repo)


__all__ = [
    'get_all_asset_types_use_case',
    'get_asset_type_use_case',
]
