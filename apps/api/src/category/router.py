from fastapi import APIRouter, Depends, status
from typing import Annotated, List

from src.auth.dependencies import get_current_user
from src.user.models import UserModel
from src.category.schemas import CategoryCreate, CategoryUpdate, CategoryResponse
from src.category.services import CategoryService
from src.category.dependencies import get_category_service

router = APIRouter(prefix="/categories", tags=["Categories"])

CurrentUser = Annotated[UserModel, Depends(get_current_user)]


@router.get("", response_model=List[CategoryResponse])
async def list_categories(
    current_user: CurrentUser,
    service: CategoryService = Depends(get_category_service),
):
    return await service.get_by_user(current_user.id)


@router.get("/{id}", response_model=CategoryResponse)
async def get_category(
    id: str,
    _: CurrentUser,
    service: CategoryService = Depends(get_category_service),
):
    return await service.get_or_404(id)


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    current_user: CurrentUser,
    service: CategoryService = Depends(get_category_service),
):
    data.user_id = current_user.id
    return await service.create(data)


@router.patch("/{id}", response_model=CategoryResponse)
async def update_category(
    id: str,
    data: CategoryUpdate,
    _: CurrentUser,
    service: CategoryService = Depends(get_category_service),
):
    return await service.update(id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    id: str,
    _: CurrentUser,
    service: CategoryService = Depends(get_category_service),
):
    await service.delete(id)
