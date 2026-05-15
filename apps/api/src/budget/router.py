from fastapi import APIRouter, Depends, status
from typing import Annotated, List

from src.auth.dependencies import get_current_user
from src.user.models import UserModel
from src.budget.schemas import (
    BudgetCreate, BudgetUpdate, BudgetResponse,
    BudgetItemCreate, BudgetItemUpdate, BudgetItemResponse,
    BudgetItemWithActual, BudgetSummaryResponse,
)
from src.budget.services import BudgetService, BudgetItemService
from src.budget.dependencies import get_budget_service, get_budget_item_service, get_transaction_repository
from src.transaction.repository import TransactionRepository

router = APIRouter(prefix="/budgets", tags=["Budgets"])

CurrentUser = Annotated[UserModel, Depends(get_current_user)]


# --- Budgets ---

@router.get("/", response_model=List[BudgetResponse])
async def list_budgets(
    current_user: CurrentUser,
    service: BudgetService = Depends(get_budget_service),
):
    return await service.get_by_user(current_user.id)


@router.get("/{id}", response_model=BudgetResponse)
async def get_budget(
    id: str,
    _: CurrentUser,
    service: BudgetService = Depends(get_budget_service),
):
    return await service.get_or_404(id)


@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(
    data: BudgetCreate,
    current_user: CurrentUser,
    service: BudgetService = Depends(get_budget_service),
):
    data.user_id = current_user.id
    return await service.create(data)


@router.patch("/{id}", response_model=BudgetResponse)
async def update_budget(
    id: str,
    data: BudgetUpdate,
    _: CurrentUser,
    service: BudgetService = Depends(get_budget_service),
):
    return await service.update(id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    id: str,
    _: CurrentUser,
    service: BudgetService = Depends(get_budget_service),
):
    await service.delete(id)


# --- Budget Items ---

@router.get("/{budget_id}/items", response_model=List[BudgetItemWithActual])
async def list_budget_items(
    budget_id: str,
    _: CurrentUser,
    service: BudgetItemService = Depends(get_budget_item_service),
):
    return await service.get_by_budget(budget_id)


@router.post("/{budget_id}/items", response_model=BudgetItemResponse, status_code=status.HTTP_201_CREATED)
async def create_budget_item(
    budget_id: str,
    data: BudgetItemCreate,
    _: CurrentUser,
    service: BudgetItemService = Depends(get_budget_item_service),
):
    data.budget_id = budget_id
    return await service.create(data)


@router.patch("/items/{id}", response_model=BudgetItemWithActual)
async def update_budget_item(
    id: str,
    data: BudgetItemUpdate,
    current_user: CurrentUser,
    service: BudgetItemService = Depends(get_budget_item_service),
    transaction_repo: TransactionRepository = Depends(get_transaction_repository),
):
    return await service.update(id, data, user_id=current_user.id, transaction_repo=transaction_repo)


@router.delete("/items/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget_item(
    id: str,
    _: CurrentUser,
    service: BudgetItemService = Depends(get_budget_item_service),
):
    await service.delete(id)


@router.get("/{id}/summary", response_model=BudgetSummaryResponse)
async def get_budget_summary(
    id: str,
    _: CurrentUser,
    budget_service: BudgetService = Depends(get_budget_service),
    item_service: BudgetItemService = Depends(get_budget_item_service),
):
    return await budget_service.get_summary(id, item_service)
