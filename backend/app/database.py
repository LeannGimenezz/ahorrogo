from supabase import acreate_client, AsyncClient
from supabase.lib.client_options import AsyncClientOptions
from app.config import get_settings

settings = get_settings()

supabase_client: AsyncClient = None


async def get_supabase_client() -> AsyncClient:
    global supabase_client
    if supabase_client is None:
        options = AsyncClientOptions(
            auto_refresh_token=True,
            persist_session=True,
        )
        api_key = settings.supabase_service_role_key or settings.supabase_anon_key
        supabase_client = await acreate_client(
            supabase_url=settings.supabase_url,
            supabase_key=api_key,
            options=options,
        )
    return supabase_client


async def get_service_client() -> AsyncClient:
    options = AsyncClientOptions(
        auto_refresh_token=False,
        persist_session=False,
    )
    return await acreate_client(
        supabase_url=settings.supabase_url,
        supabase_key=settings.supabase_service_role_key,
        options=options,
    )
