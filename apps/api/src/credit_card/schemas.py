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


# --- CreditCard ---

class CreditCardBase(BaseModel):
    alias: str
    credit_limit: float
    cutoff_day: int
    payment_day: int
    interest_rate: float


class CreditCardCreate(CreditCardBase):
    user_id: str = ""


class CreditCardUpdate(BaseModel):
    alias: Optional[str] = None
    credit_limit: Optional[float] = None
    cutoff_day: Optional[int] = None
    payment_day: Optional[int] = None
    interest_rate: Optional[float] = None


class CreditCardResponse(CreditCardBase):
    id: str
    user_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# --- CreditCardPeriod ---

class CreditCardPeriodBase(BaseModel):
    period_date: datetime
    opening_balance: float
    consumed: float
    minimum_payment: float
    total_payment: float
    closing_balance: float
    due_date: datetime

    @model_validator(mode="before")
    @classmethod
    def normalize_datetimes(cls, data: Any) -> Any:
        return _to_utc(data)


class CreditCardPeriodCreate(CreditCardPeriodBase):
    credit_card_id: str


class CreditCardPeriodUpdate(BaseModel):
    consumed: Optional[float] = None
    minimum_payment: Optional[float] = None
    total_payment: Optional[float] = None
    closing_balance: Optional[float] = None
    due_date: Optional[datetime] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_datetimes(cls, data: Any) -> Any:
        return _to_utc(data)


class CreditCardPeriodResponse(CreditCardPeriodBase):
    id: str
    credit_card_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MigrateTransactionsResponse(BaseModel):
    count: int


# --- CreditCardTransaction ---

class CreditCardTransactionBase(BaseModel):
    category_id: str
    description: str
    amount: float
    date: datetime
    installments: int = 1
    installment_number: int
    period_id: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_datetimes(cls, data: Any) -> Any:
        return _to_utc(data)


class CreditCardTransactionCreate(CreditCardTransactionBase):
    credit_card_id: str


class CreditCardTransactionUpdate(BaseModel):
    category_id: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[datetime] = None
    period_id: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_datetimes(cls, data: Any) -> Any:
        return _to_utc(data)


class CreditCardTransactionResponse(CreditCardTransactionBase):
    id: str
    credit_card_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# --- CreditCardPayment ---

class CreditCardPaymentBase(BaseModel):
    period_id: str
    amount: float
    type: Literal["minimum", "total", "partial"]
    date: datetime

    @model_validator(mode="before")
    @classmethod
    def normalize_datetimes(cls, data: Any) -> Any:
        return _to_utc(data)


class CreditCardPaymentCreate(CreditCardPaymentBase):
    credit_card_id: str


class CreditCardPaymentUpdate(BaseModel):
    amount: Optional[float] = None
    type: Optional[Literal["minimum", "total", "partial"]] = None
    date: Optional[datetime] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_datetimes(cls, data: Any) -> Any:
        return _to_utc(data)


class CreditCardPaymentResponse(CreditCardPaymentBase):
    id: str
    credit_card_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
