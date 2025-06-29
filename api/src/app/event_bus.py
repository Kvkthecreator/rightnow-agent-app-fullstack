import asyncio
import json
import os
from contextlib import asynccontextmanager
import logging

import asyncpg

log = logging.getLogger("uvicorn.error")

DATABASE_URL = os.getenv("EVENT_BUS_DATABASE_URL")  # use dedicated direct connection
LISTEN_CHANNEL = "bus_any"  # single physical channel

POOL: asyncpg.Pool | None = None

async def init_pool() -> None:
    """Initialize the asyncpg connection pool lazily."""
    global POOL
    if POOL is None:
        POOL = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=1,
            max_size=5,
        )


class Event:
    def __init__(self, topic: str, payload: dict):
        self.topic = topic
        self.payload = payload


# ---------- emitter ---------- #
async def emit(topic: str, payload: dict) -> None:
    """Insert into events table and rely on trigger to NOTIFY."""
    try:
        await init_pool()
        async with POOL.acquire() as conn:
            await conn.execute(
                "insert into public.events(topic, payload) values($1, $2)",
                topic,
                json.dumps(payload),
            )
    except Exception:
        log.exception("Event bus emit failed for topic %s", topic)
        raise


async def publish_event(topic: str, payload: dict) -> None:
    try:
        await emit(topic, payload)
    except Exception as e:
        log.error("[EVENT BUS] Failed to publish event: %s", e)


# ---------- subscriber ---------- #
@asynccontextmanager
async def subscribe(topics: list[str]):
    """
    Usage:
        async with subscribe(['block.audit_report']) as queue:
            while True:
                evt = await queue.get()
    """
    q: asyncio.Queue[Event] = asyncio.Queue()
    await init_pool()
    callback = lambda *_, payload: asyncio.create_task(_dispatch(payload, topics, q))
    conn = None
    try:
        conn = await POOL.acquire()
        await conn.add_listener(LISTEN_CHANNEL, callback)
        yield q
    except Exception:
        log.exception("Event bus subscription failed")
        raise
    finally:
        if conn:
            await conn.remove_listener(LISTEN_CHANNEL, callback)
            await POOL.release(conn)


async def _dispatch(raw: str, topics: list[str], q: asyncio.Queue):
    try:
        msg = json.loads(raw)
        if msg.get("topic") in topics:
            await q.put(Event(msg["topic"], msg["payload"]))
    except Exception:
        log.warning("Failed to dispatch event payload: %s", raw)
