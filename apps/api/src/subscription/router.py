from typing import Annotated

from fastapi import APIRouter, Depends, Request, status

from src.auth.dependencies import get_current_user
from src.user.models import UserModel
from src.subscription.schemas import CheckoutResponse, PortalResponse, SubscriptionStatusResponse
from src.subscription.services import SubscriptionService
from src.subscription.dependencies import get_subscription_service

router = APIRouter(prefix="/subscription", tags=["Subscription"])

CurrentUser = Annotated[UserModel, Depends(get_current_user)]


@router.get("/status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(current_user: CurrentUser):
    """Return the current user's plan and subscription details."""
    return current_user


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    current_user: CurrentUser,
    service: SubscriptionService = Depends(get_subscription_service),
):
    """Generate a LemonSqueezy checkout URL for upgrading to Pro."""
    url = await service.create_checkout(current_user)
    return CheckoutResponse(checkout_url=url)


@router.get("/portal", response_model=PortalResponse)
async def get_portal(
    current_user: CurrentUser,
    service: SubscriptionService = Depends(get_subscription_service),
):
    """Return the LemonSqueezy customer portal URL for managing the subscription."""
    url = await service.get_portal_url(current_user)
    return PortalResponse(portal_url=url)


@router.post("/webhook", status_code=status.HTTP_200_OK, include_in_schema=False)
async def lemonsqueezy_webhook(
    request: Request,
    service: SubscriptionService = Depends(get_subscription_service),
):
    """Receive and process LemonSqueezy webhook events (no auth — verified by HMAC)."""
    signature = request.headers.get("X-Signature", "")
    raw_body = await request.body()
    import json
    payload = json.loads(raw_body)
    await service.handle_webhook(payload, signature, raw_body)
    return {"received": True}
