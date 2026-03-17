from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from src.credit_card.models import (
    CreditCardModel, CreditCardPeriodModel,
    CreditCardTransactionModel, CreditCardPaymentModel,
)
from src.credit_card.schemas import (
    CreditCardCreate, CreditCardUpdate,
    CreditCardPeriodCreate, CreditCardPeriodUpdate,
    CreditCardTransactionCreate, CreditCardTransactionUpdate,
    CreditCardPaymentCreate, CreditCardPaymentUpdate,
)


class CreditCardRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, id: str) -> Optional[CreditCardModel]:
        result = await self.db.execute(select(CreditCardModel).where(CreditCardModel.id == id))
        return result.scalars().first()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[CreditCardModel]:
        result = await self.db.execute(select(CreditCardModel).offset(skip).limit(limit))
        return result.scalars().all()

    async def get_by_user(self, user_id: str) -> List[CreditCardModel]:
        result = await self.db.execute(select(CreditCardModel).where(CreditCardModel.user_id == user_id))
        return result.scalars().all()

    async def create(self, data: CreditCardCreate) -> CreditCardModel:
        obj = CreditCardModel(**data.model_dump())
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: CreditCardModel, data: CreditCardUpdate) -> CreditCardModel:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: CreditCardModel) -> None:
        await self.db.delete(obj)
        await self.db.flush()


class CreditCardPeriodRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, id: str) -> Optional[CreditCardPeriodModel]:
        result = await self.db.execute(select(CreditCardPeriodModel).where(CreditCardPeriodModel.id == id))
        return result.scalars().first()

    async def get_by_credit_card(self, credit_card_id: str) -> List[CreditCardPeriodModel]:
        result = await self.db.execute(select(CreditCardPeriodModel).where(CreditCardPeriodModel.credit_card_id == credit_card_id))
        return result.scalars().all()

    async def create(self, data: CreditCardPeriodCreate) -> CreditCardPeriodModel:
        obj = CreditCardPeriodModel(**data.model_dump())
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: CreditCardPeriodModel, data: CreditCardPeriodUpdate) -> CreditCardPeriodModel:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: CreditCardPeriodModel) -> None:
        await self.db.delete(obj)
        await self.db.flush()


class CreditCardTransactionRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, id: str) -> Optional[CreditCardTransactionModel]:
        result = await self.db.execute(select(CreditCardTransactionModel).where(CreditCardTransactionModel.id == id))
        return result.scalars().first()

    async def get_by_credit_card(self, credit_card_id: str) -> List[CreditCardTransactionModel]:
        result = await self.db.execute(select(CreditCardTransactionModel).where(CreditCardTransactionModel.credit_card_id == credit_card_id))
        return result.scalars().all()

    async def create(self, data: CreditCardTransactionCreate) -> CreditCardTransactionModel:
        obj = CreditCardTransactionModel(**data.model_dump())
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: CreditCardTransactionModel, data: CreditCardTransactionUpdate) -> CreditCardTransactionModel:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: CreditCardTransactionModel) -> None:
        await self.db.delete(obj)
        await self.db.flush()


class CreditCardPaymentRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, id: str) -> Optional[CreditCardPaymentModel]:
        result = await self.db.execute(select(CreditCardPaymentModel).where(CreditCardPaymentModel.id == id))
        return result.scalars().first()

    async def get_by_credit_card(self, credit_card_id: str) -> List[CreditCardPaymentModel]:
        result = await self.db.execute(select(CreditCardPaymentModel).where(CreditCardPaymentModel.credit_card_id == credit_card_id))
        return result.scalars().all()

    async def create(self, data: CreditCardPaymentCreate) -> CreditCardPaymentModel:
        obj = CreditCardPaymentModel(**data.model_dump())
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: CreditCardPaymentModel, data: CreditCardPaymentUpdate) -> CreditCardPaymentModel:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: CreditCardPaymentModel) -> None:
        await self.db.delete(obj)
        await self.db.flush()
