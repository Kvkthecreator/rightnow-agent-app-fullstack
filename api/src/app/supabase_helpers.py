from .event_bus import emit

async def publish_event(topic: str, payload: dict) -> None:
    await emit(topic, payload)
