"""Raw dump interpretation service for agent-driven block proposals."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from ...memory.blocks import BlockProposalService
from ...models.context import ContextItemType
from ...utils.supabase_client import supabase_client as supabase
from ...utils.db import as_json
from ...ingestion.parsers.unified_content_extractor import ContentExtractor

logger = logging.getLogger("uvicorn.error")


class InterpretedBlock(BaseModel):
    """A block proposal extracted from raw dump content."""
    semantic_type: str
    content: str
    confidence: float = Field(ge=0.0, le=1.0)
    meta_agent_notes: str
    scope: Optional[str] = None
    

class RawDumpInterpretationRequest(BaseModel):
    """Request to interpret a raw dump into structured blocks."""
    raw_dump_id: UUID
    interpretation_prompt: Optional[str] = None
    max_blocks: int = Field(default=10, ge=1, le=50)
    agent_id: str


class RawDumpInterpretationResult(BaseModel):
    """Result of raw dump interpretation."""
    raw_dump_id: UUID
    proposed_blocks: List[Dict[str, Any]]
    interpretation_summary: str
    agent_confidence: float
    processing_time_ms: int


class DumpInterpreterService:
    """Service for agent-driven interpretation of raw dumps into block proposals."""
    
    @classmethod
    async def interpret_dump(
        cls,
        request: RawDumpInterpretationRequest,
        workspace_id: str
    ) -> RawDumpInterpretationResult:
        """Interpret a raw dump and create block proposals."""
        start_time = datetime.utcnow()
        
        # Get the raw dump content including Supabase Storage file references
        dump_resp = (
            supabase.table("raw_dumps")
            .select("id,body_md,basket_id,workspace_id,file_url,source_meta")
            .eq("id", str(request.raw_dump_id))
            .eq("workspace_id", workspace_id)
            .maybe_single()
            .execute()
        )
        
        if not dump_resp.data:
            raise ValueError(f"Raw dump {request.raw_dump_id} not found")
            
        raw_dump = dump_resp.data
        basket_id = UUID(raw_dump["basket_id"])
        
        # Memory-First content assembly: combine text and Supabase Storage file content
        content_parts = []
        
        # Add existing text content (including user-pasted URLs as text)
        if raw_dump.get("body_md") and raw_dump["body_md"].strip():
            content_parts.append(raw_dump["body_md"].strip())
        
        # Process Supabase Storage file if present
        file_url = raw_dump.get("file_url")
        if file_url:
            try:
                # Get MIME type from source_meta if available
                source_meta = raw_dump.get("source_meta")
                mime_type = None
                if source_meta and isinstance(source_meta, dict):
                    mime_type = source_meta.get("mime")
                elif source_meta and isinstance(source_meta, str):
                    import json
                    try:
                        meta_dict = json.loads(source_meta)
                        mime_type = meta_dict.get("mime")
                    except (json.JSONDecodeError, AttributeError):
                        pass
                
                # Extract content from Supabase Storage file (Memory-First)
                file_content = await ContentExtractor.extract_content_from_supabase_url(
                    file_url, mime_type
                )
                
                if file_content and file_content.strip():
                    content_parts.append(f"[File Content]:\n{file_content.strip()}")
                    
            except Exception as e:
                logger.warning(f"Failed to extract content from Supabase Storage file {file_url}: {e}")
                # Continue processing other content, don't fail the whole interpretation
        
        # Combine all content
        content = "\n\n".join(content_parts)
        
        if not content or not content.strip():
            raise ValueError("Raw dump has no interpretable content (text or Supabase Storage files)")
        
        # Perform interpretation (using rule-based approach for now)
        # In production, this would use LLM or other AI services
        interpreted_blocks = cls._analyze_content(content, request.interpretation_prompt)
        
        # Create block proposals using the lifecycle service
        proposed_blocks = []
        for block_data in interpreted_blocks[:request.max_blocks]:
            try:
                proposed_block = await BlockProposalService.propose_block(
                    basket_id=basket_id,
                    semantic_type=block_data.semantic_type,
                    content=block_data.content,
                    agent_id=request.agent_id,
                    origin_ref=request.raw_dump_id,
                    scope=block_data.scope
                )
                
                # Add agent metadata
                block_id = proposed_block["id"]
                await cls._add_agent_metadata(
                    block_id=block_id,
                    confidence=block_data.confidence,
                    agent_notes=block_data.meta_agent_notes,
                    agent_id=request.agent_id
                )
                
                proposed_blocks.append({
                    **proposed_block,
                    "confidence": block_data.confidence,
                    "agent_notes": block_data.meta_agent_notes
                })
                
            except Exception as e:
                logger.exception(f"Failed to create block proposal: {e}")
                continue
        
        # Calculate processing time
        end_time = datetime.utcnow()
        processing_time_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Create interpretation summary event
        await cls._log_interpretation_event(
            raw_dump_id=request.raw_dump_id,
            basket_id=basket_id,
            agent_id=request.agent_id,
            blocks_created=len(proposed_blocks),
            processing_time_ms=processing_time_ms,
            supabase_files_processed=1 if file_url else 0
        )
        
        return RawDumpInterpretationResult(
            raw_dump_id=request.raw_dump_id,
            proposed_blocks=proposed_blocks,
            interpretation_summary=f"Interpreted {len(proposed_blocks)} blocks from raw content",
            agent_confidence=sum(b["confidence"] for b in proposed_blocks) / len(proposed_blocks) if proposed_blocks else 0.0,
            processing_time_ms=processing_time_ms
        )
    
    @classmethod
    def _analyze_content(cls, content: str, prompt: Optional[str] = None) -> List[InterpretedBlock]:
        """Analyze raw content and extract structured blocks.
        
        This is a simplified rule-based implementation.
        In production, this would use LLM services for actual interpretation.
        """
        blocks = []
        
        # Simple rule-based content analysis
        lines = [line.strip() for line in content.split('\n') if line.strip()]
        
        # Look for potential insights, goals, questions, etc.
        for i, line in enumerate(lines):
            if len(line) < 10:  # Skip very short lines
                continue
                
            semantic_type = "insight"  # Default type
            confidence = 0.7  # Default confidence
            
            # Rule-based type detection
            if any(keyword in line.lower() for keyword in ["goal", "objective", "aim", "want to"]):
                semantic_type = "goal"
                confidence = 0.8
            elif any(keyword in line.lower() for keyword in ["problem", "issue", "challenge"]):
                semantic_type = "constraint"
                confidence = 0.8
            elif any(keyword in line.lower() for keyword in ["idea", "concept", "thought"]):
                semantic_type = "insight"
                confidence = 0.9
            elif line.endswith("?"):
                semantic_type = "goal"  # Questions often indicate goals
                confidence = 0.6
            elif any(keyword in line.lower() for keyword in ["audience", "user", "customer"]):
                semantic_type = "audience"
                confidence = 0.8
            elif line.startswith("[File Content"):
                # Detect content extracted from Supabase Storage files
                semantic_type = "insight"
                confidence = 0.85  # Higher confidence for extracted file content
            
            blocks.append(InterpretedBlock(
                semantic_type=semantic_type,
                content=line,
                confidence=confidence,
                meta_agent_notes=f"Extracted from line {i+1}, type detected via keyword analysis",
                scope="basket"
            ))
            
            # Limit to prevent too many blocks
            if len(blocks) >= 20:
                break
        
        # Sort by confidence (highest first)
        blocks.sort(key=lambda b: b.confidence, reverse=True)
        
        return blocks
    
    @classmethod
    async def _add_agent_metadata(
        cls,
        block_id: str,
        confidence: float,
        agent_notes: str,
        agent_id: str
    ) -> None:
        """Add agent metadata to a created block."""
        # Store in a separate metadata table or add to block record
        # For now, we'll create an event to track the agent metadata
        metadata_event = {
            "id": str(uuid4()),
            "block_id": block_id,
            "kind": "block.agent_metadata",
            "payload": {
                "confidence": confidence,
                "agent_notes": agent_notes,
                "agent_id": agent_id,
                "created_at": datetime.utcnow().isoformat()
            }
        }
        
        supabase.table("events").insert(as_json(metadata_event)).execute()
    
    @classmethod
    async def _log_interpretation_event(
        cls,
        raw_dump_id: UUID,
        basket_id: UUID,
        agent_id: str,
        blocks_created: int,
        processing_time_ms: int,
        supabase_files_processed: int = 0
    ) -> None:
        """Log the interpretation process as an event."""
        event_data = {
            "id": str(uuid4()),
            "basket_id": str(basket_id),
            "kind": "raw_dump.interpreted",
            "payload": {
                "raw_dump_id": str(raw_dump_id),
                "agent_id": agent_id,
                "blocks_created": blocks_created,
                "processing_time_ms": processing_time_ms,
                "supabase_files_processed": supabase_files_processed,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        supabase.table("events").insert(as_json(event_data)).execute()


class SmartDumpInterpreter:
    """Enhanced interpreter with context awareness and semantic analysis."""
    
    @classmethod
    async def interpret_with_context(
        cls,
        request: RawDumpInterpretationRequest,
        workspace_id: str
    ) -> RawDumpInterpretationResult:
        """Interpret dump with awareness of existing basket context."""
        
        # Get existing basket context for smarter interpretation
        basket_context = await cls._get_basket_context(
            request.raw_dump_id, workspace_id
        )
        
        # Use context to inform interpretation
        # This would integrate with existing blocks, context_items, etc.
        
        # For now, delegate to basic interpreter
        return await DumpInterpreterService.interpret_dump(request, workspace_id)
    
    @classmethod
    async def _get_basket_context(cls, raw_dump_id: UUID, workspace_id: str) -> Dict[str, Any]:
        """Get existing context from the basket for smarter interpretation."""
        
        # Get the raw dump to find basket
        dump_resp = (
            supabase.table("raw_dumps")
            .select("basket_id")
            .eq("id", str(raw_dump_id))
            .eq("workspace_id", workspace_id)
            .maybe_single()
            .execute()
        )
        
        if not dump_resp.data:
            return {}
            
        basket_id = dump_resp.data["basket_id"]
        
        # Get existing blocks in basket
        blocks_resp = (
            supabase.table("blocks")
            .select("semantic_type,content,state")
            .eq("basket_id", basket_id)
            .eq("workspace_id", workspace_id)
            .execute()
        )
        
        # Get existing context items
        context_resp = (
            supabase.table("context_items")
            .select("type,content")
            .eq("basket_id", basket_id)
            .execute()
        )
        
        return {
            "basket_id": basket_id,
            "existing_blocks": blocks_resp.data or [],
            "context_items": context_resp.data or []
        }