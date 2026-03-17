from supabase import acreate_client, AsyncClient
from src.core.settings import get_settings


async def get_supabase_client() -> AsyncClient:
    settings = get_settings()
    return await acreate_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
