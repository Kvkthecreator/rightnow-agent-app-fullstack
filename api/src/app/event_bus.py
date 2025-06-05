# api/src/app/event_bus.py

import asyncio
import json
import os
from contextlib import asynccontextmanager

import asyncpg

DB_URL = os.getenv("DATABASE_URL")  # same DSN your server uses
LISTEN_CHANNEL = "bus_any"  # single physical channel


class Event:
    def __init__(self, topic: str, payload: dict):
        self.topic = topic
        self.payload = payload


# ---------- emitter ---------- #
async def emit(topic: str, payload: dict) -> None:
    """Insert into events table and rely on trigger to NOTIFY."""
    conn = await asyncpg.connect(DB_URL)
    try:
        await conn.execute(
            "insert into public.events(topic, payload) values($1, $2)", topic, json.dumps(payload)
        )
    finally:
        await conn.close()


# convenience wrapper used by agent tasks
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
    conn = await asyncpg.connect(DB_URL)
    await conn.add_listener(
        LISTEN_CHANNEL, lambda *_, payload: asyncio.create_task(_dispatch(payload, topics, q))
    )
    try:
        yield q
    finally:
        await conn.close()


async def _dispatch(raw: str, topics: list[str], q: asyncio.Queue):
    msg = json.loads(raw)
    if msg["topic"] in topics:
        await q.put(Event(msg["topic"], msg["payload"]))
