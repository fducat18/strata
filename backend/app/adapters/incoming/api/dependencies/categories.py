"""Category dependency providers."""
from fastapi import Depends
from sqlalchemy.orm import Session

from app.application.use_cases.category.create_category import CreateCategoryUseCase
from app.application.use_cases.category.get_all_categories import GetAllCategoriesUseCase
from app.application.use_cases.category.get_category import GetCategoryUseCase
from app.application.use_cases.category.delete_category import DeleteCategoryUseCase
from app.application.use_cases.category.add_asset_to_category import AddAssetToCategoryUseCase
from app.application.use_cases.category.remove_asset_from_category import RemoveAssetFromCategoryUseCase
from app.adapters.incoming.api.dependencies.assets import get_asset_repository
from app.adapters.incoming.api.dependencies.db_session import get_db_session
from app.domain.ports.repository import IAssetRepository, ICategoryRepository
from app.adapters.outgoing.persistence.repository.sqlalchemy_category_repository import SQLAlchemyCategoryRepository


def get_category_repository(db: Session = Depends(get_db_session)) -> ICategoryRepository:
    return SQLAlchemyCategoryRepository(db)


def create_category_use_case(
    repo: ICategoryRepository = Depends(get_category_repository),
) -> CreateCategoryUseCase:
    return CreateCategoryUseCase(repo)


def get_all_categories_use_case(
    repo: ICategoryRepository = Depends(get_category_repository),
) -> GetAllCategoriesUseCase:
    return GetAllCategoriesUseCase(repo)


def get_category_use_case(
    repo: ICategoryRepository = Depends(get_category_repository),
) -> GetCategoryUseCase:
    return GetCategoryUseCase(repo)


def delete_category_use_case(
    repo: ICategoryRepository = Depends(get_category_repository),
) -> DeleteCategoryUseCase:
    return DeleteCategoryUseCase(repo)


def add_asset_to_category_use_case(
    asset_repo: IAssetRepository = Depends(get_asset_repository),
    category_repo: ICategoryRepository = Depends(get_category_repository),
) -> AddAssetToCategoryUseCase:
    return AddAssetToCategoryUseCase(asset_repo, category_repo)


def remove_asset_from_category_use_case(
    asset_repo: IAssetRepository = Depends(get_asset_repository),
    category_repo: ICategoryRepository = Depends(get_category_repository),
) -> RemoveAssetFromCategoryUseCase:
    return RemoveAssetFromCategoryUseCase(asset_repo, category_repo)


__all__ = [
    'get_category_repository',
    'create_category_use_case',
    'get_all_categories_use_case',
    'get_category_use_case',
    'delete_category_use_case',
    'add_asset_to_category_use_case',
    'remove_asset_from_category_use_case',
]
