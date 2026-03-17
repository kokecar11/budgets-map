from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from src.budget.models import BudgetModel, BudgetItemModel
from src.budget.schemas import BudgetCreate, BudgetUpdate, BudgetItemCreate, BudgetItemUpdate


class BudgetRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, id: str) -> Optional[BudgetModel]:
        result = await self.db.execute(
            select(BudgetModel).where(BudgetModel.id == id)
        )
        return result.scalars().first()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[BudgetModel]:
        result = await self.db.execute(
            select(BudgetModel).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def get_by_user(self, user_id: str) -> List[BudgetModel]:
        result = await self.db.execute(
            select(BudgetModel).where(BudgetModel.user_id == user_id)
        )
        return result.scalars().all()

    async def create(self, data: BudgetCreate) -> BudgetModel:
        obj = BudgetModel(**data.model_dump())
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: BudgetModel, data: BudgetUpdate) -> BudgetModel:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: BudgetModel) -> None:
        await self.db.delete(obj)
        await self.db.flush()


class BudgetItemRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, id: str) -> Optional[BudgetItemModel]:
        result = await self.db.execute(
            select(BudgetItemModel).where(BudgetItemModel.id == id)
        )
        return result.scalars().first()

    async def get_by_budget(self, budget_id: str) -> List[BudgetItemModel]:
        result = await self.db.execute(
            select(BudgetItemModel).where(BudgetItemModel.budget_id == budget_id)
        )
        return result.scalars().all()

    async def create(self, data: BudgetItemCreate) -> BudgetItemModel:
        obj = BudgetItemModel(**data.model_dump())
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: BudgetItemModel, data: BudgetItemUpdate) -> BudgetItemModel:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: BudgetItemModel) -> None:
        await self.db.delete(obj)
        await self.db.flush()
