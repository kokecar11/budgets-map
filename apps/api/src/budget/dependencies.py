from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.budget.repository import BudgetRepository, BudgetItemRepository
from src.budget.services import BudgetService, BudgetItemService
from src.transaction.repository import TransactionRepository


def get_budget_service(db: Annotated[AsyncSession, Depends(get_db)]) -> BudgetService:
    budget_repository = BudgetRepository(db)
    return BudgetService(budget_repository)


def get_budget_item_service(db: Annotated[AsyncSession, Depends(get_db)]) -> BudgetItemService:
    budget_item_repository = BudgetItemRepository(db)
    return BudgetItemService(budget_item_repository)


def get_transaction_repository(db: Annotated[AsyncSession, Depends(get_db)]) -> TransactionRepository:
    return TransactionRepository(db)
