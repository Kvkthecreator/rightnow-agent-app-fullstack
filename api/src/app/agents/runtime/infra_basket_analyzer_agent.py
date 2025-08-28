"""
Stub implementation for legacy infra basket analyzer agent.
This functionality is now handled by canonical P3 Reflection Agent.
"""

from typing import Any, Dict, List
from uuid import UUID


class InfraBasketAnalyzerAgent:
    """Legacy stub - analysis is now handled by P3 Reflection Agent."""
    
    def __init__(self, name: str, workspace_id: UUID):
        self.name = name
        self.workspace_id = workspace_id
    
    async def analyze_basket(self, basket_id: UUID) -> Dict[str, Any]:
        """Legacy stub - use canonical P3 Reflection Agent instead."""
        return {
            "status": "deprecated",
            "message": "Use canonical P3 Reflection Agent instead",
            "basket_id": str(basket_id),
            "blocks": [],
            "insights": [],
            "patterns": []
        }