from fastapi import APIRouter, Depends, status
from typing import Annotated, List

from src.auth.dependencies import get_current_user
from src.user.models import UserModel
from src.loan.schemas import (
    LoanCreate, LoanUpdate, LoanResponse,
    LoanPaymentCreate, LoanPaymentUpdate, LoanPaymentResponse,
    LoanAmortizationCreate, LoanAmortizationUpdate, LoanAmortizationResponse,
)
from src.loan.services import LoanService, LoanPaymentService, LoanAmortizationService
from src.loan.dependencies import get_loan_service, get_loan_payment_service, get_loan_amortization_service

router = APIRouter(prefix="/loans", tags=["Loans"])

CurrentUser = Annotated[UserModel, Depends(get_current_user)]


# --- Loans ---

@router.get("/", response_model=List[LoanResponse])
async def list_loans(
    current_user: CurrentUser,
    service: LoanService = Depends(get_loan_service),
):
    return await service.get_by_user(current_user.id)


@router.get("/{id}", response_model=LoanResponse)
async def get_loan(
    id: str,
    _: CurrentUser,
    service: LoanService = Depends(get_loan_service),
):
    return await service.get_or_404(id)


@router.post("/", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
async def create_loan(
    data: LoanCreate,
    current_user: CurrentUser,
    service: LoanService = Depends(get_loan_service),
):
    data.user_id = current_user.id
    return await service.create(data)


@router.patch("/{id}", response_model=LoanResponse)
async def update_loan(
    id: str,
    data: LoanUpdate,
    _: CurrentUser,
    service: LoanService = Depends(get_loan_service),
):
    return await service.update(id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_loan(
    id: str,
    _: CurrentUser,
    service: LoanService = Depends(get_loan_service),
):
    await service.delete(id)


# --- Loan Payments ---

@router.get("/{loan_id}/payments", response_model=List[LoanPaymentResponse])
async def list_loan_payments(
    loan_id: str,
    _: CurrentUser,
    service: LoanPaymentService = Depends(get_loan_payment_service),
):
    return await service.get_by_loan(loan_id)


@router.post("/{loan_id}/payments", response_model=LoanPaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_loan_payment(
    loan_id: str,
    data: LoanPaymentCreate,
    _: CurrentUser,
    service: LoanPaymentService = Depends(get_loan_payment_service),
):
    data.loan_id = loan_id
    return await service.create(data)


@router.patch("/payments/{id}", response_model=LoanPaymentResponse)
async def update_loan_payment(
    id: str,
    data: LoanPaymentUpdate,
    _: CurrentUser,
    service: LoanPaymentService = Depends(get_loan_payment_service),
):
    return await service.update(id, data)


@router.delete("/payments/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_loan_payment(
    id: str,
    _: CurrentUser,
    service: LoanPaymentService = Depends(get_loan_payment_service),
):
    await service.delete(id)


# --- Loan Amortization ---

@router.get("/{loan_id}/amortization", response_model=List[LoanAmortizationResponse])
async def list_loan_amortization(
    loan_id: str,
    _: CurrentUser,
    service: LoanAmortizationService = Depends(get_loan_amortization_service),
):
    return await service.get_by_loan(loan_id)


@router.post("/{loan_id}/amortization", response_model=LoanAmortizationResponse, status_code=status.HTTP_201_CREATED)
async def create_loan_amortization(
    loan_id: str,
    data: LoanAmortizationCreate,
    _: CurrentUser,
    service: LoanAmortizationService = Depends(get_loan_amortization_service),
):
    data.loan_id = loan_id
    return await service.create(data)


@router.patch("/amortization/{id}", response_model=LoanAmortizationResponse)
async def update_loan_amortization(
    id: str,
    data: LoanAmortizationUpdate,
    _: CurrentUser,
    service: LoanAmortizationService = Depends(get_loan_amortization_service),
):
    return await service.update(id, data)


@router.delete("/amortization/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_loan_amortization(
    id: str,
    _: CurrentUser,
    service: LoanAmortizationService = Depends(get_loan_amortization_service),
):
    await service.delete(id)
