import logging
from app.event_bus import subscribe
from services.manager import run_manager_plan

log = logging.getLogger(__name__)

async def consume_dump_created(db):
    async with subscribe(['dump.created']) as queue:
        while True:
            evt = await queue.get()
            try:
                p = evt['payload']
                req = {"mode": "evolve_turn", "focus": "interpretation", "dump_id": p["dump_id"]}
                workspace_id = p.get("workspace_id") or ""
                await run_manager_plan(db, p["basket_id"], req, workspace_id)

            except Exception:
                log.exception("dump.created handler failed")
