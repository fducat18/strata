"""Tag dependency providers."""
from fastapi import Depends
from sqlalchemy.orm import Session

from app.application.use_cases.tag.create_tag import CreateTagUseCase
from app.application.use_cases.tag.get_all_tags import GetAllTagsUseCase
from app.application.use_cases.tag.get_tag import GetTagUseCase
from app.application.use_cases.tag.delete_tag import DeleteTagUseCase
from app.application.use_cases.tag.add_tag_to_asset import AddTagToAssetUseCase
from app.application.use_cases.tag.remove_tag_from_asset import RemoveTagFromAssetUseCase
from app.adapters.incoming.api.dependencies.assets import get_asset_repository
from app.adapters.incoming.api.dependencies.db_session import get_db_session
from app.domain.ports.repository import IAssetRepository, ITagRepository
from app.adapters.outgoing.persistence.repository.sqlalchemy_tag_repository import SQLAlchemyTagRepository


def get_tag_repository(db: Session = Depends(get_db_session)) -> ITagRepository:
    return SQLAlchemyTagRepository(db)


def create_tag_use_case(
    repo: ITagRepository = Depends(get_tag_repository),
) -> CreateTagUseCase:
    return CreateTagUseCase(repo)


def get_all_tags_use_case(
    repo: ITagRepository = Depends(get_tag_repository),
) -> GetAllTagsUseCase:
    return GetAllTagsUseCase(repo)


def get_tag_use_case(
    repo: ITagRepository = Depends(get_tag_repository),
) -> GetTagUseCase:
    return GetTagUseCase(repo)


def delete_tag_use_case(
    repo: ITagRepository = Depends(get_tag_repository),
) -> DeleteTagUseCase:
    return DeleteTagUseCase(repo)


def add_tag_to_asset_use_case(
    asset_repo: IAssetRepository = Depends(get_asset_repository),
    tag_repo: ITagRepository = Depends(get_tag_repository),
) -> AddTagToAssetUseCase:
    return AddTagToAssetUseCase(asset_repo, tag_repo)


def remove_tag_from_asset_use_case(
    asset_repo: IAssetRepository = Depends(get_asset_repository),
    tag_repo: ITagRepository = Depends(get_tag_repository),
) -> RemoveTagFromAssetUseCase:
    return RemoveTagFromAssetUseCase(asset_repo, tag_repo)


__all__ = [
    'get_tag_repository',
    'create_tag_use_case',
    'get_all_tags_use_case',
    'get_tag_use_case',
    'delete_tag_use_case',
    'add_tag_to_asset_use_case',
    'remove_tag_from_asset_use_case',
]
