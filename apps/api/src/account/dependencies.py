from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.account.repository import AccountRepository
from src.account.services import AccountService


def get_account_service(db: Annotated[AsyncSession, Depends(get_db)]) -> AccountService:
    account_repository = AccountRepository(db)
    return AccountService(account_repository)
