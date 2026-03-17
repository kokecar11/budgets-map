import hashlib
import hmac
import json
from datetime import datetime
from typing import Optional

import httpx
from fastapi import HTTPException, status

from src.core.settings import get_settings
from src.user.models import UserModel
from src.user.repository import UserRepository


class SubscriptionService:

    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository
        self.settings = get_settings()

    async def create_checkout(self, user: UserModel) -> str:
        """Create a LemonSqueezy checkout URL for the Pro plan."""
        headers = {
            "Authorization": f"Bearer {self.settings.LEMONSQUEEZY_API_KEY}",
            "Accept": "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
        }
        payload = {
            "data": {
                "type": "checkouts",
                "attributes": {
                    "checkout_data": {
                        "email": user.email,
                        "name": user.name,
                        "custom": {"user_id": user.id},
                    },
                    "product_options": {
                        "redirect_url": f"{self.settings.APP_URL}/settings/billing",
                    },
                },
                "relationships": {
                    "store": {
                        "data": {
                            "type": "stores",
                            "id": str(self.settings.LEMONSQUEEZY_STORE_ID),
                        }
                    },
                    "variant": {
                        "data": {
                            "type": "variants",
                            "id": str(self.settings.LEMONSQUEEZY_PRO_VARIANT_ID),
                        }
                    },
                },
            }
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.lemonsqueezy.com/v1/checkouts",
                headers=headers,
                json=payload,
            )

        if response.status_code not in (200, 201):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to create LemonSqueezy checkout",
            )

        return response.json()["data"]["attributes"]["url"]

    async def get_portal_url(self, user: UserModel) -> str:
        """Retrieve the LemonSqueezy customer portal URL."""
        if not user.lemon_squeezy_subscription_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active subscription found",
            )

        headers = {
            "Authorization": f"Bearer {self.settings.LEMONSQUEEZY_API_KEY}",
            "Accept": "application/vnd.api+json",
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.lemonsqueezy.com/v1/subscriptions/{user.lemon_squeezy_subscription_id}",
                headers=headers,
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to retrieve subscription from LemonSqueezy",
            )

        return response.json()["data"]["attributes"]["urls"]["customer_portal"]

    async def handle_webhook(self, payload: dict, signature: str, raw_body: bytes) -> None:
        """Verify HMAC signature and process a LemonSqueezy webhook event."""
        self._verify_signature(raw_body, signature)

        event_name = payload.get("meta", {}).get("event_name", "")
        custom_data = payload.get("meta", {}).get("custom_data", {})
        user_id = custom_data.get("user_id") if custom_data else None

        if not user_id:
            return

        user = await self.user_repository.get_by_id(user_id)
        if not user:
            return

        data_obj = payload.get("data", {})
        attributes = data_obj.get("attributes", {})
        subscription_id = str(data_obj.get("id", ""))
        customer_id = str(attributes.get("customer_id", ""))

        if event_name in ("subscription_created", "subscription_resumed"):
            user.plan = "pro"
            user.subscription_status = "active"
            user.lemon_squeezy_subscription_id = subscription_id
            user.lemon_squeezy_customer_id = customer_id
            user.subscription_ends_at = None

        elif event_name == "subscription_updated":
            user.subscription_status = attributes.get("status", user.subscription_status)

        elif event_name == "subscription_cancelled":
            user.subscription_status = "cancelled"
            ends_at = attributes.get("ends_at")
            if ends_at:
                user.subscription_ends_at = datetime.fromisoformat(
                    ends_at.replace("Z", "+00:00")
                )

        elif event_name == "subscription_expired":
            user.plan = "free"
            user.subscription_status = "expired"
            user.lemon_squeezy_subscription_id = None

        await self.user_repository.db.flush()

    def _verify_signature(self, raw_body: bytes, signature: str) -> None:
        secret = self.settings.LEMONSQUEEZY_WEBHOOK_SECRET.encode()
        expected = hmac.new(secret, raw_body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook signature",
            )
