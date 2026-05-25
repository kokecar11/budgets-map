from fastapi import APIRouter, Depends, status
from typing import Annotated, List

from src.auth.dependencies import get_current_user
from src.user.models import UserModel
from src.account.schemas import AccountCreate, AccountUpdate, AccountResponse
from src.account.services import AccountService
from src.account.dependencies import get_account_service

router = APIRouter(prefix="/accounts", tags=["Accounts"])

CurrentUser = Annotated[UserModel, Depends(get_current_user)]


@router.get("", response_model=List[AccountResponse])
async def list_accounts(
    current_user: CurrentUser,
    service: AccountService = Depends(get_account_service),
):
    return await service.get_by_user(current_user.id)


@router.get("/{id}", response_model=AccountResponse)
async def get_account(
    id: str,
    _: CurrentUser,
    service: AccountService = Depends(get_account_service),
):
    return await service.get_or_404(id)


@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(
    data: AccountCreate,
    current_user: CurrentUser,
    service: AccountService = Depends(get_account_service),
):
    data.user_id = current_user.id
    return await service.create(data)


@router.patch("/{id}", response_model=AccountResponse)
async def update_account(
    id: str,
    data: AccountUpdate,
    _: CurrentUser,
    service: AccountService = Depends(get_account_service),
):
    return await service.update(id, data)


@router.post("/{id}/recalculate", response_model=AccountResponse)
async def recalculate_account_balance(
    id: str,
    _: CurrentUser,
    service: AccountService = Depends(get_account_service),
):
    return await service.recalculate_balance(id)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    id: str,
    _: CurrentUser,
    service: AccountService = Depends(get_account_service),
):
    await service.delete(id)
