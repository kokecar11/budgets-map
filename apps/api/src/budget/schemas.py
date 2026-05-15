from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum


# --- Budget ---

class BudgetBase(BaseModel):
    name: str
    month: int
    year: int
    description: Optional[str] = None
    alert_warning_pct: int = 80
    alert_danger_pct: int = 100


class BudgetCreate(BudgetBase):
    user_id: str = ""


class BudgetUpdate(BaseModel):
    name: Optional[str] = None
    month: Optional[int] = None
    year: Optional[int] = None
    description: Optional[str] = None
    alert_warning_pct: Optional[int] = None
    alert_danger_pct: Optional[int] = None


class BudgetResponse(BudgetBase):
    id: str
    user_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# --- BudgetItem ---

class BudgetItemBase(BaseModel):
    description: str
    planned_amount: float
    is_paid: bool = False
    category_id: Optional[str] = None
    transaction_id: Optional[str] = None


class BudgetItemCreate(BudgetItemBase):
    budget_id: str = ""


class BudgetItemUpdate(BaseModel):
    description: Optional[str] = None
    planned_amount: Optional[float] = None
    is_paid: Optional[bool] = None
    category_id: Optional[str] = None
    transaction_id: Optional[str] = None


class BudgetItemResponse(BudgetItemBase):
    id: str
    budget_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class BudgetItemWithActual(BudgetItemResponse):
    actual_amount: Optional[float] = None
    difference: Optional[float] = None


class AlertStatus(str, Enum):
    ok = "ok"
    warning = "warning"
    over_budget = "over_budget"


class BudgetSummaryResponse(BaseModel):
    total_planned: float
    total_actual: float
    alert_status: AlertStatus
