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


class SavingGoalBase(BaseModel):
    name: str
    target_amount: float
    deadline: Optional[datetime] = None
    status: Literal["active", "completed", "cancelled"] = "active"
    description: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_datetimes(cls, data: Any) -> Any:
        return _to_utc(data)


class SavingGoalCreate(SavingGoalBase):
    user_id: str = ""


class SavingGoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    deadline: Optional[datetime] = None
    status: Optional[Literal["active", "completed", "cancelled"]] = None
    description: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_datetimes(cls, data: Any) -> Any:
        return _to_utc(data)


class SavingGoalResponse(SavingGoalBase):
    id: str
    user_id: str
    current_amount: float = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
