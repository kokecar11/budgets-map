import base64
from datetime import datetime, timezone
from fastapi import HTTPException, status
from typing import Optional
from src.transaction.repository import TransactionRepository
from src.account.repository import AccountRepository
from src.transaction.schemas import (
    TransactionCreate, TransactionUpdate, TransactionPageResponse,
    MonthlyStatsResponse, MonthlyStat, CategoryStatsResponse, CategoryStat,
)
from src.transaction.models import TransactionModel


class TransactionService:

    def __init__(self, repository: TransactionRepository, account_repository: AccountRepository):
        self.repository = repository
        self.account_repository = account_repository

    def _balance_delta(
        self,
        tx_type: str,
        amount: float,
        transfer_to_account_id: str | None = None,
    ) -> tuple[float, float]:
        if tx_type == "income":
            return (+amount, 0)
        elif tx_type == "transfer":
            return (-amount, +amount)
        elif tx_type == "credit_card_charge":
            return (0, 0)
        else:  # expense, saving
            return (-amount, 0)

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[TransactionModel]:
        return await self.repository.get_all(skip=skip, limit=limit)

    async def get_by_user(self, user_id: str) -> list[TransactionModel]:
        return await self.repository.get_by_user(user_id)

    async def list_paginated(
        self, user_id: str, limit: int = 50, next_token: Optional[str] = None
    ) -> TransactionPageResponse:
        cursor_date: Optional[datetime] = None
        cursor_id: Optional[str] = None
        if next_token:
            try:
                decoded = base64.b64decode(next_token.encode()).decode()
                date_str, cursor_id = decoded.split("|", 1)
                cursor_date = datetime.fromisoformat(date_str)
                if cursor_date.tzinfo is None:
                    cursor_date = cursor_date.replace(tzinfo=timezone.utc)
            except Exception:
                pass

        rows = await self.repository.get_by_user_paginated(user_id, limit, cursor_date, cursor_id)
        has_more = len(rows) > limit
        items = rows[:limit]

        new_next_token: Optional[str] = None
        if has_more and items:
            last = items[-1]
            raw = f"{last.date.isoformat()}|{last.id}"
            new_next_token = base64.b64encode(raw.encode()).decode()

        return TransactionPageResponse(items=items, next_token=new_next_token)

    async def get_by_account(self, account_id: str) -> list[TransactionModel]:
        return await self.repository.get_by_account(account_id)

    async def get_or_404(self, id: str) -> TransactionModel:
        obj = await self.repository.get_by_id(id)
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        return obj

    async def create(self, data: TransactionCreate) -> TransactionModel:
        obj = await self.repository.create(data)
        src, dst = self._balance_delta(data.type, data.amount, data.transfer_to_account_id)
        if data.account_id:
            await self.account_repository.adjust_balance(data.account_id, src)
        if data.type == "transfer" and data.transfer_to_account_id:
            await self.account_repository.adjust_balance(data.transfer_to_account_id, dst)
        return obj

    async def update(self, id: str, data: TransactionUpdate) -> TransactionModel:
        obj = await self.get_or_404(id)
        # Snapshot BEFORE mutation
        old_type = obj.type
        old_amount = obj.amount
        old_transfer_to = obj.transfer_to_account_id
        account_id = obj.account_id
        # Apply update
        obj = await self.repository.update(obj, data)
        # Only recalculate balance if fields that affect it actually changed
        balance_fields_changed = (
            data.type is not None or
            data.amount is not None or
            (hasattr(data, "transfer_to_account_id") and data.transfer_to_account_id is not None)
        )
        if balance_fields_changed:
            # Reverse old balance effect
            old_src, old_dst = self._balance_delta(old_type, old_amount, old_transfer_to)
            if account_id:
                await self.account_repository.adjust_balance(account_id, -old_src)
            if old_transfer_to:
                await self.account_repository.adjust_balance(old_transfer_to, -old_dst)
            # Apply new balance effect
            new_src, new_dst = self._balance_delta(obj.type, obj.amount, obj.transfer_to_account_id)
            if account_id:
                await self.account_repository.adjust_balance(account_id, new_src)
            if obj.transfer_to_account_id:
                await self.account_repository.adjust_balance(obj.transfer_to_account_id, new_dst)
        return obj

    async def delete(self, id: str) -> None:
        obj = await self.get_or_404(id)
        # Snapshot BEFORE deletion
        tx_type = obj.type
        amount = obj.amount
        account_id = obj.account_id
        transfer_to = obj.transfer_to_account_id
        await self.repository.delete(obj)
        # Reverse balance effect
        src, dst = self._balance_delta(tx_type, amount, transfer_to)
        if account_id:
            await self.account_repository.adjust_balance(account_id, -src)
        if transfer_to:
            await self.account_repository.adjust_balance(transfer_to, -dst)

    async def count_recurring(self, user_id: str) -> int:
        return await self.repository.count_recurring(user_id)

    async def monthly_stats(self, user_id: str, year: int) -> MonthlyStatsResponse:
        rows = await self.repository.get_monthly_stats(user_id, year)
        monthly: dict[int, MonthlyStat] = {}
        for row in rows:
            m = int(row.month)
            if m not in monthly:
                monthly[m] = MonthlyStat(month=m, income=0.0, expenses=0.0, net=0.0)
            if row.type == "income":
                monthly[m].income = float(row.total)
            elif row.type == "expense":
                monthly[m].expenses = float(row.total)
        for stat in monthly.values():
            stat.net = stat.income - stat.expenses
        stats = sorted(monthly.values(), key=lambda s: s.month)
        return MonthlyStatsResponse(year=year, stats=stats)

    async def category_stats(self, user_id: str, year: int, month: Optional[int] = None) -> CategoryStatsResponse:
        rows = await self.repository.get_category_stats(user_id, year, month)
        stats = [
            CategoryStat(
                category_id=row.category_id,
                total=float(row.total),
                count=int(row.count),
            )
            for row in rows
        ]
        return CategoryStatsResponse(stats=stats)
