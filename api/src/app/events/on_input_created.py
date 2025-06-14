# Event hook placeholder for Phase 1
# Diff application and block management removed
from typing import Any

from src.utils.logged_agent import logged


@logged("on_input_created")
async def handle_event(event: dict[str, Any]) -> dict[str, Any]:
    """Placeholder handler for `basket_inputs.created` events."""
    return {"status": "ok"}
