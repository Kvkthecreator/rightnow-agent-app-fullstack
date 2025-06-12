from fastapi import APIRouter
from importlib import import_module

try:  # noqa: WPS501
    supabase = import_module("src.utils.supabase_client").supabase_client
except ModuleNotFoundError:  # pragma: no cover - local test path
    supabase = import_module("utils.supabase_client").supabase_client

router = APIRouter(prefix="/api", tags=["blocks"])


@router.get("/baskets/{basket_id}/blocks")
def list_blocks(basket_id: str):
    resp = (
        supabase.table("context_blocks")
        .select("id,label,type,updated_at,commit_id")
        .eq("basket_id", basket_id)
        .eq("is_draft", False)
        .eq("is_superseded", False)
        .order("updated_at", desc=True)
        .execute()
    )
    return resp.data  # type: ignore[attr-defined]
