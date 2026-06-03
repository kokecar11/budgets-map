from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from openai import AsyncOpenAI
from src.core.database import get_db
from src.core.settings import get_settings, Settings
from src.transaction.repository import TransactionRepository
from src.transaction.services import TransactionService
from src.account.repository import AccountRepository
from src.transaction.receipt_scan_service import ReceiptScanService


def get_transaction_service(db: Annotated[AsyncSession, Depends(get_db)]) -> TransactionService:
    transaction_repository = TransactionRepository(db)
    account_repository = AccountRepository(db)
    return TransactionService(transaction_repository, account_repository)


def get_receipt_scan_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> ReceiptScanService:
    """Provide a ReceiptScanService wired with an AsyncOpenAI client."""
    client = AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY,
        timeout=settings.OPENAI_SCAN_TIMEOUT,
    )
    return ReceiptScanService(client, settings)
