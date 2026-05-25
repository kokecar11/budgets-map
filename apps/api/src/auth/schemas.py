from pydantic import BaseModel, EmailStr
from typing import Literal, Optional


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    currency: str = "COP"


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class IdTokenSignInRequest(BaseModel):
    """
    For native Apple / Google sign-in on iOS and Android.

    Flow:
      1. Mobile app authenticates with Apple or Google natively and receives an ID token.
      2. Mobile app sends that token to POST /auth/signin/oauth.
      3. Backend exchanges it with Supabase and returns a Supabase session.
    """
    provider: Literal["google", "apple"]
    id_token: str
    nonce: Optional[str] = None  # Required by Apple Sign In
    name: Optional[str] = None
    currency: str = "COP"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class SignOutRequest(BaseModel):
    refresh_token: str


class ConfirmRequest(BaseModel):
    token_hash: str
    type: Literal["email", "signup", "recovery", "invite"]


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str
    email: str
    name: str = ""
    currency: str = "COP"
    plan: str = "free"
    requires_confirmation: bool = False


class UserMeResponse(BaseModel):
    id: str
    email: str
    name: str
    currency: str
    plan: str = "free"

    model_config = {"from_attributes": True}


class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    redirect_to: str


class ForgotPasswordResponse(BaseModel):
    message: str = "ok"


class ResetPasswordRequest(BaseModel):
    access_token: str
    refresh_token: str
    new_password: str
