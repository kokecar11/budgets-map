from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal


class AccountBase(BaseModel):
    name: str
    type: Literal["bank", "cash", "digital_wallet"]
    balance: float = 0
    is_active: bool = True


class AccountCreate(AccountBase):
    user_id: str = ""


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[Literal["bank", "cash", "digital_wallet"]] = None
    is_active: Optional[bool] = None


class AccountResponse(AccountBase):
    id: str
    user_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
