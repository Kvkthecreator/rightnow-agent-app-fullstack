from typing import Any, Dict, List
import uuid

from ..agent_tasks.layer1_infra.utils.supabase_helpers import get_supabase
from ..agent_tasks.orch.orch_basket_parser_agent import run as parse_blocks


def _fetch_artifacts(supabase, basket_id: str) -> List[Dict[str, Any]]:
    resp = (
        supabase.table("dump_artifacts")
        .select("*")
        .eq("basket_id", basket_id)
        .execute()
    )
    return resp.data or []


def _fetch_basket_user(supabase, basket_id: str) -> str:
    resp = (
        supabase.table("baskets")
        .select("user_id")
        .eq("id", basket_id)
        .maybe_single()
        .execute()
    )
    if not resp.data:
        raise ValueError("basket not found")
    return resp.data["user_id"]


async def handle_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle `basket_inputs.created` events from Supabase."""
    supabase = get_supabase()
    basket_id = event.get("record", {}).get("basket_id")
    if not basket_id:
        raise ValueError("basket_id missing from event payload")

    user_id = _fetch_basket_user(supabase, basket_id)
    artifacts = _fetch_artifacts(supabase, basket_id)

    blocks = parse_blocks(basket_id, artifacts, user_id)

    count = 0
    for block in blocks:
        data = block.model_dump()
        if not data.get("id"):
            data["id"] = str(uuid.uuid4())
        supabase.table("context_blocks").insert(data).execute()
        count += 1

    print(f"Inserted {count} context_blocks for basket {basket_id}")
    return {"status": "parsed", "count": count}
