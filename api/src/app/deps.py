from databases import Database
import os
import asyncio
from contextlib import asynccontextmanager
from typing import AsyncIterator

# Global database instance
_db: Database | None = None
_connection_lock = asyncio.Lock()

async def get_db() -> Database:
    """
    Get the global database connection with proper idempotency handling.
    Thread-safe and ensures single connection per application lifecycle.
    """
    global _db
    
    # Double-check locking pattern for async
    if _db is not None:
        return _db
    
    async with _connection_lock:
        # Re-check after acquiring lock
        if _db is not None:
            return _db
        
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL environment variable is required")
        
        _db = Database(database_url)
        await _db.connect()
        return _db

@asynccontextmanager
async def db_transaction() -> AsyncIterator[Database]:
    """
    Context manager for database transactions.
    Usage: 
        async with db_transaction() as db:
            # Your database operations
            pass
    """
    db = await get_db()
    async with db.transaction():
        yield db

async def close_db():
    """Close the database connection - call during app shutdown."""
    global _db
    if _db is not None:
        await _db.disconnect()
        _db = None
