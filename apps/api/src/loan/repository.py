from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from src.loan.models import LoanModel, LoanPaymentModel, LoanAmortizationModel
from src.loan.schemas import (
    LoanCreate, LoanUpdate,
    LoanPaymentCreate, LoanPaymentUpdate,
    LoanAmortizationCreate, LoanAmortizationUpdate,
)


class LoanRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, id: str) -> Optional[LoanModel]:
        result = await self.db.execute(select(LoanModel).where(LoanModel.id == id))
        return result.scalars().first()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[LoanModel]:
        result = await self.db.execute(select(LoanModel).offset(skip).limit(limit))
        return result.scalars().all()

    async def get_by_user(self, user_id: str) -> List[LoanModel]:
        result = await self.db.execute(select(LoanModel).where(LoanModel.user_id == user_id))
        return result.scalars().all()

    async def create(self, data: LoanCreate) -> LoanModel:
        obj = LoanModel(**data.model_dump())
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: LoanModel, data: LoanUpdate) -> LoanModel:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: LoanModel) -> None:
        await self.db.delete(obj)
        await self.db.flush()


class LoanPaymentRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, id: str) -> Optional[LoanPaymentModel]:
        result = await self.db.execute(select(LoanPaymentModel).where(LoanPaymentModel.id == id))
        return result.scalars().first()

    async def get_by_loan(self, loan_id: str) -> List[LoanPaymentModel]:
        result = await self.db.execute(select(LoanPaymentModel).where(LoanPaymentModel.loan_id == loan_id))
        return result.scalars().all()

    async def create(self, data: LoanPaymentCreate) -> LoanPaymentModel:
        obj = LoanPaymentModel(**data.model_dump())
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: LoanPaymentModel, data: LoanPaymentUpdate) -> LoanPaymentModel:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: LoanPaymentModel) -> None:
        await self.db.delete(obj)
        await self.db.flush()


class LoanAmortizationRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, id: str) -> Optional[LoanAmortizationModel]:
        result = await self.db.execute(select(LoanAmortizationModel).where(LoanAmortizationModel.id == id))
        return result.scalars().first()

    async def get_by_loan(self, loan_id: str) -> List[LoanAmortizationModel]:
        result = await self.db.execute(select(LoanAmortizationModel).where(LoanAmortizationModel.loan_id == loan_id))
        return result.scalars().all()

    async def create(self, data: LoanAmortizationCreate) -> LoanAmortizationModel:
        obj = LoanAmortizationModel(**data.model_dump())
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: LoanAmortizationModel, data: LoanAmortizationUpdate) -> LoanAmortizationModel:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: LoanAmortizationModel) -> None:
        await self.db.delete(obj)
        await self.db.flush()
