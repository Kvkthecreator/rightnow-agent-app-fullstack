"""
P2 Graph Agent - YARNNN Canon v2.1 Compliant

Sacred Rule: Creates relationships, never modifies substrate content
Pipeline: P2_GRAPH

This agent connects existing substrate elements without modifying
their content or creating new substrate. Integrates with enhanced
cascade manager for P2→P3 pipeline flow.
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Set, Tuple
from uuid import UUID
from pydantic import BaseModel, Field

from app.utils.supabase_client import supabase_admin_client as supabase
from services.enhanced_cascade_manager import canonical_cascade_manager

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
    relationship_type: str  # related_content, semantic_similarity, temporal_sequence, causal_relationship, enablement_chain, impact_relationship, conditional_logic
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
            
            # Trigger P2→P3 cascade if relationships were created
            await self._trigger_p2_cascade(
                request=request,
                relationships_created=len(created_relationships),
                processing_time_ms=processing_time_ms
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
        """Get substrate elements for relationship analysis - Canon compliant."""
        try:
            substrate_elements = []
            
            # Get blocks (exclude archived) - Canon: use canonical fields only
            blocks_response = supabase.table("blocks").select(
                "id,title,content,semantic_type,state,confidence_score"
            ).eq("basket_id", str(basket_id)).neq("state", "REJECTED").execute()
            
            if blocks_response.data:
                for block in blocks_response.data:
                    substrate_elements.append({
                        "id": block["id"],
                        "type": "block",
                        "title": block.get("title", "Untitled Block"),  # Canon: title is authoritative
                        "content": block.get("content", ""),  # Canon: content is authoritative
                        "semantic_type": block.get("semantic_type", "concept"),
                        "confidence": block.get("confidence_score", 0.7)  # Use actual confidence field
                    })
            
            # Get context items (exclude archived) - Canon: handle semantic meanings properly
            # HOTFIX: Use type field if kind doesn't exist yet (pre-migration)
            try:
                context_response = supabase.table("context_items").select(
                    "id,kind,content,title,state,semantic_meaning,semantic_category"
                ).eq("basket_id", str(basket_id)).neq("state", "REJECTED").execute()
            except Exception:
                # Fallback for pre-migration schema
                context_response = supabase.table("context_items").select(
                    "id,type,content,title,state,metadata"
                ).eq("basket_id", str(basket_id)).neq("state", "REJECTED").execute()
            
            if context_response.data:
                for item in context_response.data:
                    # Canon: title is entity label, content is semantic meaning
                    # HOTFIX: Handle missing title field in pre-migration schema
                    entity_label = item.get("title") or item.get("content", "Unknown Entity")[:50]
                    semantic_meaning = item.get("content", "") or item.get("semantic_meaning", "")
                    
                    # HOTFIX: Handle both kind (new) and type (old) fields
                    item_kind = item.get("kind") or item.get("type", "entity")
                    
                    substrate_elements.append({
                        "id": item["id"],
                        "type": "context_item", 
                        "title": entity_label,  # Canon: entity name/label
                        "content": semantic_meaning,  # Canon: semantic interpretation
                        "semantic_type": item_kind,  # Canon: use kind field with fallback
                        "semantic_category": item.get("semantic_category", "concept"),
                        "confidence": 0.8  # Context items are generally high confidence
                    })
            
            # Filter by requested substrate_ids if specified
            if substrate_ids:
                substrate_id_strs = [str(sid) for sid in substrate_ids]
                substrate_elements = [
                    elem for elem in substrate_elements 
                    if elem["id"] in substrate_id_strs
                ]
            
            self.logger.info(f"P2 Graph: Retrieved {len(substrate_elements)} substrate elements "
                           f"({len([e for e in substrate_elements if e['type'] == 'block'])} blocks, "
                           f"{len([e for e in substrate_elements if e['type'] == 'context_item'])} context items)")
            
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
                
                # CAUSAL RELATIONSHIP ANALYSIS (NEW - CRITICAL FOR INTELLIGENCE)
                causal_analysis = self._analyze_causal_relationships(elem1, elem2)
                for causal_rel in causal_analysis:
                    relationships.append(causal_rel)

                # Explicit context references (block ↔ context)
                context_reference = self._detect_context_reference(elem1, elem2)
                if context_reference:
                    relationships.append(context_reference)

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
        """Calculate content overlap between two substrate elements - Canon compliant."""
        # Canon: Use proper analyzable content (includes semantic meanings for context_items)
        content1 = self._get_analyzable_content(elem1).lower()
        content2 = self._get_analyzable_content(elem2).lower()
        
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
        """Calculate thematic connection strength between elements - Canon compliant."""
        # Canon: Use proper analyzable content for thematic analysis
        content1 = self._get_analyzable_content(elem1).lower()
        content2 = self._get_analyzable_content(elem2).lower()
        
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
    
    def _analyze_causal_relationships(self, elem1: Dict[str, Any], elem2: Dict[str, Any]) -> List[RelationshipProposal]:
        """
        CRITICAL: Analyze causal relationships between substrate elements - Canon compliant.
        This enables real intelligence by detecting HOW concepts connect and influence each other.
        """
        causal_relationships = []
        
        # Canon: Use proper content for analysis - blocks have content, context_items have semantic meaning
        content1 = self._get_analyzable_content(elem1).lower()
        content2 = self._get_analyzable_content(elem2).lower()
        
        if not content1 or not content2:
            return causal_relationships
        
        # CAUSAL RELATIONSHIP DETECTION
        causal_patterns = {
            "causal_relationship": [
                # Direct causation
                ("caused", "resulted in", "led to", "triggered", "enabled", "produced"),
                ("because of", "due to", "as a result of", "thanks to"),
                ("therefore", "thus", "consequently", "hence"),
                # Negative causation
                ("prevented", "stopped", "blocked", "hindered", "disrupted")
            ],
            "temporal_sequence": [
                # Time ordering
                ("before", "after", "then", "next", "following", "subsequently"),
                ("first", "second", "finally", "initially", "eventually"),
                ("earlier", "later", "meanwhile", "during", "while")
            ],
            "enablement_chain": [
                # Enabling relationships
                ("enabled", "allowed", "facilitated", "made possible"),
                ("required for", "prerequisite", "depends on", "needs"),
                ("supports", "provides", "supplies", "powers")
            ],
            "impact_relationship": [
                # Impact and consequences
                ("affected", "influenced", "changed", "modified", "improved"),
                ("degraded", "enhanced", "reduced", "increased", "amplified"),
                ("resulting in", "outcome", "consequence", "effect", "impact")
            ],
            "conditional_logic": [
                # If-then relationships
                ("if", "when", "whenever", "provided that", "assuming"),
                ("unless", "except", "only if", "given that"),
                ("depends on", "contingent on", "subject to")
            ]
        }
        
        # Check each relationship type
        for rel_type, pattern_groups in causal_patterns.items():
            # Check if elem1 contains causal triggers and elem2 contains effects
            for patterns in pattern_groups:
                elem1_has_pattern = any(pattern in content1 for pattern in patterns)
                elem2_has_pattern = any(pattern in content2 for pattern in patterns)
                
                # Check for cross-element causal relationships
                if elem1_has_pattern or elem2_has_pattern:
                    # Determine direction and strength
                    if elem1_has_pattern and elem2_has_pattern:
                        strength = 0.8  # Both have causal language
                    elif elem1_has_pattern:
                        strength = 0.7  # elem1 is likely the cause
                    else:
                        strength = 0.6  # elem2 is likely the cause
                    
                    # Add additional strength for semantic compatibility
                    if self._are_causally_compatible(elem1, elem2, rel_type):
                        strength += 0.1
                    
                    if strength >= 0.6:  # Threshold for causal relationships
                        causal_relationships.append(RelationshipProposal(
                            from_type=elem1["type"],
                            from_id=UUID(elem1["id"]),
                            to_type=elem2["type"],
                            to_id=UUID(elem2["id"]),
                            relationship_type=rel_type,
                            strength=min(0.95, strength),  # Cap at 0.95
                            description=f"{rel_type.replace('_', ' ').title()}: {elem1.get('title', 'Unknown')[:30]} → {elem2.get('title', 'Unknown')[:30]}"
                        ))
                        
                        # Limit causal relationships per pair
                        if len(causal_relationships) >= 3:
                            break
                
                if len(causal_relationships) >= 3:
                    break
        
        return causal_relationships

    def _get_analyzable_content(self, elem: Dict[str, Any]) -> str:
        """
        Get analyzable content for relationship analysis - Canon compliant.
        Blocks: title + content (facts/insights/actions)
        Context items: title + content (semantic meaning)
        """
        title = elem.get("title", "")
        content = elem.get("content", "")
        
        # Combine title and content for analysis
        analyzable = f"{title} {content}".strip()
        return analyzable if analyzable else ""

    def _detect_context_reference(self, elem1: Dict[str, Any], elem2: Dict[str, Any]) -> Optional[RelationshipProposal]:
        """Detect explicit block → context_item references via entity label mention - Canon compliant."""

        def build_relationship(src: Dict[str, Any], dst: Dict[str, Any]) -> Optional[RelationshipProposal]:
            if src.get("type") != "block" or dst.get("type") != "context_item":
                return None

            # Canon: context_item title is the entity label
            entity_label = dst.get("title", "").lower().strip()
            if not entity_label:
                return None

            # Check if block content/title mentions the entity
            block_text = (src.get("content", "") + " " + src.get("title", "")).lower()
            if entity_label in block_text:
                return RelationshipProposal(
                    from_type="block",
                    from_id=UUID(src["id"]),
                    to_type="context_item",
                    to_id=UUID(dst["id"]),
                    relationship_type="context_reference",
                    strength=0.75,
                    description=f"Block '{src.get('title', 'Unknown')[:30]}' references entity '{dst.get('title', 'Unknown')[:30]}'"
                )
            return None

        rel = build_relationship(elem1, elem2)
        if rel:
            return rel
        return build_relationship(elem2, elem1)

    def _are_causally_compatible(self, elem1: Dict[str, Any], elem2: Dict[str, Any], rel_type: str) -> bool:
        """Check if two elements are semantically compatible for causal relationships."""
        type1 = elem1.get("semantic_type", "").lower()
        type2 = elem2.get("semantic_type", "").lower()
        
        # Define causal compatibility patterns
        causal_compatible = {
            "causal_relationship": [
                ("action", "outcome"), ("event", "consequence"), ("decision", "result"),
                ("problem", "solution"), ("cause", "effect"), ("trigger", "response")
            ],
            "temporal_sequence": [
                ("event", "event"), ("action", "action"), ("milestone", "milestone"),
                ("step", "step"), ("phase", "phase")
            ],
            "enablement_chain": [
                ("resource", "action"), ("tool", "outcome"), ("capability", "achievement"),
                ("permission", "action"), ("requirement", "fulfillment")
            ],
            "impact_relationship": [
                ("action", "metric"), ("decision", "performance"), ("change", "outcome"),
                ("intervention", "result"), ("input", "output")
            ],
            "conditional_logic": [
                ("condition", "action"), ("requirement", "capability"), ("constraint", "solution"),
                ("rule", "behavior"), ("policy", "outcome")
            ]
        }
        
        compatible_pairs = causal_compatible.get(rel_type, [])
        
        for type_a, type_b in compatible_pairs:
            if (type_a in type1 and type_b in type2) or (type_b in type1 and type_a in type2):
                return True
        
        return False
    
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
                # FIXED: Split insert and select calls for Supabase client compatibility
                response = supabase.table("substrate_relationships").upsert(
                    relationship_data,
                    on_conflict="basket_id,from_type,from_id,relationship_type,to_type,to_id"
                ).execute()
                if response.data:
                    # Get the inserted records with all fields
                    inserted_ids = [record["id"] for record in response.data]
                    select_response = supabase.table("substrate_relationships").select("*").in_("id", inserted_ids).execute()
                    return select_response.data if select_response.data else []
                return []
                
        except Exception as e:
            self.logger.error(f"Failed to create relationships: {e}")
            return []
    
    async def _trigger_p2_cascade(
        self,
        request: RelationshipMappingRequest,
        relationships_created: int,
        processing_time_ms: int
    ):
        """
        Trigger P2→P3 cascade after successful relationship mapping.
        
        Creates P3 reflection work if relationships were successfully created.
        """
        try:
            if relationships_created > 0:
                # Create work_id for this P2 work (using request context)
                work_id = f"p2-graph-{request.agent_id}-{request.basket_id}"
                
                # Import WorkContext here to avoid circular imports
                from services.universal_work_tracker import WorkContext
                
                context = WorkContext(
                    user_id="system",  # System user for agent-triggered cascades
                    workspace_id=str(request.workspace_id),
                    basket_id=str(request.basket_id)
                )
                
                # Trigger cascade via enhanced cascade manager
                cascade_work_id = await canonical_cascade_manager.trigger_p2_graph_cascade(
                    work_id=work_id,
                    relationships_created=relationships_created,
                    context=context
                )
                
                if cascade_work_id:
                    self.logger.info(
                        f"P2→P3 cascade triggered: {relationships_created} relationships → work {cascade_work_id}"
                    )
                else:
                    self.logger.info(f"P2→P3 cascade skipped: {relationships_created} relationships")
            else:
                self.logger.info("No relationships created, skipping P2→P3 cascade")
                
        except Exception as e:
            # Don't fail P2 processing on cascade failure
            self.logger.error(f"P2→P3 cascade trigger failed: {e}")

    def get_agent_info(self) -> Dict[str, str]:
        """Get agent information."""
        return {
            "name": self.agent_name,
            "pipeline": self.pipeline,
            "type": "graph",
            "status": "active",
            "sacred_rule": "Creates relationships, never modifies substrate content",
            "canon_compliance": "fully_compliant",
            "improvements": "proper_field_usage,semantic_meaning_processing,enhanced_causal_analysis"
        }
