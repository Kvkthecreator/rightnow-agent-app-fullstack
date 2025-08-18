import os
import logging
from supabase import create_client, Client

log = logging.getLogger("uvicorn.error")

SUPABASE_URL = os.environ["SUPABASE_URL"]
ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

def supabase_admin() -> Client:
    if not SERVICE_ROLE_KEY:
        log.error("SUPABASE_SERVICE_ROLE_KEY missing")
        raise RuntimeError("supabase_admin_misconfigured")
    log.info("SB: admin client init (url=%s)", SUPABASE_URL)
    return create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

def supabase_user(access_token: str) -> Client:
    if not ANON_KEY:
        log.error("SUPABASE_ANON_KEY missing")
        raise RuntimeError("supabase_user_misconfigured")
    client = create_client(SUPABASE_URL, ANON_KEY)
    client.postgrest.auth(access_token)
    return client