import sys
import os

# Add src to path for imports  
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contracts.basket import BasketDelta
from repositories.delta_repository import DeltaRepository
from repositories.event_repository import EventRepository

async def persist_delta(db, delta: BasketDelta, request_id: str) -> None:
    """Persist delta and publish event as documented"""
    # Use repository for database operation
    delta_repo = DeltaRepository(db)
    await delta_repo.persist_delta(delta.dict(), request_id)
    
    # Publish event as documented
    event_repo = EventRepository(db)
    await event_repo.publish_event(
        "delta.created",
        {
            "basket_id": delta.basket_id,
            "delta_id": delta.delta_id,
            "summary": delta.summary
        }
    )

async def list_deltas(db, basket_id: str):
    """List deltas using repository"""
    delta_repo = DeltaRepository(db)
    return await delta_repo.list_deltas(basket_id)

async def try_apply_delta(db, basket_id: str, delta_id: str) -> bool:
    """Apply delta using repository"""
    delta_repo = DeltaRepository(db)
    success = await delta_repo.apply_delta(basket_id, delta_id)
    
    if success:
        # Publish event for successful application
        event_repo = EventRepository(db)
        await event_repo.publish_event(
            "delta.applied",
            {
                "basket_id": basket_id,
                "delta_id": delta_id
            }
        )
    
    return success
