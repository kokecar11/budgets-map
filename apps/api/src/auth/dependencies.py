from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase_auth.errors import AuthApiError
from sqlalchemy.ext.asyncio import AsyncSession
from supabase import AsyncClient

from src.auth.services import AuthService
from src.core.database import get_db
from src.core.supabase import get_supabase_client
from src.user.models import UserModel
from src.user.repository import UserRepository

security = HTTPBearer()


async def get_auth_service(
    db: Annotated[AsyncSession, Depends(get_db)],
    supabase: Annotated[AsyncClient, Depends(get_supabase_client)],
) -> AuthService:
    user_repository = UserRepository(db)
    return AuthService(supabase, user_repository)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
    supabase: Annotated[AsyncClient, Depends(get_supabase_client)],
) -> UserModel:
    """
    Validate the Bearer token with Supabase and return the local UserModel.

    Use this as a dependency in any protected route:
        current_user: UserModel = Depends(get_current_user)
    """
    token = credentials.credentials

    try:
        user_response = await supabase.auth.get_user(token)
    except AuthApiError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user_response.user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    supabase_user_id = str(user_response.user.id)
    user_repo = UserRepository(db)
    local_user = await user_repo.get_by_id(supabase_user_id)

    if not local_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found — please sign up first",
        )

    return local_user
