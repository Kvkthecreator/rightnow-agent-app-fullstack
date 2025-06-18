from datetime import datetime
from uuid import UUID


def json_safe(value):
    """Cast UUID / datetime → str so Supabase python-client can JSON-dump."""
    if isinstance(value, (UUID, datetime)):
        return str(value)
    return value
