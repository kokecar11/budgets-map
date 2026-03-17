from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SubscriptionStatusResponse(BaseModel):
    plan: str
    subscription_status: Optional[str] = None
    subscription_ends_at: Optional[datetime] = None
    lemon_squeezy_customer_id: Optional[str] = None

    model_config = {"from_attributes": True}


class CheckoutResponse(BaseModel):
    checkout_url: str


class PortalResponse(BaseModel):
    portal_url: str
