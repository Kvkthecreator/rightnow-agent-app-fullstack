import asyncio
import json
import os
from contextlib import asynccontextmanager
import logging

import asyncpg

log = logging.getLogger("uvicorn.error")

DATABASE_URL = os.getenv("EVENT_BUS_DATABASE_URL")  # use dedicated direct connection
LISTEN_CHANNEL = "bus_any"  # single physical channel


class Event:
    def __init__(self, topic: str, payload: dict):
        self.topic = topic
        self.payload = payload


# ---------- emitter ---------- #
async def emit(topic: str, payload: dict) -> None:
    """Insert into events table and rely on trigger to NOTIFY."""
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        await conn.execute(
            "insert into public.events(topic, payload) values($1, $2)",
            topic,
            json.dumps(payload),
        )
        await conn.close()
    except Exception as e:
        log.exception("Event bus emit failed for topic %s", topic)
        raise


async def publish_event(topic: str, payload: dict) -> None:
    await emit(topic, payload)


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
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        await conn.add_listener(
            LISTEN_CHANNEL,
            lambda *_, payload: asyncio.create_task(_dispatch(payload, topics, q)),
        )
        yield q
    except Exception as e:
        log.exception("Event bus subscription failed")
        raise
    finally:
        if 'conn' in locals():
            await conn.close()


async def _dispatch(raw: str, topics: list[str], q: asyncio.Queue):
    try:
        msg = json.loads(raw)
        if msg.get("topic") in topics:
            await q.put(Event(msg["topic"], msg["payload"]))
    except Exception:
        log.warning("Failed to dispatch event payload: %s", raw)
