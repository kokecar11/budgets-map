from fastapi import APIRouter, Depends, status
from typing import Annotated, List

from src.auth.dependencies import get_current_user
from src.user.models import UserModel
from src.credit_card.schemas import (
    CreditCardCreate, CreditCardUpdate, CreditCardResponse,
    CreditCardPeriodCreate, CreditCardPeriodUpdate, CreditCardPeriodResponse,
    CreditCardTransactionCreate, CreditCardTransactionUpdate, CreditCardTransactionResponse,
    CreditCardPaymentCreate, CreditCardPaymentUpdate, CreditCardPaymentResponse,
    MigrateTransactionsResponse,
)
from src.credit_card.services import (
    CreditCardService, CreditCardPeriodService,
    CreditCardTransactionService, CreditCardPaymentService,
)
from src.credit_card.dependencies import (
    get_credit_card_service, get_credit_card_period_service,
    get_credit_card_transaction_service, get_credit_card_payment_service,
)

router = APIRouter(prefix="/credit-cards", tags=["Credit Cards"])

CurrentUser = Annotated[UserModel, Depends(get_current_user)]


# --- Credit Cards ---

@router.get("", response_model=List[CreditCardResponse])
async def list_credit_cards(
    current_user: CurrentUser,
    service: CreditCardService = Depends(get_credit_card_service),
):
    return await service.get_by_user(current_user.id)


@router.get("/{id}", response_model=CreditCardResponse)
async def get_credit_card(
    id: str,
    _: CurrentUser,
    service: CreditCardService = Depends(get_credit_card_service),
):
    return await service.get_or_404(id)


@router.post("", response_model=CreditCardResponse, status_code=status.HTTP_201_CREATED)
async def create_credit_card(
    data: CreditCardCreate,
    current_user: CurrentUser,
    service: CreditCardService = Depends(get_credit_card_service),
):
    data.user_id = current_user.id
    return await service.create(data)


@router.patch("/{id}", response_model=CreditCardResponse)
async def update_credit_card(
    id: str,
    data: CreditCardUpdate,
    _: CurrentUser,
    service: CreditCardService = Depends(get_credit_card_service),
):
    return await service.update(id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_credit_card(
    id: str,
    _: CurrentUser,
    service: CreditCardService = Depends(get_credit_card_service),
):
    await service.delete(id)


# --- Periods ---

@router.get("/{credit_card_id}/periods", response_model=List[CreditCardPeriodResponse])
async def list_periods(
    credit_card_id: str,
    _: CurrentUser,
    service: CreditCardPeriodService = Depends(get_credit_card_period_service),
):
    return await service.get_by_credit_card(credit_card_id)


@router.post("/{credit_card_id}/periods", response_model=CreditCardPeriodResponse, status_code=status.HTTP_201_CREATED)
async def create_period(
    credit_card_id: str,
    data: CreditCardPeriodCreate,
    _: CurrentUser,
    service: CreditCardPeriodService = Depends(get_credit_card_period_service),
):
    data.credit_card_id = credit_card_id
    return await service.create(data)


@router.patch("/periods/{id}", response_model=CreditCardPeriodResponse)
async def update_period(
    id: str,
    data: CreditCardPeriodUpdate,
    _: CurrentUser,
    service: CreditCardPeriodService = Depends(get_credit_card_period_service),
):
    return await service.update(id, data)


@router.delete("/periods/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_period(
    id: str,
    _: CurrentUser,
    service: CreditCardPeriodService = Depends(get_credit_card_period_service),
):
    await service.delete(id)


# --- Transactions ---

@router.get("/{credit_card_id}/transactions", response_model=List[CreditCardTransactionResponse])
async def list_cc_transactions(
    credit_card_id: str,
    _: CurrentUser,
    service: CreditCardTransactionService = Depends(get_credit_card_transaction_service),
):
    return await service.get_by_credit_card(credit_card_id)


@router.post("/{credit_card_id}/transactions", response_model=CreditCardTransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_cc_transaction(
    credit_card_id: str,
    data: CreditCardTransactionCreate,
    current_user: CurrentUser,
    service: CreditCardTransactionService = Depends(get_credit_card_transaction_service),
):
    data.credit_card_id = credit_card_id
    return await service.create(data, current_user.id)


@router.post("/{credit_card_id}/transactions/migrate", response_model=MigrateTransactionsResponse)
async def migrate_cc_transactions(
    credit_card_id: str,
    current_user: CurrentUser,
    service: CreditCardTransactionService = Depends(get_credit_card_transaction_service),
):
    count = await service.migrate_transactions(credit_card_id, current_user.id)
    return MigrateTransactionsResponse(count=count)


@router.patch("/transactions/{id}", response_model=CreditCardTransactionResponse)
async def update_cc_transaction(
    id: str,
    data: CreditCardTransactionUpdate,
    _: CurrentUser,
    service: CreditCardTransactionService = Depends(get_credit_card_transaction_service),
):
    return await service.update(id, data)


@router.delete("/transactions/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cc_transaction(
    id: str,
    _: CurrentUser,
    service: CreditCardTransactionService = Depends(get_credit_card_transaction_service),
):
    await service.delete(id)


# --- Payments ---

@router.get("/{credit_card_id}/payments", response_model=List[CreditCardPaymentResponse])
async def list_cc_payments(
    credit_card_id: str,
    _: CurrentUser,
    service: CreditCardPaymentService = Depends(get_credit_card_payment_service),
):
    return await service.get_by_credit_card(credit_card_id)


@router.post("/{credit_card_id}/payments", response_model=CreditCardPaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_cc_payment(
    credit_card_id: str,
    data: CreditCardPaymentCreate,
    _: CurrentUser,
    service: CreditCardPaymentService = Depends(get_credit_card_payment_service),
):
    data.credit_card_id = credit_card_id
    return await service.create(data)


@router.patch("/payments/{id}", response_model=CreditCardPaymentResponse)
async def update_cc_payment(
    id: str,
    data: CreditCardPaymentUpdate,
    _: CurrentUser,
    service: CreditCardPaymentService = Depends(get_credit_card_payment_service),
):
    return await service.update(id, data)


@router.delete("/payments/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cc_payment(
    id: str,
    _: CurrentUser,
    service: CreditCardPaymentService = Depends(get_credit_card_payment_service),
):
    await service.delete(id)
