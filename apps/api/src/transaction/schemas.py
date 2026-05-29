from pydantic import BaseModel, model_validator
from datetime import datetime, timezone
from typing import Optional, Literal, Any, List


def _to_utc(data: Any) -> Any:
    """Ensure all datetime fields are timezone-aware UTC."""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                if value.tzinfo is None:
                    data[key] = value.replace(tzinfo=timezone.utc)
                else:
                    data[key] = value.astimezone(timezone.utc)
    return data


class TransactionBase(BaseModel):
    account_id: Optional[str] = None
    type: Literal["income", "expense", "transfer", "saving", "credit_card_charge"]
    amount: float
    date: datetime
    category_id: Optional[str] = None
    description: Optional[str] = None
    is_recurring: bool = False
    recurrence: Optional[Literal["none", "weekly", "monthly"]] = None
    transfer_to_account_id: Optional[str] = None
    credit_card_payment_id: Optional[str] = None
    loan_payment_id: Optional[str] = None
    saving_goal_id: Optional[str] = None
    credit_card_transaction_id: Optional[str] = None
    recurrence_day_of_month: Optional[int] = None
    parent_transaction_id: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_datetimes(cls, data: Any) -> Any:
        return _to_utc(data)


class TransactionCreate(TransactionBase):
    user_id: str = ""


class TransactionUpdate(BaseModel):
    category_id: Optional[str] = None
    type: Optional[Literal["income", "expense", "transfer", "saving", "credit_card_charge"]] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    is_recurring: Optional[bool] = None
    recurrence: Optional[Literal["none", "weekly", "monthly"]] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_datetimes(cls, data: Any) -> Any:
        return _to_utc(data)


class TransactionResponse(TransactionBase):
    id: str
    user_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_generated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TransactionPageResponse(BaseModel):
    items: List[TransactionResponse]
    next_token: Optional[str] = None


class MonthlyStat(BaseModel):
    month: int
    income: float
    expenses: float
    net: float


class MonthlyStatsResponse(BaseModel):
    year: int
    stats: List[MonthlyStat]


class CategoryStat(BaseModel):
    category_id: Optional[str] = None
    total: float
    count: int


class CategoryStatsResponse(BaseModel):
    stats: List[CategoryStat]
