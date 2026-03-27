from supabase import create_client, AsyncClient
from supabase.lib.client_options import ClientOptions
from app.config import get_settings

settings = get_settings()

supabase_client: AsyncClient = None


async def get_supabase_client() -> AsyncClient:
    global supabase_client
    if supabase_client is None:
        options = ClientOptions(
            auto_refresh_token=True,
            persist_session=True,
        )
        supabase_client = create_client(
            supabase_url=settings.supabase_url,
            supabase_key=settings.supabase_anon_key,
            options=options,
        )
    return supabase_client


async def get_service_client() -> AsyncClient:
    options = ClientOptions(
        auto_refresh_token=False,
        persist_session=False,
    )
    return create_client(
        supabase_url=settings.supabase_url,
        supabase_key=settings.supabase_service_role_key,
        options=options,
    )
