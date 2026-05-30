from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal


class FinancialRulesResponse(BaseModel):
    id: str
    user_id: str
    expense_model: Literal["accrual", "cash"]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class FinancialRulesUpdate(BaseModel):
    expense_model: Optional[Literal["accrual", "cash"]] = None
