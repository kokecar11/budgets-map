from fastapi import HTTPException, status
from src.loan.repository import LoanRepository, LoanPaymentRepository, LoanAmortizationRepository
from src.loan.schemas import (
    LoanCreate, LoanUpdate,
    LoanPaymentCreate, LoanPaymentUpdate,
    LoanAmortizationCreate, LoanAmortizationUpdate,
)
from src.loan.models import LoanModel, LoanPaymentModel, LoanAmortizationModel


class LoanService:

    def __init__(self, repository: LoanRepository):
        self.repository = repository

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[LoanModel]:
        return await self.repository.get_all(skip=skip, limit=limit)

    async def get_by_user(self, user_id: str) -> list[LoanModel]:
        return await self.repository.get_by_user(user_id)

    async def get_or_404(self, id: str) -> LoanModel:
        obj = await self.repository.get_by_id(id)
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found")
        return obj

    async def create(self, data: LoanCreate) -> LoanModel:
        return await self.repository.create(data)

    async def update(self, id: str, data: LoanUpdate) -> LoanModel:
        obj = await self.get_or_404(id)
        return await self.repository.update(obj, data)

    async def delete(self, id: str) -> None:
        obj = await self.get_or_404(id)
        await self.repository.delete(obj)


class LoanPaymentService:

    def __init__(self, repository: LoanPaymentRepository):
        self.repository = repository

    async def get_by_loan(self, loan_id: str) -> list[LoanPaymentModel]:
        return await self.repository.get_by_loan(loan_id)

    async def get_or_404(self, id: str) -> LoanPaymentModel:
        obj = await self.repository.get_by_id(id)
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan payment not found")
        return obj

    async def create(self, data: LoanPaymentCreate) -> LoanPaymentModel:
        return await self.repository.create(data)

    async def update(self, id: str, data: LoanPaymentUpdate) -> LoanPaymentModel:
        obj = await self.get_or_404(id)
        return await self.repository.update(obj, data)

    async def delete(self, id: str) -> None:
        obj = await self.get_or_404(id)
        await self.repository.delete(obj)


class LoanAmortizationService:

    def __init__(self, repository: LoanAmortizationRepository):
        self.repository = repository

    async def get_by_loan(self, loan_id: str) -> list[LoanAmortizationModel]:
        return await self.repository.get_by_loan(loan_id)

    async def get_or_404(self, id: str) -> LoanAmortizationModel:
        obj = await self.repository.get_by_id(id)
        if not obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan amortization entry not found")
        return obj

    async def create(self, data: LoanAmortizationCreate) -> LoanAmortizationModel:
        return await self.repository.create(data)

    async def update(self, id: str, data: LoanAmortizationUpdate) -> LoanAmortizationModel:
        obj = await self.get_or_404(id)
        return await self.repository.update(obj, data)

    async def delete(self, id: str) -> None:
        obj = await self.get_or_404(id)
        await self.repository.delete(obj)
