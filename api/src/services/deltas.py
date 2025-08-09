from typing import List, Dict, Any
from ..contracts.basket import BasketDelta

async def persist_delta(db, delta: BasketDelta, request_id: str) -> None:
    await db.execute(
        "INSERT INTO basket_deltas (delta_id, basket_id, payload) VALUES ($1, $2, $3)",
        [delta.delta_id, delta.basket_id, dict(delta)],
    )

async def list_deltas(db, basket_id: str) -> List[Dict[str, Any]]:
    rows = await db.fetch_all(
        "SELECT payload FROM basket_deltas WHERE basket_id = $1 ORDER BY created_at DESC",
        [basket_id],
    )
    return [dict(r["payload"]) for r in rows]

async def try_apply_delta(db, basket_id: str, delta_id: str) -> bool:
    await db.execute(
        "UPDATE basket_deltas SET applied_at = NOW() WHERE basket_id = $1 AND delta_id = $2",
        [basket_id, delta_id],
    )
    return True
