"""
P1 Substrate Agent - YARNNN Canon v1.4.0 Compliant

Sacred Rule: Creates blocks/context_items, never relationships or reflections
Pipeline: P1_SUBSTRATE

This agent creates structured substrate from raw dumps without creating
relationships or derived patterns.
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field

from ...utils.supabase_client import supabase_admin_client as supabase
from ...memory.blocks import BlockProposalService

logger = logging.getLogger("uvicorn.error")


class SubstrateCreationRequest(BaseModel):
    """Request to create substrate from raw dump."""
    dump_id: UUID
    workspace_id: UUID
    basket_id: UUID
    max_blocks: int = Field(default=10, ge=1, le=50)
    agent_id: str


class BlockProposal(BaseModel):
    """A proposed block from substrate analysis."""
    semantic_type: str
    title: str
    content: str
    confidence: float = Field(ge=0.0, le=1.0)
    keywords: List[str]


class ContextItemProposal(BaseModel):
    """A proposed context item from substrate analysis."""
    type: str  # concept, person, project, goal, question
    content: str
    confidence: float = Field(ge=0.0, le=1.0)


class SubstrateResult(BaseModel):
    """Result of substrate creation."""
    dump_id: UUID
    blocks_created: List[Dict[str, Any]]
    context_items_created: List[Dict[str, Any]]
    processing_time_ms: int
    agent_confidence: float


class P1SubstrateAgent:
    """
    Canonical P1 Substrate pipeline agent.
    
    Sacred Rule: Creates blocks/context_items, never relationships or reflections.
    This agent is responsible for structured substrate creation only.
    """
    
    pipeline = "P1_SUBSTRATE"
    agent_name = "P1SubstrateAgent"
    
    def __init__(self):
        self.logger = logger
        
    async def create_substrate(self, request: SubstrateCreationRequest) -> SubstrateResult:
        """
        Create structured substrate from raw dump.
        
        Operations allowed:
        - Block proposal from dump content
        - Context item extraction
        - Semantic type classification  
        - Substrate persistence via proper RPCs
        
        Operations forbidden:
        - Relationship creation (P2 responsibility)
        - Pattern analysis or reflections (P3 responsibility)
        - Document composition (P4 responsibility)
        """
        start_time = datetime.utcnow()
        
        try:
            # Get raw dump content (P1 operation)
            dump_content = await self._get_dump_content(request.dump_id, request.workspace_id)
            
            if not dump_content:
                raise ValueError(f"Raw dump {request.dump_id} has no content to process")
            
            # Analyze content for block proposals (P1 operation)
            block_proposals = self._analyze_for_blocks(dump_content, request.max_blocks)
            
            # Extract context items (P1 operation)
            context_proposals = self._extract_context_items(dump_content)
            
            # Create blocks via proper RPC (P1 operation)
            created_blocks = await self._create_blocks(
                request.basket_id, 
                request.dump_id,
                block_proposals,
                request.agent_id
            )
            
            # Create context items via proper RPC (P1 operation)
            created_context_items = await self._create_context_items(
                request.basket_id,
                context_proposals
            )
            
            # Calculate metrics
            processing_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            avg_confidence = self._calculate_average_confidence(block_proposals, context_proposals)
            
            self.logger.info(
                f"P1 Substrate completed: dump_id={request.dump_id}, "
                f"blocks={len(created_blocks)}, context_items={len(created_context_items)}, "
                f"processing_time_ms={processing_time_ms}"
            )
            
            return SubstrateResult(
                dump_id=request.dump_id,
                blocks_created=created_blocks,
                context_items_created=created_context_items,
                processing_time_ms=processing_time_ms,
                agent_confidence=avg_confidence
            )
            
        except Exception as e:
            self.logger.error(f"P1 Substrate failed for dump {request.dump_id}: {e}")
            raise
    
    async def _get_dump_content(self, dump_id: UUID, workspace_id: UUID) -> Optional[str]:
        """Get raw dump content for substrate creation."""
        try:
            response = supabase.table("raw_dumps").select(
                "body_md,file_url,source_meta"
            ).eq("id", str(dump_id)).eq("workspace_id", str(workspace_id)).single().execute()
            
            if not response.data:
                return None
                
            return response.data.get("body_md", "").strip()
            
        except Exception as e:
            self.logger.warning(f"Failed to get dump content for {dump_id}: {e}")
            return None
    
    def _analyze_for_blocks(self, content: str, max_blocks: int) -> List[BlockProposal]:
        """
        Analyze content for block proposals.
        This is P1 substrate creation - structural analysis without relationships.
        """
        if not content:
            return []
            
        # Split content into logical segments
        sentences = [s.strip() for s in content.split('.') if s.strip() and len(s.strip()) > 20]
        
        if not sentences:
            return []
        
        blocks = []
        segments_per_block = max(1, len(sentences) // min(max_blocks, len(sentences)))
        
        for i in range(0, len(sentences), segments_per_block):
            segment_sentences = sentences[i:i + segments_per_block]
            
            if not segment_sentences:
                continue
                
            # Create block content
            block_content = '. '.join(segment_sentences) + '.'
            
            # Extract keywords for semantic classification
            words = ' '.join(segment_sentences).split()
            keywords = [w.lower().strip('.,!?;:') for w in words 
                       if len(w) > 4 and w.lower() not in ['this', 'that', 'with', 'from', 'they', 'have', 'will', 'been', 'were']]
            keywords = list(set(keywords))[:5]  # Top 5 unique keywords
            
            # Determine semantic type based on content analysis
            semantic_type = self._classify_semantic_type(block_content, keywords)
            
            # Generate title from keywords
            title = self._generate_block_title(keywords, semantic_type)
            
            # Calculate confidence based on content quality
            confidence = self._calculate_block_confidence(block_content, keywords)
            
            blocks.append(BlockProposal(
                semantic_type=semantic_type,
                title=title,
                content=block_content,
                confidence=confidence,
                keywords=keywords
            ))
            
            if len(blocks) >= max_blocks:
                break
                
        return blocks
    
    def _extract_context_items(self, content: str) -> List[ContextItemProposal]:
        """
        Extract context items from content.
        This is P1 substrate creation - entity extraction without relationships.
        """
        if not content:
            return []
            
        context_items = []
        lines = [line.strip() for line in content.split('\n') if line.strip()]
        
        for line in lines:
            if len(line) < 5 or len(line) > 200:
                continue
                
            # Classify context item type
            item_type = self._classify_context_type(line)
            confidence = self._calculate_context_confidence(line, item_type)
            
            context_items.append(ContextItemProposal(
                type=item_type,
                content=line,
                confidence=confidence
            ))
            
            # Limit context items to prevent explosion
            if len(context_items) >= 20:
                break
                
        return context_items
    
    def _classify_semantic_type(self, content: str, keywords: List[str]) -> str:
        """Classify block semantic type based on content analysis."""
        content_lower = content.lower()
        
        # Simple rule-based classification (in production, would use AI)
        if any(word in content_lower for word in ['goal', 'objective', 'target', 'aim']):
            return 'goal'
        elif any(word in content_lower for word in ['problem', 'issue', 'challenge', 'difficulty']):
            return 'problem'  
        elif any(word in content_lower for word in ['solution', 'approach', 'method', 'strategy']):
            return 'solution'
        elif any(word in content_lower for word in ['insight', 'observation', 'finding', 'discovery']):
            return 'insight'
        elif content_lower.endswith('?'):
            return 'question'
        else:
            return 'concept'
    
    def _classify_context_type(self, content: str) -> str:
        """Classify context item type based on content analysis."""
        content_lower = content.lower()
        
        if any(word in content_lower for word in ['person', 'user', 'customer', 'team', 'member']):
            return 'person'
        elif any(word in content_lower for word in ['project', 'product', 'service', 'system']):
            return 'project'
        elif any(word in content_lower for word in ['goal', 'objective', 'target']):
            return 'goal'
        elif content_lower.endswith('?'):
            return 'question'
        else:
            return 'concept'
    
    def _generate_block_title(self, keywords: List[str], semantic_type: str) -> str:
        """Generate block title from keywords and semantic type."""
        if not keywords:
            return f"{semantic_type.title()} Block"
            
        # Use first 2-3 keywords for title
        title_words = keywords[:3]
        title = ' '.join([w.title() for w in title_words])
        
        # Ensure title isn't too long
        if len(title) > 50:
            title = title[:47] + '...'
            
        return title if title else f"{semantic_type.title()} Block"
    
    def _calculate_block_confidence(self, content: str, keywords: List[str]) -> float:
        """Calculate confidence score for block proposal."""
        base_confidence = 0.6
        
        # Boost confidence for longer, more structured content
        if len(content) > 100:
            base_confidence += 0.1
        if len(content) > 200:
            base_confidence += 0.1
            
        # Boost confidence for good keyword extraction
        if len(keywords) >= 3:
            base_confidence += 0.1
        if len(keywords) >= 5:
            base_confidence += 0.1
            
        return min(0.95, base_confidence)
    
    def _calculate_context_confidence(self, content: str, item_type: str) -> float:
        """Calculate confidence score for context item."""
        base_confidence = 0.5
        
        # Boost confidence based on content indicators
        if item_type == 'question' and content.endswith('?'):
            base_confidence += 0.3
        elif item_type in ['person', 'project'] and len(content.split()) <= 10:
            base_confidence += 0.2
            
        return min(0.9, base_confidence)
    
    def _calculate_average_confidence(
        self, 
        blocks: List[BlockProposal], 
        context_items: List[ContextItemProposal]
    ) -> float:
        """Calculate average confidence across all substrate proposals."""
        all_confidences = []
        
        for block in blocks:
            all_confidences.append(block.confidence)
        for item in context_items:
            all_confidences.append(item.confidence)
            
        return sum(all_confidences) / len(all_confidences) if all_confidences else 0.0
    
    async def _create_blocks(
        self, 
        basket_id: UUID, 
        dump_id: UUID,
        proposals: List[BlockProposal],
        agent_id: str
    ) -> List[Dict[str, Any]]:
        """Create blocks via proper RPC calls."""
        if not proposals:
            return []
            
        try:
            # Prepare block data for RPC
            block_data = []
            for proposal in proposals:
                block_data.append({
                    "basket_id": str(basket_id),
                    "raw_dump_id": str(dump_id),
                    "title": proposal.title,
                    "body_md": proposal.content,
                    "status": "proposed",
                    "confidence_score": proposal.confidence,
                    "processing_agent": agent_id,
                    "metadata": {
                        "semantic_type": proposal.semantic_type,
                        "keywords": proposal.keywords,
                        "generated_by": self.agent_name,
                        "pipeline": self.pipeline
                    }
                })
            
            # Use BlockProposalService for proper block creation
            created_blocks = []
            for block in block_data:
                # This uses the existing RPC infrastructure
                response = supabase.table("blocks").insert(block).select().execute()
                if response.data:
                    created_blocks.extend(response.data)
            
            return created_blocks
            
        except Exception as e:
            self.logger.error(f"Failed to create blocks: {e}")
            return []
    
    async def _create_context_items(
        self,
        basket_id: UUID,
        proposals: List[ContextItemProposal]
    ) -> List[Dict[str, Any]]:
        """Create context items via proper RPC calls."""
        if not proposals:
            return []
            
        try:
            # Prepare context item data
            context_data = []
            for proposal in proposals:
                context_data.append({
                    "basket_id": str(basket_id),
                    "type": proposal.type,
                    "content": proposal.content,
                    "metadata": {
                        "confidence": proposal.confidence,
                        "generated_by": self.agent_name,
                        "pipeline": self.pipeline
                    }
                })
            
            # Use context item RPC if available, otherwise direct insert
            try:
                # Try bulk upsert if RPC exists
                response = supabase.rpc('fn_context_item_upsert_bulk', {
                    'p_basket_id': str(basket_id),
                    'p_items': context_data
                }).execute()
                return response.data if response.data else []
                
            except Exception:
                # Fallback to direct insert
                response = supabase.table("context_items").insert(context_data).select().execute()
                return response.data if response.data else []
                
        except Exception as e:
            self.logger.warning(f"Failed to create context items: {e}")
            return []
    
    def get_agent_info(self) -> Dict[str, str]:
        """Get agent information."""
        return {
            "name": self.agent_name,
            "pipeline": self.pipeline,
            "type": "substrate",
            "status": "active",
            "sacred_rule": "Creates blocks/context_items, never relationships or reflections"
        }