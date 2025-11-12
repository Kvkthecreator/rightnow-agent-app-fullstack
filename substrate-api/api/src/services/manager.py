"""Legacy manager module (intentionally inert).

This file used to orchestrate substrate mutations directly via SubstrateOps,
which violated the canon requirement that every mutation flows through
P1 governance proposals. The canonical queue + governance processor now
handle all work. The functions below only exist so any straggling imports
fail loudly instead of silently mutating state.
"""

from __future__ import annotations

import os
import sys
from typing import Union
from uuid import uuid4

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contracts.basket import BasketChangeRequest, BasketDelta
from services.clock import now_iso

try:  # pragma: no cover - legacy fallback
    from app.baskets.schemas import BasketWorkRequest
except ImportError:  # pragma: no cover
    BasketWorkRequest = None


async def run_manager_plan(
    db, basket_id: str, req: Union[BasketWorkRequest, BasketChangeRequest], workspace_id: str
) -> BasketDelta:
    """Always fail – callers must use the canonical governance pipeline."""
    raise RuntimeError(
        "run_manager_plan has been removed. Use the canonical queue + governance pipeline instead."
    )


async def _run_work_request(
    db, basket_id: str, req: BasketWorkRequest, workspace_id: str
) -> BasketDelta:  # pragma: no cover - kept for compatibility
    return BasketDelta(
        delta_id=str(uuid4()),
        basket_id=basket_id,
        summary="Manager plan retired; work request must be re-submitted via canonical pipeline",
        changes=[],
        recommended_actions=[],
        explanations=[{"by": "manager", "text": "Legacy path no longer executes"}],
        confidence=0.0,
        created_at=now_iso(),
    )


async def _run_legacy_request(
    db, basket_id: str, req: BasketChangeRequest, workspace_id: str
) -> BasketDelta:  # pragma: no cover - kept for compatibility
    return BasketDelta(
        delta_id=str(uuid4()),
        basket_id=basket_id,
        summary="Legacy manager path disabled; change not applied",
        changes=[],
        recommended_actions=[],
        explanations=[{"by": "manager", "text": "Submit work via canonical governance"}],
        confidence=0.0,
        created_at=now_iso(),
    )
