from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Annotated, List, Optional

from src.auth.dependencies import get_current_user
from src.user.models import UserModel
from src.transaction.schemas import (
    TransactionCreate, TransactionUpdate, TransactionResponse, TransactionPageResponse,
    MonthlyStatsResponse, CategoryStatsResponse,
)
from src.transaction.services import TransactionService
from src.transaction.dependencies import get_transaction_service

router = APIRouter(prefix="/transactions", tags=["Transactions"])

CurrentUser = Annotated[UserModel, Depends(get_current_user)]


@router.get("/", response_model=List[TransactionResponse])
async def list_transactions(
    current_user: CurrentUser,
    service: TransactionService = Depends(get_transaction_service),
):
    return await service.get_by_user(current_user.id)


@router.get("/paged", response_model=TransactionPageResponse)
async def list_transactions_paged(
    current_user: CurrentUser,
    limit: int = Query(50, ge=1, le=200),
    next_token: Optional[str] = Query(None),
    service: TransactionService = Depends(get_transaction_service),
):
    return await service.list_paginated(current_user.id, limit=limit, next_token=next_token)


@router.get("/summary/monthly", response_model=MonthlyStatsResponse)
async def get_monthly_stats(
    current_user: CurrentUser,
    year: int = Query(None),
    service: TransactionService = Depends(get_transaction_service),
):
    from datetime import datetime
    y = year or datetime.now().year
    return await service.monthly_stats(current_user.id, y)


@router.get("/summary/categories", response_model=CategoryStatsResponse)
async def get_category_stats(
    current_user: CurrentUser,
    year: int = Query(None),
    month: Optional[int] = Query(None),
    service: TransactionService = Depends(get_transaction_service),
):
    from datetime import datetime
    y = year or datetime.now().year
    return await service.category_stats(current_user.id, y, month)


@router.get("/account/{account_id}", response_model=List[TransactionResponse])
async def list_transactions_by_account(
    account_id: str,
    _: CurrentUser,
    service: TransactionService = Depends(get_transaction_service),
):
    return await service.get_by_account(account_id)


@router.get("/{id}", response_model=TransactionResponse)
async def get_transaction(
    id: str,
    _: CurrentUser,
    service: TransactionService = Depends(get_transaction_service),
):
    return await service.get_or_404(id)


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    data: TransactionCreate,
    current_user: CurrentUser,
    service: TransactionService = Depends(get_transaction_service),
):
    if data.is_recurring:
        if current_user.plan != "pro" and await service.count_recurring(current_user.id) >= 1:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="RECURRING_LIMIT_REACHED",
            )
    data.user_id = current_user.id
    return await service.create(data)


@router.patch("/{id}", response_model=TransactionResponse)
async def update_transaction(
    id: str,
    data: TransactionUpdate,
    _: CurrentUser,
    service: TransactionService = Depends(get_transaction_service),
):
    return await service.update(id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    id: str,
    _: CurrentUser,
    service: TransactionService = Depends(get_transaction_service),
):
    await service.delete(id)
