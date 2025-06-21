from datetime import datetime
from uuid import UUID


def as_json(obj):
    """Recursively cast UUID or datetime values to str for JSON inserts."""
    if isinstance(obj, dict):
        return {k: as_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [as_json(v) for v in obj]
    if isinstance(obj, (UUID, datetime)):
        return str(obj)
    return obj
