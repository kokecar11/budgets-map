from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.credit_card.repository import (
    CreditCardRepository, CreditCardPeriodRepository,
    CreditCardTransactionRepository, CreditCardPaymentRepository,
)
from src.credit_card.services import (
    CreditCardService, CreditCardPeriodService,
    CreditCardTransactionService, CreditCardPaymentService,
)
from src.transaction.repository import TransactionRepository


def get_credit_card_service(db: Annotated[AsyncSession, Depends(get_db)]) -> CreditCardService:
    return CreditCardService(CreditCardRepository(db))


def get_credit_card_period_service(db: Annotated[AsyncSession, Depends(get_db)]) -> CreditCardPeriodService:
    return CreditCardPeriodService(CreditCardPeriodRepository(db))


def get_credit_card_transaction_service(db: Annotated[AsyncSession, Depends(get_db)]) -> CreditCardTransactionService:
    return CreditCardTransactionService(CreditCardTransactionRepository(db), TransactionRepository(db))


def get_credit_card_payment_service(db: Annotated[AsyncSession, Depends(get_db)]) -> CreditCardPaymentService:
    return CreditCardPaymentService(CreditCardPaymentRepository(db))
