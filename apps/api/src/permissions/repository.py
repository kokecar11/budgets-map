from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from src.permissions.models import PermissionModel
from src.permissions.schemas import PermissionCreate, PermissionUpdate


class PermissionRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, id: str) -> Optional[PermissionModel]:
        result = await self.db.execute(
            select(PermissionModel).where(PermissionModel.id == id)
        )
        return result.scalars().first()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[PermissionModel]:
        result = await self.db.execute(
            select(PermissionModel).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def create(self, data: PermissionCreate) -> PermissionModel:
        obj = PermissionModel(**data.model_dump())
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: PermissionModel, data: PermissionUpdate) -> PermissionModel:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: PermissionModel) -> None:
        await self.db.delete(obj)
        await self.db.flush()
