import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from src.celery_app import celery_app
from src.core.settings import get_settings
from src.core.utils import generate_uuid
from src.core.metadata_models import load_all_models
from src.transaction.models import TransactionModel

load_all_models()

logger = logging.getLogger(__name__)


async def _run():
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_maker = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_maker() as session:
        try:
            from sqlalchemy import select

            result = await session.execute(
                select(TransactionModel).where(
                    TransactionModel.is_recurring == True,  # noqa: E712
                    TransactionModel.recurrence.in_(["weekly", "monthly"]),
                )
            )
            recurring = list(result.scalars().all())

            now = datetime.now(tz=timezone.utc)
            today = now.date()
            generated = 0

            for tx in recurring:
                last = tx.last_generated_at
                if last is None:
                    last_date = tx.date.date() if tx.date else today
                else:
                    last_date = last.date() if hasattr(last, "date") else last

                should_generate = False
                if tx.recurrence == "weekly":
                    should_generate = (today - last_date).days >= 7
                elif tx.recurrence == "monthly":
                    should_generate = (
                        today.year > last_date.year
                        or (today.year == last_date.year and today.month > last_date.month)
                    )

                if not should_generate:
                    continue

                new_tx = TransactionModel(
                    id=generate_uuid(),
                    user_id=tx.user_id,
                    account_id=tx.account_id,
                    category_id=tx.category_id,
                    type=tx.type,
                    amount=tx.amount,
                    description=tx.description,
                    date=now,
                    is_recurring=False,
                    recurrence=None,
                    saving_goal_id=tx.saving_goal_id,
                )
                session.add(new_tx)
                tx.last_generated_at = now
                generated += 1

            await session.commit()
            logger.info(f"Recurring transactions: generated {generated} new transactions")
        except Exception as e:
            await session.rollback()
            logger.error(f"Error processing recurring transactions: {e}")
            raise
    await engine.dispose()


@celery_app.task(name="src.tasks.recurring_transactions.process_recurring")
def process_recurring():
    asyncio.run(_run())
