"""
P2 Graph Agent - YARNNN Canon v1.4.0 Compliant

Sacred Rule: Creates relationships, never modifies substrate content
Pipeline: P2_GRAPH

This agent connects existing substrate elements without modifying
their content or creating new substrate.
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Set, Tuple
from uuid import UUID
from pydantic import BaseModel, Field

from app.utils.supabase_client import supabase_admin_client as supabase

logger = logging.getLogger("uvicorn.error")


class RelationshipMappingRequest(BaseModel):
    """Request to map relationships between substrate elements."""
    workspace_id: UUID
    basket_id: UUID
    substrate_ids: List[UUID]  # IDs of substrate to analyze for connections
    agent_id: str


class RelationshipProposal(BaseModel):
    """A proposed relationship between substrate elements."""
    from_type: str  # block, context_item, raw_dump
    from_id: UUID
    to_type: str
    to_id: UUID
    relationship_type: str  # related_content, semantic_similarity, temporal_sequence
    strength: float = Field(ge=0.0, le=1.0)
    description: str


class RelationshipResult(BaseModel):
    """Result of relationship mapping."""
    workspace_id: UUID
    relationships_created: List[Dict[str, Any]]
    processing_time_ms: int
    substrate_analyzed: int
    connection_strength_avg: float


class P2GraphAgent:
    """
    Canonical P2 Graph pipeline agent.
    
    Sacred Rule: Creates relationships, never modifies substrate content.
    This agent is responsible for connecting existing substrate only.
    """
    
    pipeline = "P2_GRAPH"
    agent_name = "P2GraphAgent"
    
    def __init__(self):
        self.logger = logger
        
    async def map_relationships(self, request: RelationshipMappingRequest) -> RelationshipResult:
        """
        Map relationships between existing substrate elements.
        
        Operations allowed:
        - Relationship discovery between substrates
        - Connection strength analysis
        - Graph structure optimization
        - Relationship persistence
        
        Operations forbidden:
        - Substrate content modification (P1 responsibility)
        - Pattern analysis or reflections (P3 responsibility) 
        - Document composition (P4 responsibility)
        """
        start_time = datetime.utcnow()
        
        try:
            # Get substrate elements for analysis (P2 operation)
            substrate_elements = await self._get_substrate_elements(
                request.workspace_id,
                request.basket_id,
                request.substrate_ids
            )
            
            if len(substrate_elements) < 2:
                self.logger.info(f"P2 Graph: Insufficient substrate elements for relationship mapping")
                return RelationshipResult(
                    workspace_id=request.workspace_id,
                    relationships_created=[],
                    processing_time_ms=0,
                    substrate_analyzed=len(substrate_elements),
                    connection_strength_avg=0.0
                )
            
            # Analyze for relationship proposals (P2 operation)
            relationship_proposals = self._analyze_for_relationships(substrate_elements)
            
            # Filter and validate relationships (P2 operation)
            validated_proposals = self._validate_relationships(relationship_proposals)
            
            # Create relationships via proper RPC (P2 operation)
            created_relationships = await self._create_relationships(
                request.basket_id,
                validated_proposals,
                request.agent_id
            )
            
            # Calculate metrics
            processing_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            avg_strength = self._calculate_average_strength(validated_proposals)
            
            self.logger.info(
                f"P2 Graph completed: workspace_id={request.workspace_id}, "
                f"relationships={len(created_relationships)}, substrate_analyzed={len(substrate_elements)}, "
                f"processing_time_ms={processing_time_ms}"
            )
            
            return RelationshipResult(
                workspace_id=request.workspace_id,
                relationships_created=created_relationships,
                processing_time_ms=processing_time_ms,
                substrate_analyzed=len(substrate_elements),
                connection_strength_avg=avg_strength
            )
            
        except Exception as e:
            self.logger.error(f"P2 Graph failed for workspace {request.workspace_id}: {e}")
            raise
    
    async def _get_substrate_elements(
        self, 
        workspace_id: UUID, 
        basket_id: UUID,
        substrate_ids: List[UUID]
    ) -> List[Dict[str, Any]]:
        """Get substrate elements for relationship analysis."""
        try:
            substrate_elements = []
            
            # Get blocks
            blocks_response = supabase.table("blocks").select(
                "id,title,body_md,semantic_type,metadata,confidence_score"
            ).eq("basket_id", str(basket_id)).execute()
            
            if blocks_response.data:
                for block in blocks_response.data:
                    substrate_elements.append({
                        "id": block["id"],
                        "type": "block",
                        "title": block.get("title", ""),
                        "content": block.get("body_md", ""),
                        "semantic_type": block.get("semantic_type", "concept"),
                        "metadata": block.get("metadata", {}),
                        "confidence": block.get("confidence_score", 0.5)
                    })
            
            # Get context items
            context_response = supabase.table("context_items").select(
                "id,type,content,metadata"
            ).eq("basket_id", str(basket_id)).execute()
            
            if context_response.data:
                for item in context_response.data:
                    substrate_elements.append({
                        "id": item["id"],
                        "type": "context_item", 
                        "title": item.get("content", "")[:50],  # Use content as title
                        "content": item.get("content", ""),
                        "semantic_type": item.get("type", "concept"),
                        "metadata": item.get("metadata", {}),
                        "confidence": item.get("metadata", {}).get("confidence", 0.5)
                    })
            
            # Filter by requested substrate_ids if specified
            if substrate_ids:
                substrate_id_strs = [str(sid) for sid in substrate_ids]
                substrate_elements = [
                    elem for elem in substrate_elements 
                    if elem["id"] in substrate_id_strs
                ]
            
            return substrate_elements
            
        except Exception as e:
            self.logger.error(f"Failed to get substrate elements: {e}")
            return []
    
    def _analyze_for_relationships(self, substrate_elements: List[Dict[str, Any]]) -> List[RelationshipProposal]:
        """
        Analyze substrate elements for relationship proposals.
        This is P2 graph creation - connection analysis without content modification.
        """
        relationships = []
        
        # Analyze pairwise relationships between all substrate elements
        for i, elem1 in enumerate(substrate_elements):
            for elem2 in substrate_elements[i+1:]:
                
                # Semantic similarity analysis
                semantic_strength = self._calculate_semantic_similarity(elem1, elem2)
                if semantic_strength >= 0.3:
                    relationships.append(RelationshipProposal(
                        from_type=elem1["type"],
                        from_id=UUID(elem1["id"]),
                        to_type=elem2["type"],
                        to_id=UUID(elem2["id"]),
                        relationship_type="semantic_similarity",
                        strength=semantic_strength,
                        description=f"Semantic similarity between {elem1['semantic_type']} and {elem2['semantic_type']}"
                    ))
                
                # Content overlap analysis
                content_strength = self._calculate_content_overlap(elem1, elem2)
                if content_strength >= 0.4:
                    relationships.append(RelationshipProposal(
                        from_type=elem1["type"],
                        from_id=UUID(elem1["id"]),
                        to_type=elem2["type"],
                        to_id=UUID(elem2["id"]),
                        relationship_type="related_content",
                        strength=content_strength,
                        description=f"Content overlap between '{elem1['title'][:30]}' and '{elem2['title'][:30]}'"
                    ))
                
                # Thematic connection analysis
                thematic_strength = self._calculate_thematic_connection(elem1, elem2)
                if thematic_strength >= 0.5:
                    relationships.append(RelationshipProposal(
                        from_type=elem1["type"],
                        from_id=UUID(elem1["id"]),
                        to_type=elem2["type"],
                        to_id=UUID(elem2["id"]),
                        relationship_type="thematic_connection",
                        strength=thematic_strength,
                        description=f"Thematic connection in {elem1['semantic_type']}-{elem2['semantic_type']} relationship"
                    ))
                
                # Limit relationships to prevent explosion
                if len(relationships) >= 50:
                    break
            
            if len(relationships) >= 50:
                break
        
        return relationships
    
    def _calculate_semantic_similarity(self, elem1: Dict[str, Any], elem2: Dict[str, Any]) -> float:
        """Calculate semantic similarity between two substrate elements."""
        # Simple heuristic: same semantic type = higher similarity
        type1 = elem1.get("semantic_type", "").lower()
        type2 = elem2.get("semantic_type", "").lower()
        
        if type1 == type2:
            return 0.6
        
        # Related types have moderate similarity
        related_pairs = {
            ("goal", "solution"), ("problem", "solution"), ("question", "insight"),
            ("concept", "goal"), ("concept", "problem")
        }
        
        if (type1, type2) in related_pairs or (type2, type1) in related_pairs:
            return 0.4
        
        return 0.2  # Base similarity for all elements
    
    def _calculate_content_overlap(self, elem1: Dict[str, Any], elem2: Dict[str, Any]) -> float:
        """Calculate content overlap between two substrate elements."""
        content1 = elem1.get("content", "").lower()
        content2 = elem2.get("content", "").lower()
        
        if not content1 or not content2:
            return 0.0
        
        # Simple word overlap analysis
        words1 = set(word.strip('.,!?;:') for word in content1.split() if len(word) > 3)
        words2 = set(word.strip('.,!?;:') for word in content2.split() if len(word) > 3)
        
        if not words1 or not words2:
            return 0.0
        
        overlap = words1.intersection(words2)
        union = words1.union(words2)
        
        if not union:
            return 0.0
        
        # Jaccard similarity
        jaccard = len(overlap) / len(union)
        
        # Boost for significant overlap
        if len(overlap) >= 3:
            jaccard += 0.2
        
        return min(1.0, jaccard)
    
    def _calculate_thematic_connection(self, elem1: Dict[str, Any], elem2: Dict[str, Any]) -> float:
        """Calculate thematic connection strength between elements."""
        # Check for thematic keywords in both elements
        content1 = (elem1.get("content", "") + " " + elem1.get("title", "")).lower()
        content2 = (elem2.get("content", "") + " " + elem2.get("title", "")).lower()
        
        # Define thematic keyword clusters
        theme_clusters = {
            "technology": ["tech", "software", "system", "platform", "digital", "code", "development"],
            "business": ["business", "market", "customer", "revenue", "strategy", "growth"],
            "project": ["project", "task", "deadline", "milestone", "deliverable", "timeline"],
            "user": ["user", "experience", "interface", "usability", "feedback", "satisfaction"]
        }
        
        # Check for shared themes
        shared_themes = 0
        for theme, keywords in theme_clusters.items():
            has_theme1 = any(keyword in content1 for keyword in keywords)
            has_theme2 = any(keyword in content2 for keyword in keywords)
            
            if has_theme1 and has_theme2:
                shared_themes += 1
        
        # Return strength based on shared themes
        if shared_themes >= 2:
            return 0.7
        elif shared_themes == 1:
            return 0.5
        else:
            return 0.0
    
    def _validate_relationships(self, proposals: List[RelationshipProposal]) -> List[RelationshipProposal]:
        """Validate and filter relationship proposals to prevent duplicates and low-quality connections."""
        # Remove duplicates (same pair regardless of direction)
        seen_pairs: Set[Tuple[str, str]] = set()
        validated = []
        
        # Sort by strength to keep highest quality relationships
        sorted_proposals = sorted(proposals, key=lambda r: r.strength, reverse=True)
        
        for proposal in sorted_proposals:
            # Create normalized pair identifier
            pair = tuple(sorted([f"{proposal.from_type}:{proposal.from_id}", f"{proposal.to_type}:{proposal.to_id}"]))
            
            if pair not in seen_pairs and proposal.strength >= 0.3:
                seen_pairs.add(pair)
                validated.append(proposal)
                
                # Limit to prevent relationship explosion
                if len(validated) >= 25:
                    break
        
        return validated
    
    def _calculate_average_strength(self, proposals: List[RelationshipProposal]) -> float:
        """Calculate average strength of relationship proposals."""
        if not proposals:
            return 0.0
        return sum(p.strength for p in proposals) / len(proposals)
    
    async def _create_relationships(
        self,
        basket_id: UUID,
        proposals: List[RelationshipProposal],
        agent_id: str
    ) -> List[Dict[str, Any]]:
        """Create relationships via proper RPC calls."""
        if not proposals:
            return []
        
        try:
            # Prepare relationship data
            relationship_data = []
            for proposal in proposals:
                relationship_data.append({
                    "basket_id": str(basket_id),
                    "from_type": proposal.from_type,
                    "from_id": str(proposal.from_id),
                    "to_type": proposal.to_type,
                    "to_id": str(proposal.to_id),
                    "relationship_type": proposal.relationship_type,
                    "strength": proposal.strength,
                    "description": proposal.description,
                    "metadata": {
                        "generated_by": self.agent_name,
                        "pipeline": self.pipeline,
                        "agent_id": agent_id
                    }
                })
            
            # Use relationship RPC if available, otherwise direct insert
            try:
                # Try bulk upsert if RPC exists
                response = supabase.rpc('fn_relationship_upsert_bulk', {
                    'p_basket_id': str(basket_id),
                    'p_relationships': relationship_data,
                    'p_idem_key': f"graph_processing_{agent_id}_{datetime.utcnow().timestamp()}"
                }).execute()
                return response.data if response.data else []
                
            except Exception:
                # Fallback to direct insert
                response = supabase.table("substrate_relationships").insert(relationship_data).select().execute()
                return response.data if response.data else []
                
        except Exception as e:
            self.logger.error(f"Failed to create relationships: {e}")
            return []
    
    def get_agent_info(self) -> Dict[str, str]:
        """Get agent information."""
        return {
            "name": self.agent_name,
            "pipeline": self.pipeline,
            "type": "graph",
            "status": "active",
            "sacred_rule": "Creates relationships, never modifies substrate content"
        }