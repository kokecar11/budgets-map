from fastapi import HTTPException, status
from src.account.repository import AccountRepository
from src.account.schemas import AccountCreate, AccountUpdate
from src.account.models import AccountModel


class AccountService:

    def __init__(self, repository: AccountRepository):
        self.repository = repository

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[AccountModel]:
        return await self.repository.get_all(skip=skip, limit=limit)

    async def get_by_user(self, user_id: str) -> list[AccountModel]:
        return await self.repository.get_by_user(user_id)

    async def get_or_404(self, id: str) -> AccountModel:
        obj = await self.repository.get_by_id(id)
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        return obj

    async def create(self, data: AccountCreate) -> AccountModel:
        return await self.repository.create(data)

    async def update(self, id: str, data: AccountUpdate) -> AccountModel:
        obj = await self.get_or_404(id)
        return await self.repository.update(obj, data)

    async def delete(self, id: str) -> None:
        obj = await self.get_or_404(id)
        await self.repository.delete(obj)
