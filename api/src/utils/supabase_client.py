from os import getenv
from supabase import create_client

SUPABASE_URL = getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
