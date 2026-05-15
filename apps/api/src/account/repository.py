from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from src.account.models import AccountModel
from src.account.schemas import AccountCreate, AccountUpdate


class AccountRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, id: str) -> Optional[AccountModel]:
        result = await self.db.execute(
            select(AccountModel).where(AccountModel.id == id)
        )
        return result.scalars().first()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[AccountModel]:
        result = await self.db.execute(
            select(AccountModel).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def get_by_user(self, user_id: str) -> List[AccountModel]:
        result = await self.db.execute(
            select(AccountModel).where(AccountModel.user_id == user_id)
        )
        return result.scalars().all()

    async def create(self, data: AccountCreate) -> AccountModel:
        obj = AccountModel(**data.model_dump())
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: AccountModel, data: AccountUpdate) -> AccountModel:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: AccountModel) -> None:
        await self.db.delete(obj)
        await self.db.flush()

    async def compute_balance_from_transactions(self, account_id: str) -> float:
        from src.transaction.models import TransactionModel

        result = await self.db.execute(
            select(TransactionModel).where(TransactionModel.account_id == account_id)
        )
        source_txns = result.scalars().all()

        result2 = await self.db.execute(
            select(TransactionModel).where(TransactionModel.transfer_to_account_id == account_id)
        )
        dest_txns = result2.scalars().all()

        balance = 0.0
        for txn in source_txns:
            if txn.type == "income":
                balance += txn.amount
            else:  # expense, saving, transfer
                balance -= txn.amount
        for txn in dest_txns:
            balance += txn.amount
        return balance

    async def adjust_balance(self, account_id: str, delta: float) -> AccountModel:
        obj = await self.get_by_id(account_id)
        if obj is None:
            raise HTTPException(status_code=404, detail="Account not found")
        new_balance = obj.balance + delta
        if new_balance < 0:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        obj.balance = new_balance
        await self.db.flush()
        await self.db.refresh(obj)
        return obj
