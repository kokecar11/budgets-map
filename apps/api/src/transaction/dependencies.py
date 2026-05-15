from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.transaction.repository import TransactionRepository
from src.transaction.services import TransactionService
from src.account.repository import AccountRepository


def get_transaction_service(db: Annotated[AsyncSession, Depends(get_db)]) -> TransactionService:
    transaction_repository = TransactionRepository(db)
    account_repository = AccountRepository(db)
    return TransactionService(transaction_repository, account_repository)
