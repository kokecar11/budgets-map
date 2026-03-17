from fastapi import HTTPException, status
from src.saving.repository import SavingGoalRepository
from src.saving.schemas import SavingGoalCreate, SavingGoalUpdate
from src.saving.models import SavingGoalModel


class SavingGoalService:

    def __init__(self, repository: SavingGoalRepository):
        self.repository = repository

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[SavingGoalModel]:
        return await self.repository.get_all(skip=skip, limit=limit)

    async def get_by_user(self, user_id: str) -> list[SavingGoalModel]:
        return await self.repository.get_by_user(user_id)

    async def get_or_404(self, id: str) -> SavingGoalModel:
        obj = await self.repository.get_by_id(id)
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saving goal not found"
            )
        return obj

    async def create(self, data: SavingGoalCreate) -> SavingGoalModel:
        return await self.repository.create(data)

    async def update(self, id: str, data: SavingGoalUpdate) -> SavingGoalModel:
        obj = await self.get_or_404(id)
        return await self.repository.update(obj, data)

    async def delete(self, id: str) -> None:
        obj = await self.get_or_404(id)
        await self.repository.delete(obj)
