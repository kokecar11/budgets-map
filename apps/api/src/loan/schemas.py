from pydantic import BaseModel, model_validator
from datetime import datetime, timezone
from typing import Optional, Literal, Any


def _to_utc(data: Any) -> Any:
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                if value.tzinfo is None:
                    data[key] = value.replace(tzinfo=timezone.utc)
                else:
                    data[key] = value.astimezone(timezone.utc)
    return data


# --- Loan ---

class LoanBase(BaseModel):
    name: str
    lender: str
    principal: float
    balance: float
    interest_rate: float
    monthly_payment: float
    start_date: datetime
    end_date: datetime
    payment_day: int
    status: Literal["active", "paid", "defaulted"] = "active"

    @model_validator(mode="before")
    @classmethod
    def normalize_datetimes(cls, data: Any) -> Any:
        return _to_utc(data)


class LoanCreate(LoanBase):
    user_id: str = ""


class LoanUpdate(BaseModel):
    name: Optional[str] = None
    lender: Optional[str] = None
    balance: Optional[float] = None
    interest_rate: Optional[float] = None
    monthly_payment: Optional[float] = None
    end_date: Optional[datetime] = None
    payment_day: Optional[int] = None
    status: Optional[Literal["active", "paid", "defaulted"]] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_datetimes(cls, data: Any) -> Any:
        return _to_utc(data)


class LoanResponse(LoanBase):
    id: str
    user_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# --- LoanPayment ---

class LoanPaymentBase(BaseModel):
    amount: float
    principal_paid: float
    interest_paid: float
    date: datetime
    period: str

    @model_validator(mode="before")
    @classmethod
    def normalize_datetimes(cls, data: Any) -> Any:
        return _to_utc(data)


class LoanPaymentCreate(LoanPaymentBase):
    loan_id: str


class LoanPaymentUpdate(BaseModel):
    amount: Optional[float] = None
    principal_paid: Optional[float] = None
    interest_paid: Optional[float] = None
    date: Optional[datetime] = None
    period: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_datetimes(cls, data: Any) -> Any:
        return _to_utc(data)


class LoanPaymentResponse(LoanPaymentBase):
    id: str
    loan_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# --- LoanAmortization ---

class LoanAmortizationBase(BaseModel):
    period: str
    payment_number: int
    principal_payment: float
    interest_payment: float
    balance_after: float
    is_paid: bool = False


class LoanAmortizationCreate(LoanAmortizationBase):
    loan_id: str


class LoanAmortizationUpdate(BaseModel):
    is_paid: Optional[bool] = None
    balance_after: Optional[float] = None


class LoanAmortizationResponse(LoanAmortizationBase):
    id: str
    loan_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
