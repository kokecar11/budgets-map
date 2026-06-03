from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Budgets Map API"
    version: str = "0.1.0-beta"
    HOST: str
    DATABASE_URL: str
    ALLOWED_HOSTS: list[str]
    SECRET_KEY: str
    ALGORITHM: str
    OPENAI_API_KEY: str
    SUPABASE_URL: str
    SUPABASE_KEY: str
    APP_URL: str = "http://localhost:3000"
    REDIS_URL: str = "redis://localhost:6379/0"
    # LemonSqueezy
    LEMONSQUEEZY_API_KEY: str = ""
    LEMONSQUEEZY_STORE_ID: str = ""
    LEMONSQUEEZY_PRO_VARIANT_ID: str = ""
    LEMONSQUEEZY_WEBHOOK_SECRET: str = ""
    # Receipt scan (LLM)
    OPENAI_SCAN_TEXT_MODEL: str = "gpt-4.1-nano"
    OPENAI_SCAN_VISION_MODEL: str = "gpt-4.1-mini"
    RECEIPT_SCAN_MONTHLY_CAP: int = 100
    OPENAI_SCAN_TIMEOUT: float = 20.0
    model_config = SettingsConfigDict(env_file="./.env")


@lru_cache()
def get_settings():
    return Settings()
