from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal


class CategoryBase(BaseModel):
    name: str
    type: Literal["income", "expense"]
    icon: Optional[str] = None
    color: Optional[str] = None


class CategoryCreate(CategoryBase):
    user_id: str = ""


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[Literal["income", "expense"]] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class CategoryResponse(CategoryBase):
    id: str
    user_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
