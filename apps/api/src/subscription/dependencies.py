from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.user.repository import UserRepository
from src.subscription.services import SubscriptionService


def get_subscription_service(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SubscriptionService:
    user_repository = UserRepository(db)
    return SubscriptionService(user_repository)
