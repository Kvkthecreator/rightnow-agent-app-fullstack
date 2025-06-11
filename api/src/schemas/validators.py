from functools import wraps

from fastapi import HTTPException


def validates(schema):
    def decorator(fn):
        @wraps(fn)
        async def wrapper(payload, *args, **kwargs):
            try:
                data = schema.model_validate(payload)
            except Exception as e:  # pragma: no cover - pass through
                raise HTTPException(status_code=400, detail=str(e)) from e
            return await fn(data, *args, **kwargs)

        return wrapper

    return decorator
