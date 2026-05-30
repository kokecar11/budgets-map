from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.financial_rules.repository import FinancialRulesRepository
from src.financial_rules.services import FinancialRulesService


def get_financial_rules_service(db: Annotated[AsyncSession, Depends(get_db)]) -> FinancialRulesService:
    repository = FinancialRulesRepository(db)
    return FinancialRulesService(repository)
