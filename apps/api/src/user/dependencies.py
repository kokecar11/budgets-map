from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.user.repository import UserRepository
from src.user.services import UserService


def get_user_service(db: Annotated[AsyncSession, Depends(get_db)]) -> UserService:
    user_repository = UserRepository(db)
    return UserService(user_repository)
