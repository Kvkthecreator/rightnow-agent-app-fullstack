from uuid import uuid4
from typing import List, Dict, Any
from ..contracts.basket import BasketChangeRequest

class PlanResult:
    def __init__(self, delta_id, summary, changes, recommended_actions, explanations, confidence):
        self.delta_id = delta_id
        self.summary = summary
        self.changes = changes
        self.recommended_actions = recommended_actions
        self.explanations = explanations
        self.confidence = confidence

async def run_manager_plan(db, req: BasketChangeRequest) -> PlanResult:
    summary = "No material change detected." if not (req.sources or req.intent) else "Consolidated incoming changes."
    changes: List[Dict[str, Any]] = []
    recs: List[Dict[str, Any]] = []
    explanations = [{"by": "manager", "text": summary}]
    confidence = 0.8
    return PlanResult(str(uuid4()), summary, changes, recs, explanations, confidence)
