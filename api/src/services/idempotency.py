from typing import Optional

async def already_processed(db, request_id: str) -> bool:
    row = await db.fetch_one("SELECT request_id FROM idempotency_keys WHERE request_id = $1", [request_id])
    return row is not None

async def mark_processed(db, request_id: str, delta_id: str) -> None:
    await db.execute(
        "INSERT INTO idempotency_keys (request_id, delta_id) VALUES ($1, $2) ON CONFLICT (request_id) DO NOTHING",
        [request_id, delta_id],
    )

async def fetch_delta_by_request_id(db, request_id: str) -> Optional[dict]:
    row = await db.fetch_one(
        """
        SELECT d.payload
        FROM idempotency_keys k
        JOIN basket_deltas d ON d.delta_id = k.delta_id
        WHERE k.request_id = $1
        """,
        [request_id],
    )
    return dict(row["payload"]) if row else None
