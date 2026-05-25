from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func, extract
from typing import Optional, List
from src.transaction.models import TransactionModel
from src.transaction.schemas import TransactionCreate, TransactionUpdate


class TransactionRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, id: str) -> Optional[TransactionModel]:
        result = await self.db.execute(
            select(TransactionModel).where(TransactionModel.id == id)
        )
        return result.scalars().first()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[TransactionModel]:
        result = await self.db.execute(
            select(TransactionModel).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def get_by_user(self, user_id: str) -> List[TransactionModel]:
        result = await self.db.execute(
            select(TransactionModel).where(TransactionModel.user_id == user_id)
        )
        return result.scalars().all()

    async def get_by_user_paginated(
        self,
        user_id: str,
        limit: int,
        cursor_date: Optional[datetime] = None,
        cursor_id: Optional[str] = None,
    ) -> List[TransactionModel]:
        query = select(TransactionModel).where(TransactionModel.user_id == user_id)
        if cursor_date is not None and cursor_id is not None:
            query = query.where(
                or_(
                    TransactionModel.date < cursor_date,
                    and_(
                        TransactionModel.date == cursor_date,
                        TransactionModel.id < cursor_id,
                    ),
                )
            )
        query = query.order_by(desc(TransactionModel.date), desc(TransactionModel.id)).limit(limit + 1)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count_recurring(self, user_id: str) -> int:
        result = await self.db.execute(
            select(func.count(TransactionModel.id)).where(
                TransactionModel.user_id == user_id,
                TransactionModel.is_recurring == True,  # noqa: E712
            )
        )
        return result.scalar() or 0

    async def get_all_recurring(self) -> List[TransactionModel]:
        result = await self.db.execute(
            select(TransactionModel).where(
                TransactionModel.is_recurring == True,  # noqa: E712
                TransactionModel.recurrence.in_(["weekly", "monthly"]),
            )
        )
        return list(result.scalars().all())

    async def update_last_generated(self, obj: TransactionModel, dt: datetime) -> None:
        obj.last_generated_at = dt
        await self.db.flush()

    async def get_monthly_stats(self, user_id: str, year: int):
        result = await self.db.execute(
            select(
                extract("month", TransactionModel.date).label("month"),
                TransactionModel.type,
                func.sum(TransactionModel.amount).label("total"),
            )
            .where(
                TransactionModel.user_id == user_id,
                extract("year", TransactionModel.date) == year,
                TransactionModel.type.in_(["income", "expense"]),
            )
            .group_by(extract("month", TransactionModel.date), TransactionModel.type)
            .order_by(extract("month", TransactionModel.date))
        )
        return result.all()

    async def get_category_stats(self, user_id: str, year: int, month: Optional[int] = None):
        filters = [
            TransactionModel.user_id == user_id,
            extract("year", TransactionModel.date) == year,
            TransactionModel.type == "expense",
        ]
        if month is not None:
            filters.append(extract("month", TransactionModel.date) == month)
        result = await self.db.execute(
            select(
                TransactionModel.category_id,
                func.sum(TransactionModel.amount).label("total"),
                func.count(TransactionModel.id).label("count"),
            )
            .where(*filters)
            .group_by(TransactionModel.category_id)
            .order_by(desc(func.sum(TransactionModel.amount)))
        )
        return result.all()

    async def get_by_account(self, account_id: str) -> List[TransactionModel]:
        result = await self.db.execute(
            select(TransactionModel).where(TransactionModel.account_id == account_id)
        )
        return result.scalars().all()

    async def create(self, data: TransactionCreate) -> TransactionModel:
        dump = data.model_dump()
        if (
            dump.get("is_recurring")
            and dump.get("recurrence") == "monthly"
            and dump.get("recurrence_day_of_month") is None
            and dump.get("date") is not None
        ):
            dump["recurrence_day_of_month"] = dump["date"].day
        obj = TransactionModel(**dump)
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: TransactionModel, data: TransactionUpdate) -> TransactionModel:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: TransactionModel) -> None:
        await self.db.delete(obj)
        await self.db.flush()
