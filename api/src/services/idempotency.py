async def already_processed(db, request_id: str) -> bool:
    query = "SELECT 1 FROM idempotency_keys WHERE request_id = :request_id"
    result = await db.fetch_one(query, {"request_id": request_id})
    return result is not None

async def mark_processed(db, request_id: str, delta_id: str) -> None:
    query = """
        INSERT INTO idempotency_keys (request_id, delta_id, created_at) 
        VALUES (:request_id, :delta_id, NOW())
        ON CONFLICT (request_id) DO NOTHING
    """
    await db.execute(query, {"request_id": request_id, "delta_id": delta_id})

async def fetch_delta_by_request_id(db, request_id: str):
    query = """
        SELECT bd.* FROM basket_deltas bd
        JOIN idempotency_keys ik ON ik.delta_id = bd.delta_id
        WHERE ik.request_id = :request_id
    """
    return await db.fetch_one(query, {"request_id": request_id})
