from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from src.category.models import CategoryModel
from src.category.schemas import CategoryCreate, CategoryUpdate


class CategoryRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, id: str) -> Optional[CategoryModel]:
        result = await self.db.execute(
            select(CategoryModel).where(CategoryModel.id == id)
        )
        return result.scalars().first()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[CategoryModel]:
        result = await self.db.execute(
            select(CategoryModel).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def get_by_user(self, user_id: str) -> List[CategoryModel]:
        result = await self.db.execute(
            select(CategoryModel).where(CategoryModel.user_id == user_id)
        )
        return result.scalars().all()

    async def create(self, data: CategoryCreate) -> CategoryModel:
        obj = CategoryModel(**data.model_dump())
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: CategoryModel, data: CategoryUpdate) -> CategoryModel:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: CategoryModel) -> None:
        await self.db.delete(obj)
        await self.db.flush()
