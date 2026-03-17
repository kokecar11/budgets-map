from fastapi import HTTPException, status
from src.permissions.repository import PermissionRepository
from src.permissions.schemas import PermissionCreate, PermissionUpdate
from src.permissions.models import PermissionModel


class PermissionService:

    def __init__(self, repository: PermissionRepository):
        self.repository = repository

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[PermissionModel]:
        return await self.repository.get_all(skip=skip, limit=limit)

    async def get_or_404(self, id: str) -> PermissionModel:
        obj = await self.repository.get_by_id(id)
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Permission not found"
            )
        return obj

    async def create(self, data: PermissionCreate) -> PermissionModel:
        return await self.repository.create(data)

    async def update(self, id: str, data: PermissionUpdate) -> PermissionModel:
        obj = await self.get_or_404(id)
        return await self.repository.update(obj, data)

    async def delete(self, id: str) -> None:
        obj = await self.get_or_404(id)
        await self.repository.delete(obj)
