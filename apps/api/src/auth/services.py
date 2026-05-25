from fastapi import HTTPException, status
from supabase_auth.errors import AuthApiError
from supabase import AsyncClient

from src.user.models import UserModel
from src.user.repository import UserRepository
from src.auth.schemas import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    IdTokenSignInRequest,
    RefreshTokenRequest,
    ResetPasswordRequest,
    SignInRequest,
    SignUpRequest,
    TokenResponse,
)


class AuthService:

    def __init__(self, supabase: AsyncClient, user_repository: UserRepository):
        self.supabase = supabase
        self.user_repository = user_repository

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _build_token_response(
        self,
        session,
        user_id: str,
        email: str,
        name: str = "",
        currency: str = "COP",
        plan: str = "free",
    ) -> TokenResponse:
        return TokenResponse(
            access_token=session.access_token,
            refresh_token=session.refresh_token,
            token_type="bearer",
            expires_in=session.expires_in,
            user_id=user_id,
            email=email,
            name=name,
            currency=currency,
            plan=plan,
        )

    async def _sync_user(
        self,
        supabase_user_id: str,
        email: str,
        name: str,
        currency: str = "COP",
    ) -> UserModel:
        """Get or create a local DB user record linked to the Supabase user."""
        local_user = await self.user_repository.get_by_id(supabase_user_id)
        if local_user:
            return local_user

        local_user = await self.user_repository.get_by_email(email)
        if local_user:
            return local_user

        user = UserModel(
            id=supabase_user_id,
            name=name,
            email=email,
            currency=currency,
        )
        self.user_repository.db.add(user)
        await self.user_repository.db.flush()
        await self.user_repository.db.refresh(user)
        return user

    # ------------------------------------------------------------------
    # Auth operations
    # ------------------------------------------------------------------

    async def sign_up(self, data: SignUpRequest) -> TokenResponse:
        try:
            response = await self.supabase.auth.sign_up(
                {
                    "email": data.email,
                    "password": data.password,
                    "options": {"data": {"name": data.name, "currency": data.currency}},
                }
            )
        except AuthApiError as e:
            raise HTTPException(status_code=e.status or 400, detail=e.message)

        if not response.user:
            raise HTTPException(status_code=400, detail="Sign up failed")

        supabase_user = response.user

        if not response.session:
            # Email confirmation required — no session yet
            return TokenResponse(
                access_token="",
                refresh_token="",
                expires_in=0,
                user_id=str(supabase_user.id),
                email=str(supabase_user.email),
                requires_confirmation=True,
            )

        local_user = await self._sync_user(
            supabase_user_id=str(supabase_user.id),
            email=str(supabase_user.email),
            name=data.name,
            currency=data.currency,
        )
        await self.user_repository.db.commit()

        return self._build_token_response(
            session=response.session,
            user_id=str(supabase_user.id),
            email=str(supabase_user.email),
            name=local_user.name,
            currency=local_user.currency,
            plan=local_user.plan,
        )

    async def sign_in(self, data: SignInRequest) -> TokenResponse:
        try:
            response = await self.supabase.auth.sign_in_with_password(
                {"email": data.email, "password": data.password}
            )
        except AuthApiError as e:
            raise HTTPException(status_code=e.status or 401, detail=e.message)

        if not response.session or not response.user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        supabase_user = response.user
        meta = supabase_user.user_metadata or {}

        local_user = await self._sync_user(
            supabase_user_id=str(supabase_user.id),
            email=str(supabase_user.email),
            name=meta.get("name", str(supabase_user.email).split("@")[0]),
            currency=meta.get("currency", "COP"),
        )
        await self.user_repository.db.commit()

        return self._build_token_response(
            session=response.session,
            user_id=str(supabase_user.id),
            email=str(supabase_user.email),
            name=local_user.name,
            currency=local_user.currency,
            plan=local_user.plan,
        )

    async def sign_in_with_id_token(self, data: IdTokenSignInRequest) -> TokenResponse:
        """
        Exchange a native Apple or Google ID token for a Supabase session.
        Used by iOS (Sign in with Apple / Google) and Android (Google Sign-In).
        """
        try:
            credentials: dict = {"provider": data.provider, "token": data.id_token}
            if data.nonce:
                credentials["nonce"] = data.nonce

            response = await self.supabase.auth.sign_in_with_id_token(credentials)
        except AuthApiError as e:
            raise HTTPException(status_code=e.status or 401, detail=e.message)

        if not response.session or not response.user:
            raise HTTPException(status_code=401, detail="OAuth sign-in failed")

        supabase_user = response.user
        meta = supabase_user.user_metadata or {}

        name = (
            data.name
            or meta.get("full_name")
            or meta.get("name")
            or str(supabase_user.email).split("@")[0]
        )

        local_user = await self._sync_user(
            supabase_user_id=str(supabase_user.id),
            email=str(supabase_user.email),
            name=name,
            currency=data.currency,
        )
        await self.user_repository.db.commit()

        return self._build_token_response(
            session=response.session,
            user_id=str(supabase_user.id),
            email=str(supabase_user.email),
            name=local_user.name,
            currency=local_user.currency,
            plan=local_user.plan,
        )

    async def refresh_session(self, data: RefreshTokenRequest) -> TokenResponse:
        try:
            response = await self.supabase.auth.refresh_session(data.refresh_token)
        except AuthApiError as e:
            raise HTTPException(status_code=e.status or 401, detail=e.message)

        if not response.session or not response.user:
            raise HTTPException(status_code=401, detail="Session refresh failed")

        return self._build_token_response(
            session=response.session,
            user_id=str(response.user.id),
            email=str(response.user.email),
        )

    async def confirm_email(self, token_hash: str, type: str) -> TokenResponse:
        """Verify an OTP token_hash from a confirmation email and return a session."""
        try:
            response = await self.supabase.auth.verify_otp(
                {"token_hash": token_hash, "type": type}
            )
        except AuthApiError as e:
            status_code = e.status or 400
            raise HTTPException(status_code=status_code, detail=e.message)

        if not response.session or not response.user:
            raise HTTPException(status_code=400, detail="Confirmation failed")

        supabase_user = response.user
        meta = supabase_user.user_metadata or {}

        local_user = await self._sync_user(
            supabase_user_id=str(supabase_user.id),
            email=str(supabase_user.email),
            name=meta.get("name", str(supabase_user.email).split("@")[0]),
            currency=meta.get("currency", "COP"),
        )
        await self.user_repository.db.commit()

        return self._build_token_response(
            session=response.session,
            user_id=str(supabase_user.id),
            email=str(supabase_user.email),
            name=local_user.name,
            currency=local_user.currency,
            plan=local_user.plan,
        )

    async def sign_out(self, access_token: str, refresh_token: str) -> None:
        """Invalidate the user session on Supabase (server-side sign-out)."""
        try:
            await self.supabase.auth.set_session(access_token, refresh_token)
            await self.supabase.auth.sign_out()
        except AuthApiError as e:
            raise HTTPException(status_code=e.status or 500, detail=e.message)

    async def forgot_password(self, data: ForgotPasswordRequest) -> ForgotPasswordResponse:
        """Send a password reset email. Always returns ok to prevent email enumeration."""
        try:
            await self.supabase.auth.reset_password_for_email(
                data.email, {"redirect_to": data.redirect_to}
            )
        except AuthApiError:
            pass
        return ForgotPasswordResponse()

    async def reset_password(self, data: ResetPasswordRequest) -> TokenResponse:
        """Set session from recovery tokens, update password, and return a fresh session."""
        try:
            response = await self.supabase.auth.set_session(data.access_token, data.refresh_token)
        except AuthApiError:
            raise HTTPException(status_code=400, detail="EXPIRED_OR_INVALID_TOKEN")

        if not response.session or not response.user:
            raise HTTPException(status_code=400, detail="EXPIRED_OR_INVALID_TOKEN")

        session = response.session
        supabase_user = response.user

        try:
            await self.supabase.auth.update_user({"password": data.new_password})
        except AuthApiError as e:
            raise HTTPException(status_code=e.status or 400, detail=e.message)

        meta = supabase_user.user_metadata or {}
        local_user = await self._sync_user(
            supabase_user_id=str(supabase_user.id),
            email=str(supabase_user.email),
            name=meta.get("name", str(supabase_user.email).split("@")[0]),
            currency=meta.get("currency", "COP"),
        )
        await self.user_repository.db.commit()

        return self._build_token_response(
            session=session,
            user_id=str(supabase_user.id),
            email=str(supabase_user.email),
            name=local_user.name,
            currency=local_user.currency,
            plan=local_user.plan,
        )
