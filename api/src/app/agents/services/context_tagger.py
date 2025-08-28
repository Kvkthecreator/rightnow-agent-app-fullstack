"""
Stub implementation for legacy context tagger service.
This will be replaced with canonical P1 Substrate Agent.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel


class ContextTagRequest(BaseModel):
    content: str
    workspace_id: UUID


class SemanticRelationship(BaseModel):
    from_concept: str
    to_concept: str
    relationship_type: str
    confidence: float


class ContextTaggingResult(BaseModel):
    tags: List[str]
    relationships: List[SemanticRelationship]
    processing_time_ms: int


class ContextTaggerService:
    """Legacy stub - use canonical P1SubstrateAgent instead."""
    
    async def tag_content(self, request: ContextTagRequest) -> ContextTaggingResult:
        # Stub implementation - directs to canonical processing
        return ContextTaggingResult(
            tags=[],
            relationships=[],
            processing_time_ms=0
        )