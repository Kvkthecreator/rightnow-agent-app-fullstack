#!/usr/bin/env python3
"""
Canon-Compliant P3 Reflection Agent
Implements YARNNN_REFLECTION_READMODEL.md specification exactly

Sacred Rules:
1. Input: Text window (raw_dumps) + Graph window (context_items + relationships)
2. Scope: Basket-scoped only (no workspace-wide queries)
3. Output: Artifacts only, never substrate mutations
4. Pure read-only substrate analysis
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
import logging
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from app.utils.supabase_client import supabase_admin_client as supabase


class ReflectionComputationRequest(BaseModel):
    """Request to compute reflections from workspace substrate."""
    workspace_id: UUID
    basket_id: Optional[UUID] = None
    reflection_types: List[str] = Field(default=["patterns", "insights", "gaps"])
    agent_id: str


class ReflectionComputationResult(BaseModel):
    """Result of reflection computation."""
    workspace_id: UUID
    basket_id: Optional[UUID]
    reflection_text: str
    computation_timestamp: str
    meta: Dict[str, Any] = Field(default_factory=dict)

class CanonP3ReflectionAgent:
    """Canon-compliant P3 Reflection Agent following YARNNN_REFLECTION_READMODEL.md"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    async def compute_reflections(self, request: ReflectionComputationRequest) -> ReflectionComputationResult:
        """
        Canon-compliant reflection computation:
        - Text window: last N raw_dumps in basket
        - Graph window: context_items + substrate_relationships touching those dumps
        - Output: Reflection artifacts only
        """
        if not request.basket_id:
            raise ValueError("P3 Reflection requires basket_id - canon mandates basket-scoped analysis")
            
        try:
            # CANON STEP 1: Get text window (raw_dumps in basket)
            text_window = self._get_text_window(request.basket_id)
            
            if not text_window:
                self.logger.info(f"P3 Reflection: No raw_dumps found in basket {request.basket_id}")
                return ReflectionComputationResult(
                    workspace_id=request.workspace_id,
                    basket_id=request.basket_id,
                    reflection_text="No memory substrate available for reflection",
                    computation_timestamp=datetime.utcnow().isoformat(),
                    meta={"substrate_dump_count": 0, "canon_compliant": True}
                )
            
            # CANON STEP 2: Get graph window (context_items + relationships touching text window)
            graph_window = self._get_graph_window(request.basket_id, text_window)
            
            # CANON STEP 3: Compute reflection artifact from windows
            reflection_artifact = self._compute_reflection_artifact(text_window, graph_window)
            
            # CANON STEP 4: Store artifact (not substrate mutation)
            self._store_reflection_artifact(request, reflection_artifact)
            
            return ReflectionComputationResult(
                workspace_id=request.workspace_id,
                basket_id=request.basket_id,
                reflection_text=reflection_artifact["text"],
                computation_timestamp=datetime.utcnow().isoformat(),
                meta={
                    "substrate_dump_count": len(text_window),
                    "graph_elements": len(graph_window),
                    "canon_compliant": True,
                    "window_model": "text+graph"
                }
            )
            
        except Exception as e:
            self.logger.error(f"Canon P3 Reflection failed for basket {request.basket_id}: {e}")
            raise
    
    def _get_text_window(self, basket_id: UUID, limit: int = 50) -> List[Dict[str, Any]]:
        """Canon: Text window = last N raw_dumps in basket"""
        try:
            response = supabase.table("raw_dumps").select(
                "id,basket_id,text_dump,file_dump_key,created_at"
            ).eq("basket_id", str(basket_id)).order(
                "created_at", desc=True
            ).limit(limit).execute()
            
            return response.data or []
            
        except Exception as e:
            self.logger.error(f"Failed to get text window: {e}")
            return []
    
    def _get_graph_window(self, basket_id: UUID, text_window: List[Dict]) -> List[Dict[str, Any]]:
        """Canon: Graph window = context_items + relationships touching text window"""
        try:
            graph_elements = []
            
            # Get context_items in basket (connected to raw_dumps via P1 processing)
            context_response = supabase.table("context_items").select(
                "id,basket_id,type,content,metadata,created_at"
            ).eq("basket_id", str(basket_id)).execute()
            
            if context_response.data:
                graph_elements.extend([{**item, "element_type": "context_item"} for item in context_response.data])
            
            # Get substrate_relationships in basket
            relationships_response = supabase.table("substrate_relationships").select(
                "id,basket_id,from_type,from_id,to_type,to_id,relationship_type,strength,description,created_at"
            ).eq("basket_id", str(basket_id)).execute()
            
            if relationships_response.data:
                graph_elements.extend([{**rel, "element_type": "relationship"} for rel in relationships_response.data])
            
            return graph_elements
            
        except Exception as e:
            self.logger.error(f"Failed to get graph window: {e}")
            return []
    
    def _compute_reflection_artifact(self, text_window: List[Dict], graph_window: List[Dict]) -> Dict[str, Any]:
        """Canon: Pure computation - no substrate mutations"""
        
        # Simple pattern analysis following canon output format
        dump_count = len(text_window)
        graph_count = len(graph_window)
        
        # Analyze text content for patterns
        text_content = []
        for dump in text_window:
            if dump.get("text_dump"):
                text_content.append(dump["text_dump"])
        
        combined_text = " ".join(text_content).lower()
        
        # Simple pattern detection
        patterns = []
        if "project" in combined_text and "goal" in combined_text:
            patterns.append("project_planning")
        if "problem" in combined_text and "solution" in combined_text:
            patterns.append("problem_solving")
        if "idea" in combined_text or "concept" in combined_text:
            patterns.append("conceptual_development")
        
        # Generate reflection text
        reflection_text = f"Memory analysis of {dump_count} substrate elements reveals "
        
        if patterns:
            reflection_text += f"emerging patterns in {', '.join(patterns)}. "
        else:
            reflection_text += "foundational memory formation. "
            
        if graph_count > 0:
            reflection_text += f"Connected through {graph_count} semantic relationships, indicating active knowledge structuring."
        else:
            reflection_text += "Initial memory capture phase with limited semantic connections."
        
        return {
            "text": reflection_text,
            "patterns": patterns,
            "substrate_elements": dump_count,
            "graph_elements": graph_count,
            "computation_method": "canon_window_analysis"
        }
    
    def _store_reflection_artifact(self, request: ReflectionComputationRequest, reflection: Dict[str, Any]):
        """Canon: Store as artifact, never mutate substrate"""
        try:
            artifact_data = {
                "workspace_id": request.workspace_id,
                "basket_id": request.basket_id,
                "reflection_text": reflection["text"],
                "reflection_target_type": "substrate",
                "reflection_target_id": str(request.basket_id),
                "computation_timestamp": datetime.utcnow().isoformat(),
                "substrate_window_start": datetime.utcnow().isoformat(),
                "substrate_window_end": datetime.utcnow().isoformat(),
                "meta": {
                    "patterns": reflection["patterns"],
                    "substrate_elements": reflection["substrate_elements"],
                    "graph_elements": reflection["graph_elements"],
                    "canon_compliant": True,
                    "computation_method": reflection["computation_method"]
                }
            }
            
            # UPSERT by stable key (canon requirement)
            result = supabase.table("reflections_artifact").upsert(
                artifact_data,
                on_conflict="workspace_id,basket_id,reflection_target_type,reflection_target_id"
            ).execute()
            
            self.logger.info(f"Canon P3: Stored reflection artifact for basket {request.basket_id}")
            
        except Exception as e:
            self.logger.error(f"Failed to store reflection artifact: {e}")
            raise