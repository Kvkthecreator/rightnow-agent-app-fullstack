"""
Stub implementation for legacy infra observer agent.
This functionality is now handled by the canonical queue processor.
"""

from typing import Any, Dict
from uuid import UUID


async def run(basket_id: UUID, **kwargs) -> Dict[str, Any]:
    """
    Legacy stub - infra observation is now handled by canonical queue processor.
    """
    return {
        "status": "deprecated", 
        "message": "Use canonical queue processor instead",
        "basket_id": str(basket_id)
    }