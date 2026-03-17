from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.saving.repository import SavingGoalRepository
from src.saving.services import SavingGoalService


def get_saving_goal_service(db: Annotated[AsyncSession, Depends(get_db)]) -> SavingGoalService:
    saving_goal_repository = SavingGoalRepository(db)
    return SavingGoalService(saving_goal_repository)
