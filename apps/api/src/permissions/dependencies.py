from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.permissions.repository import PermissionRepository
from src.permissions.services import PermissionService


def get_permission_service(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PermissionService:
    permission_repository = PermissionRepository(db)
    return PermissionService(permission_repository)
