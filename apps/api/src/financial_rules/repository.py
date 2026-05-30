from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from src.financial_rules.models import FinancialRulesModel
from src.financial_rules.schemas import FinancialRulesUpdate


class FinancialRulesRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user(self, user_id: str) -> Optional[FinancialRulesModel]:
        result = await self.db.execute(
            select(FinancialRulesModel).where(FinancialRulesModel.user_id == user_id)
        )
        return result.scalars().first()

    async def create(self, user_id: str) -> FinancialRulesModel:
        obj = FinancialRulesModel(user_id=user_id)
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: FinancialRulesModel, data: FinancialRulesUpdate) -> FinancialRulesModel:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj
