from fastapi import HTTPException, status
from src.budget.repository import BudgetRepository, BudgetItemRepository
from src.budget.schemas import (
    BudgetCreate, BudgetUpdate, BudgetItemCreate, BudgetItemUpdate,
    BudgetItemResponse, BudgetItemWithActual, BudgetSummaryResponse, AlertStatus,
)
from src.transaction.schemas import TransactionResponse
from src.budget.models import BudgetModel, BudgetItemModel
from src.transaction.repository import TransactionRepository


def _to_with_actual(item) -> BudgetItemWithActual:
    txs = item.transactions or []
    actual = sum(t.amount for t in txs) if txs else None
    difference = (item.planned_amount - actual) if actual is not None else None
    return BudgetItemWithActual(
        **BudgetItemResponse.model_validate(item).model_dump(),
        transactions=[TransactionResponse.model_validate(t) for t in txs],
        actual_amount=actual,
        difference=difference,
    )


class BudgetService:

    def __init__(self, repository: BudgetRepository):
        self.repository = repository

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[BudgetModel]:
        return await self.repository.get_all(skip=skip, limit=limit)

    async def get_by_user(self, user_id: str) -> list[BudgetModel]:
        return await self.repository.get_by_user(user_id)

    async def get_or_404(self, id: str) -> BudgetModel:
        obj = await self.repository.get_by_id(id)
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget not found"
            )
        return obj

    async def create(self, data: BudgetCreate) -> BudgetModel:
        return await self.repository.create(data)

    async def update(self, id: str, data: BudgetUpdate) -> BudgetModel:
        obj = await self.get_or_404(id)
        return await self.repository.update(obj, data)

    async def delete(self, id: str) -> None:
        obj = await self.get_or_404(id)
        await self.repository.delete(obj)

    async def get_summary(self, budget_id: str, item_service) -> BudgetSummaryResponse:
        budget = await self.repository.get_by_id(budget_id)
        if not budget:
            raise HTTPException(status_code=404, detail="Budget not found")
        items = await item_service.get_by_budget(budget_id)
        total_planned = sum(i.planned_amount for i in items)
        total_actual = sum(i.actual_amount for i in items if i.actual_amount is not None)
        if total_planned == 0:
            return BudgetSummaryResponse(total_planned=0, total_actual=total_actual, alert_status=AlertStatus.ok)
        warning_threshold = total_planned * budget.alert_warning_pct / 100
        danger_threshold = total_planned * budget.alert_danger_pct / 100
        if total_actual >= danger_threshold:
            alert_status = AlertStatus.over_budget
        elif total_actual >= warning_threshold:
            alert_status = AlertStatus.warning
        else:
            alert_status = AlertStatus.ok
        return BudgetSummaryResponse(total_planned=total_planned, total_actual=total_actual, alert_status=alert_status)


class BudgetItemService:

    def __init__(self, repository: BudgetItemRepository):
        self.repository = repository

    async def get_by_budget(self, budget_id: str) -> list[BudgetItemWithActual]:
        items = await self.repository.get_by_budget(budget_id)
        return [_to_with_actual(item) for item in items]

    async def get_or_404(self, id: str) -> BudgetItemModel:
        obj = await self.repository.get_by_id(id)
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget item not found"
            )
        return obj

    async def create(self, data: BudgetItemCreate) -> BudgetItemModel:
        return await self.repository.create(data)

    async def update(self, id: str, data: BudgetItemUpdate) -> BudgetItemWithActual:
        obj = await self.get_or_404(id)
        await self.repository.update(obj, data)
        updated_item = await self.repository.get_by_id(id)
        return _to_with_actual(updated_item)

    async def link_transaction(self, item_id: str, tx_id: str, user_id: str, tx_repo: TransactionRepository) -> BudgetItemWithActual:
        item = await self.get_or_404(item_id)
        tx = await tx_repo.get_by_id(tx_id)
        if tx is None or str(tx.user_id) != str(user_id):
            raise HTTPException(status_code=403, detail="Transaction does not belong to this user")
        tx.budget_item_id = item_id
        item.is_paid = True
        await self.repository.db.flush()
        await self.repository.db.refresh(item, attribute_names=["transactions"])
        return _to_with_actual(item)

    async def bulk_link_transactions(self, item_id: str, tx_ids: list[str], user_id: str, tx_repo: TransactionRepository) -> BudgetItemWithActual:
        item = await self.get_or_404(item_id)
        for tx_id in tx_ids:
            tx = await tx_repo.get_by_id(tx_id)
            if tx is None or str(tx.user_id) != str(user_id):
                raise HTTPException(status_code=403, detail="Transaction does not belong to this user")
            tx.budget_item_id = item_id
        if tx_ids:
            item.is_paid = True
        await self.repository.db.flush()
        await self.repository.db.refresh(item, attribute_names=["transactions"])
        return _to_with_actual(item)

    async def unlink_transaction(self, item_id: str, tx_id: str, tx_repo: TransactionRepository) -> BudgetItemWithActual:
        tx = await tx_repo.get_by_id(tx_id)
        if tx and str(tx.budget_item_id) == str(item_id):
            tx.budget_item_id = None
            await self.repository.db.flush()
        item = await self.repository.get_by_id(item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Budget item not found")
        if not item.transactions:
            item.is_paid = False
            await self.repository.db.flush()
        return _to_with_actual(item)

    async def delete(self, id: str) -> None:
        obj = await self.get_or_404(id)
        await self.repository.delete(obj)
