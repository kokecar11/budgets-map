from fastapi import HTTPException, status
from src.category.repository import CategoryRepository
from src.category.schemas import CategoryCreate, CategoryUpdate
from src.category.models import CategoryModel


class CategoryService:

    def __init__(self, repository: CategoryRepository):
        self.repository = repository

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[CategoryModel]:
        return await self.repository.get_all(skip=skip, limit=limit)

    async def get_by_user(self, user_id: str) -> list[CategoryModel]:
        return await self.repository.get_by_user(user_id)

    async def get_or_404(self, id: str) -> CategoryModel:
        obj = await self.repository.get_by_id(id)
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        return obj

    async def create(self, data: CategoryCreate) -> CategoryModel:
        return await self.repository.create(data)

    async def update(self, id: str, data: CategoryUpdate) -> CategoryModel:
        obj = await self.get_or_404(id)
        return await self.repository.update(obj, data)

    async def delete(self, id: str) -> None:
        obj = await self.get_or_404(id)
        await self.repository.delete(obj)
