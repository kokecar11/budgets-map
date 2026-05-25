from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.auth.dependencies import get_auth_service, get_current_user
from src.auth.schemas import (
    ConfirmRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    IdTokenSignInRequest,
    RefreshTokenRequest,
    ResetPasswordRequest,
    SignInRequest,
    SignOutRequest,
    SignUpRequest,
    TokenResponse,
    UserMeResponse,
)
from src.auth.services import AuthService
from src.user.models import UserModel

router = APIRouter(prefix="/auth", tags=["Auth"])

security = HTTPBearer()


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def sign_up(
    data: SignUpRequest,
    service: AuthService = Depends(get_auth_service),
):
    """
    Register a new user with email and password.

    If Supabase email confirmation is enabled the response will have
    `requires_confirmation=true` and empty tokens — the user must confirm
    their email before signing in.
    """
    return await service.sign_up(data)


@router.post("/confirm", response_model=TokenResponse)
async def confirm_email(
    data: ConfirmRequest,
    service: AuthService = Depends(get_auth_service),
):
    """
    Confirm a user's email address using the token_hash from the confirmation link.

    The token_hash and type values are extracted from the confirmation URL that
    Supabase sends to the user's inbox. On success a full session is returned.
    """
    return await service.confirm_email(data.token_hash, data.type)


@router.post("/signin", response_model=TokenResponse)
async def sign_in(
    data: SignInRequest,
    service: AuthService = Depends(get_auth_service),
):
    """Authenticate with email and password. Returns a Supabase session."""
    return await service.sign_in(data)


@router.post("/signin/oauth", response_model=TokenResponse)
async def sign_in_with_id_token(
    data: IdTokenSignInRequest,
    service: AuthService = Depends(get_auth_service),
):
    """
    Sign in using a native Apple or Google ID token (for iOS / Android apps).

    Flow for mobile:
      1. User authenticates with Apple (ASAuthorizationAppleIDCredential) or
         Google (GoogleSignIn) on device.
      2. Mobile app sends the resulting `id_token` (+ `nonce` for Apple) here.
      3. Backend exchanges it with Supabase and returns a session.
    """
    return await service.sign_in_with_id_token(data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_session(
    data: RefreshTokenRequest,
    service: AuthService = Depends(get_auth_service),
):
    """Obtain a new access token using a valid refresh token."""
    return await service.refresh_session(data)


@router.post("/signout", status_code=status.HTTP_204_NO_CONTENT)
async def sign_out(
    data: SignOutRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    service: AuthService = Depends(get_auth_service),
):
    """
    Invalidate the current session on Supabase (server-side sign-out).
    The client must also discard the stored tokens locally.
    """
    await service.sign_out(
        access_token=credentials.credentials,
        refresh_token=data.refresh_token,
    )


@router.get("/me", response_model=UserMeResponse)
async def me(current_user: UserModel = Depends(get_current_user)):
    """Return the authenticated user's local profile."""
    return current_user


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    data: ForgotPasswordRequest,
    service: AuthService = Depends(get_auth_service),
):
    """
    Send a password reset email.

    Always returns ok regardless of whether the email exists to prevent
    email enumeration attacks.
    """
    return await service.forgot_password(data)


@router.post("/reset-password", response_model=TokenResponse)
async def reset_password(
    data: ResetPasswordRequest,
    service: AuthService = Depends(get_auth_service),
):
    """
    Verify a password-reset OTP token, set a new password, and return a fresh session.

    Returns 400 EXPIRED_OR_INVALID_TOKEN if the token_hash is invalid or expired.
    """
    return await service.reset_password(data)
