from src.financial_rules.repository import FinancialRulesRepository
from src.financial_rules.schemas import FinancialRulesUpdate
from src.financial_rules.models import FinancialRulesModel


class FinancialRulesService:

    def __init__(self, repository: FinancialRulesRepository):
        self.repository = repository

    async def get_or_create(self, user_id: str) -> FinancialRulesModel:
        obj = await self.repository.get_by_user(user_id)
        if obj is None:
            obj = await self.repository.create(user_id)
        return obj

    async def update(self, user_id: str, data: FinancialRulesUpdate) -> FinancialRulesModel:
        obj = await self.get_or_create(user_id)
        return await self.repository.update(obj, data)
