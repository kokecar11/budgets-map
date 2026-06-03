from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from src.receipt_scan.models import ReceiptScanUsageModel
from src.core.utils import generate_uuid


class ReceiptScanUsageRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_count(self, user_id: str, period: str) -> int:
        """Return current scan count for the given user+period; 0 if no row exists."""
        from sqlalchemy import select
        result = await self.db.execute(
            select(ReceiptScanUsageModel.count).where(
                ReceiptScanUsageModel.user_id == user_id,
                ReceiptScanUsageModel.period == period,
            )
        )
        row = result.scalar_one_or_none()
        return row if row is not None else 0

    async def increment_and_get(self, user_id: str, period: str) -> int:
        """Atomically INSERT or increment count and return the new value.

        Uses Postgres INSERT … ON CONFLICT DO UPDATE … RETURNING so that
        concurrent requests serialize at the row lock level — no TOCTOU.
        NEVER calls commit(); the outer get_db dependency handles commit.
        """
        stmt = (
            pg_insert(ReceiptScanUsageModel)
            .values(
                id=generate_uuid(),
                user_id=user_id,
                period=period,
                count=1,
            )
            .on_conflict_do_update(
                index_elements=["user_id", "period"],
                set_={
                    "count": ReceiptScanUsageModel.count + 1,
                    "updated_at": func.now(),
                },
            )
            .returning(ReceiptScanUsageModel.count)
        )
        result = await self.db.execute(stmt)
        new_count: int = result.scalar_one()
        return new_count

    async def decrement(self, user_id: str, period: str) -> None:
        """Compensating decrement — releases a reserved scan unit on failure.

        Floors at 0 (count > 0 guard). Best-effort; callers should not let
        a decrement failure mask the original error.
        NEVER calls commit().
        """
        stmt = (
            update(ReceiptScanUsageModel)
            .where(
                ReceiptScanUsageModel.user_id == user_id,
                ReceiptScanUsageModel.period == period,
                ReceiptScanUsageModel.count > 0,
            )
            .values(
                count=ReceiptScanUsageModel.count - 1,
                updated_at=func.now(),
            )
        )
        await self.db.execute(stmt)
