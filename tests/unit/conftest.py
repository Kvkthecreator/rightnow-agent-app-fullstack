# tests/conftest.py
import asyncio
import pytest
import asyncpg
import os

DB_URL = os.getenv("DATABASE_URL")  # Should match your event_bus.py config

@pytest.fixture(scope="session")
def event_loop():
    """Allow pytest-asyncio to use a session-scoped event loop."""
    return asyncio.get_event_loop()

@pytest.fixture
async def postgres_clean():
    """Returns a live DB connection, and truncates target tables before use."""
    conn = await asyncpg.connect(DB_URL)
    await conn.execute("truncate table context_blocks restart identity cascade")
    yield conn
    await conn.close()
