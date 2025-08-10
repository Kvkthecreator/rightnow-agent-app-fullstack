import sys
import os
import json

# Add src to path for imports  
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contracts.basket import BasketDelta

async def persist_delta(db, delta: BasketDelta, request_id: str) -> None:
    payload = delta.dict()
    query = """
        INSERT INTO basket_deltas (delta_id, basket_id, payload, created_at)
        VALUES (:delta_id, :basket_id, :payload, :created_at)
    """
    await db.execute(query, {
        "delta_id": delta.delta_id,
        "basket_id": delta.basket_id,
        "payload": json.dumps(payload),
        "created_at": delta.created_at
    })

async def list_deltas(db, basket_id: str):
    query = """
        SELECT payload FROM basket_deltas 
        WHERE basket_id = :basket_id 
        ORDER BY created_at DESC
    """
    rows = await db.fetch_all(query, {"basket_id": basket_id})
    return [json.loads(row["payload"]) for row in rows]

async def try_apply_delta(db, basket_id: str, delta_id: str) -> bool:
    # For now, just mark as applied - add version checks later
    query = """
        UPDATE basket_deltas 
        SET applied_at = NOW() 
        WHERE delta_id = :delta_id AND basket_id = :basket_id
    """
    result = await db.execute(query, {"delta_id": delta_id, "basket_id": basket_id})
    return result > 0
