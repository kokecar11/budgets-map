from fastapi import HTTPException, status
from src.user.repository import UserRepository
from src.user.schemas import UserCreate, UserUpdate
from src.user.models import UserModel


class UserService:

    def __init__(self, repository: UserRepository):
        self.repository = repository

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[UserModel]:
        return await self.repository.get_all(skip=skip, limit=limit)

    async def get_or_404(self, id: str) -> UserModel:
        obj = await self.repository.get_by_id(id)
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return obj

    async def create(self, data: UserCreate) -> UserModel:
        existing = await self.repository.get_by_email(data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        return await self.repository.create(data)

    async def update(self, id: str, data: UserUpdate) -> UserModel:
        obj = await self.get_or_404(id)
        return await self.repository.update(obj, data)

    async def delete(self, id: str) -> None:
        obj = await self.get_or_404(id)
        await self.repository.delete(obj)
