import asyncio
import calendar
import logging
from datetime import datetime, timezone, date as date_type

from sqlalchemy import select

from src.celery_app import celery_app
from src.core.database import _get_session_maker
from src.core.metadata_models import load_all_models
from src.transaction.models import TransactionModel

load_all_models()

logger = logging.getLogger(__name__)


def _compute_target_day(recurrence_day: int, year: int, month: int) -> int:
    max_day = calendar.monthrange(year, month)[1]
    return min(recurrence_day, max_day)


def _should_generate_monthly(tx: TransactionModel, today: date_type) -> bool:
    last = tx.last_generated_at
    if last is None:
        last_date = tx.date.date() if tx.date else today
    else:
        last_date = last.date() if hasattr(last, "date") else last
    return today.year > last_date.year or (today.year == last_date.year and today.month > last_date.month)


async def _run() -> None:
    today = datetime.now(tz=timezone.utc).date()

    async with _get_session_maker()() as session:
        try:
            result = await session.execute(
                select(TransactionModel).where(
                    TransactionModel.is_recurring == True,  # noqa: E712
                    TransactionModel.recurrence == "monthly",
                    TransactionModel.recurrence_day_of_month != None,  # noqa: E711
                )
            )
            templates = result.scalars().all()
            generated = 0

            for tx in templates:
                recurrence_day = tx.recurrence_day_of_month or tx.date.day
                target_day = _compute_target_day(recurrence_day, today.year, today.month)

                if today.day != target_day:
                    continue

                if not _should_generate_monthly(tx, today):
                    logger.info(
                        "Skipping template %s — already generated for %s-%s",
                        tx.id, today.year, today.month,
                    )
                    continue

                target_date = datetime(today.year, today.month, target_day, 0, 5, 0, tzinfo=timezone.utc)

                new_tx = TransactionModel(
                    user_id=tx.user_id,
                    account_id=tx.account_id,
                    category_id=tx.category_id,
                    type=tx.type,
                    amount=tx.amount,
                    description=tx.description,
                    date=target_date,
                    is_recurring=False,
                    recurrence="none",
                    saving_goal_id=tx.saving_goal_id,
                    parent_transaction_id=tx.id,
                )
                session.add(new_tx)
                await session.flush()

                # Adjust account balance (mirrors TransactionService logic)
                if tx.account_id and tx.amount is not None:
                    from src.account.models import AccountModel
                    acc_result = await session.execute(
                        select(AccountModel).where(AccountModel.id == tx.account_id)
                    )
                    account = acc_result.scalars().first()
                    if account:
                        if tx.type == "income":
                            account.balance += tx.amount
                        elif tx.type == "expense":
                            account.balance -= tx.amount
                        await session.flush()

                tx.last_generated_at = datetime.now(tz=timezone.utc)
                generated += 1

            await session.commit()
            logger.info("Recurring transactions: generated %d copies", generated)

        except Exception as exc:
            await session.rollback()
            logger.error("Error processing recurring transactions: %s", exc, exc_info=True)
            raise


@celery_app.task(name="src.tasks.recurring_transactions.process_recurring")
def process_recurring() -> None:
    asyncio.run(_run())
