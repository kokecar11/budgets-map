from fastapi import APIRouter, Depends, status
from typing import Annotated, List

from src.auth.dependencies import get_current_user
from src.user.models import UserModel
from src.permissions.schemas import PermissionCreate, PermissionUpdate, PermissionResponse
from src.permissions.services import PermissionService
from src.permissions.dependencies import get_permission_service

router = APIRouter(prefix="/permissions", tags=["Permissions"])

CurrentUser = Annotated[UserModel, Depends(get_current_user)]


@router.get("/", response_model=List[PermissionResponse])
async def list_permissions(
    _: CurrentUser,
    service: PermissionService = Depends(get_permission_service),
):
    return await service.get_all()


@router.get("/{id}", response_model=PermissionResponse)
async def get_permission(
    id: str,
    _: CurrentUser,
    service: PermissionService = Depends(get_permission_service),
):
    return await service.get_or_404(id)


@router.post("/", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
async def create_permission(
    data: PermissionCreate,
    _: CurrentUser,
    service: PermissionService = Depends(get_permission_service),
):
    return await service.create(data)


@router.patch("/{id}", response_model=PermissionResponse)
async def update_permission(
    id: str,
    data: PermissionUpdate,
    _: CurrentUser,
    service: PermissionService = Depends(get_permission_service),
):
    return await service.update(id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_permission(
    id: str,
    _: CurrentUser,
    service: PermissionService = Depends(get_permission_service),
):
    await service.delete(id)
