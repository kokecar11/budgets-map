from fastapi import APIRouter, Depends, status
from typing import Annotated, List

from src.auth.dependencies import get_current_user
from src.user.models import UserModel
from src.user.schemas import UserCreate, UserUpdate, UserResponse
from src.user.services import UserService
from src.user.dependencies import get_user_service

router = APIRouter(prefix="/users", tags=["Users"])

CurrentUser = Annotated[UserModel, Depends(get_current_user)]


@router.get("", response_model=List[UserResponse])
async def list_users(
    _: CurrentUser,
    service: UserService = Depends(get_user_service),
):
    return await service.get_all()


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUser):
    return current_user


@router.get("/{id}", response_model=UserResponse)
async def get_user(
    id: str,
    _: CurrentUser,
    service: UserService = Depends(get_user_service),
):
    return await service.get_or_404(id)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    _: CurrentUser,
    service: UserService = Depends(get_user_service),
):
    return await service.create(data)


@router.patch("/{id}", response_model=UserResponse)
async def update_user(
    id: str,
    data: UserUpdate,
    current_user: CurrentUser,
    service: UserService = Depends(get_user_service),
):
    return await service.update(current_user.id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    id: str,
    _: CurrentUser,
    service: UserService = Depends(get_user_service),
):
    await service.delete(id)
