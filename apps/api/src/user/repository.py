from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from src.user.models import UserModel
from src.user.schemas import UserCreate, UserUpdate


class UserRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, id: str) -> Optional[UserModel]:
        result = await self.db.execute(
            select(UserModel).where(UserModel.id == id)
        )
        return result.scalars().first()

    async def get_by_email(self, email: str) -> Optional[UserModel]:
        result = await self.db.execute(
            select(UserModel).where(UserModel.email == email)
        )
        return result.scalars().first()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[UserModel]:
        result = await self.db.execute(
            select(UserModel).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def create(self, data: UserCreate) -> UserModel:
        obj = UserModel(**data.model_dump())
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: UserModel, data: UserUpdate) -> UserModel:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: UserModel) -> None:
        await self.db.delete(obj)
        await self.db.flush()
