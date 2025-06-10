from typing import Any

from ..agent_tasks.layer1_infra.utils.supabase_helpers import get_supabase
from ..agent_tasks.orch.apply_diff_blocks import apply_diffs
from ..agent_tasks.orch.orch_block_diff_agent import run as diff_blocks


async def handle_event(event: dict[str, Any]) -> dict[str, Any]:
    """Handle `basket_inputs.created` events from Supabase."""
    supabase = get_supabase()

    if "record" in event:
        record = event["record"]
    elif isinstance(event, dict) and "input" in event and "input_id" in event["input"]:
        input_id = event["input"]["input_id"]
        resp = supabase.table("basket_inputs").select("*").eq("id", input_id).single().execute()
        if not resp.data:
            raise ValueError("Invalid input_id: unable to fetch basket input")
        record = resp.data
    else:
        raise ValueError("Invalid event: missing record or input_id")

    basket_id = record["basket_id"]

    diffs = diff_blocks(basket_id)

    result = await apply_diffs(basket_id=basket_id, diffs=diffs, dry_run=False)

    return {"status": "parsed_and_applied", "basket_id": basket_id, "result": result}
