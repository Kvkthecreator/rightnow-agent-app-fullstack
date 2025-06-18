from uuid import UUID

from app.utils.supabase_client import supabase_client as supabase


def run(basket_id: UUID) -> dict:
    """Scan blocks for CIL violations (placeholder)."""
    supabase.table("context_blocks").select("id").eq("basket_id", str(basket_id)).execute()
    return {"status": "ok"}
