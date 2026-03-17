from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.loan.repository import LoanRepository, LoanPaymentRepository, LoanAmortizationRepository
from src.loan.services import LoanService, LoanPaymentService, LoanAmortizationService


def get_loan_service(db: Annotated[AsyncSession, Depends(get_db)]) -> LoanService:
    return LoanService(LoanRepository(db))


def get_loan_payment_service(db: Annotated[AsyncSession, Depends(get_db)]) -> LoanPaymentService:
    return LoanPaymentService(LoanPaymentRepository(db))


def get_loan_amortization_service(db: Annotated[AsyncSession, Depends(get_db)]) -> LoanAmortizationService:
    return LoanAmortizationService(LoanAmortizationRepository(db))
