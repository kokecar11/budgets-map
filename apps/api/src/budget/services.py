from fastapi import HTTPException, status
from src.budget.repository import BudgetRepository, BudgetItemRepository
from src.budget.schemas import BudgetCreate, BudgetUpdate, BudgetItemCreate, BudgetItemUpdate
from src.budget.models import BudgetModel, BudgetItemModel


class BudgetService:

    def __init__(self, repository: BudgetRepository):
        self.repository = repository

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[BudgetModel]:
        return await self.repository.get_all(skip=skip, limit=limit)

    async def get_by_user(self, user_id: str) -> list[BudgetModel]:
        return await self.repository.get_by_user(user_id)

    async def get_or_404(self, id: str) -> BudgetModel:
        obj = await self.repository.get_by_id(id)
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget not found"
            )
        return obj

    async def create(self, data: BudgetCreate) -> BudgetModel:
        return await self.repository.create(data)

    async def update(self, id: str, data: BudgetUpdate) -> BudgetModel:
        obj = await self.get_or_404(id)
        return await self.repository.update(obj, data)

    async def delete(self, id: str) -> None:
        obj = await self.get_or_404(id)
        await self.repository.delete(obj)


class BudgetItemService:

    def __init__(self, repository: BudgetItemRepository):
        self.repository = repository

    async def get_by_budget(self, budget_id: str) -> list[BudgetItemModel]:
        return await self.repository.get_by_budget(budget_id)

    async def get_or_404(self, id: str) -> BudgetItemModel:
        obj = await self.repository.get_by_id(id)
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget item not found"
            )
        return obj

    async def create(self, data: BudgetItemCreate) -> BudgetItemModel:
        return await self.repository.create(data)

    async def update(self, id: str, data: BudgetItemUpdate) -> BudgetItemModel:
        obj = await self.get_or_404(id)
        return await self.repository.update(obj, data)

    async def delete(self, id: str) -> None:
        obj = await self.get_or_404(id)
        await self.repository.delete(obj)
