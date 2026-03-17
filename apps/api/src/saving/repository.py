from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional, List
from src.saving.models import SavingGoalModel
from src.saving.schemas import SavingGoalCreate, SavingGoalUpdate


class SavingGoalRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, id: str) -> Optional[SavingGoalModel]:
        result = await self.db.execute(
            select(SavingGoalModel)
            .options(selectinload(SavingGoalModel.contributions))
            .where(SavingGoalModel.id == id)
        )
        return result.scalars().first()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[SavingGoalModel]:
        result = await self.db.execute(
            select(SavingGoalModel)
            .options(selectinload(SavingGoalModel.contributions))
            .offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def get_by_user(self, user_id: str) -> List[SavingGoalModel]:
        result = await self.db.execute(
            select(SavingGoalModel)
            .options(selectinload(SavingGoalModel.contributions))
            .where(SavingGoalModel.user_id == user_id)
        )
        return result.scalars().all()

    async def create(self, data: SavingGoalCreate) -> SavingGoalModel:
        obj = SavingGoalModel(**data.model_dump())
        self.db.add(obj)
        await self.db.flush()
        return await self.get_by_id(obj.id)

    async def update(self, obj: SavingGoalModel, data: SavingGoalUpdate) -> SavingGoalModel:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        await self.db.flush()
        return await self.get_by_id(obj.id)

    async def delete(self, obj: SavingGoalModel) -> None:
        await self.db.delete(obj)
        await self.db.flush()
