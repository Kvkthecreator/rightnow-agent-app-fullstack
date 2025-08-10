from databases import Database
import os

_db: Database | None = None

async def get_db() -> Database:
    global _db
    if _db is None:
        database_url = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/dbname")
        _db = Database(database_url)
        await _db.connect()
    return _db
