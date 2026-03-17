from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.category.repository import CategoryRepository
from src.category.services import CategoryService


def get_category_service(db: Annotated[AsyncSession, Depends(get_db)]) -> CategoryService:
    category_repository = CategoryRepository(db)
    return CategoryService(category_repository)
