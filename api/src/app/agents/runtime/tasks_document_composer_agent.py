"""
Stub implementation for legacy tasks document composer agent.
This functionality is now handled by canonical P4 Presentation Agent.
"""

from typing import Any, Dict, List
from uuid import UUID


class TasksDocumentComposerAgent:
    """Legacy stub - document composition is now handled by P4 Presentation Agent."""
    
    def __init__(self, name: str):
        self.name = name
    
    async def compose_document(self, workspace_id: UUID, basket_id: UUID, document_request: Dict[str, Any]) -> Dict[str, Any]:
        """Legacy stub - use canonical P4 Presentation Agent instead."""
        return {
            "status": "deprecated", 
            "message": "Use canonical P4 Presentation Agent instead",
            "document_id": None,
            "content": "",
            "metadata": {}
        }