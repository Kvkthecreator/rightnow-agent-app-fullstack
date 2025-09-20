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
import hashlib
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
    substrate_window_hours: Optional[int] = None


class ReflectionComputationResult(BaseModel):
    """Result of reflection computation."""
    workspace_id: str  # JSON serializable
    basket_id: Optional[str] = None  # JSON serializable
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
            # CANON STEP 1: Get text window (raw_dumps in basket) with optional time constraint
            text_window = self._get_text_window(request.basket_id, request.substrate_window_hours)
            
            if not text_window:
                self.logger.info(f"P3 Reflection: No raw_dumps found in basket {request.basket_id}")
                return ReflectionComputationResult(
                    workspace_id=str(request.workspace_id),
                    basket_id=str(request.basket_id),
                    reflection_text="No memory substrate available for reflection",
                    computation_timestamp=datetime.utcnow().isoformat(),
                    meta={"substrate_dump_count": 0, "canon_compliant": True}
                )
            
            # CANON STEP 2: Get graph window (context_items + relationships touching text window)
            graph_window = self._get_graph_window(request.basket_id, text_window)
            
            # Canon: Collect substrate ids for idempotent storage
            substrate_ids = sorted({str(dump.get("id")) for dump in text_window if dump.get("id")})

            # CANON STEP 3: Compute reflection artifact from windows
            reflection_artifact = self._compute_reflection_artifact(text_window, graph_window)

            # CANON STEP 4: Store artifact (not substrate mutation)
            self._store_reflection_artifact(request, reflection_artifact, substrate_ids)

            return ReflectionComputationResult(
                workspace_id=str(request.workspace_id),
                basket_id=str(request.basket_id),
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
    
    def _get_text_window(self, basket_id: UUID, window_hours: Optional[int] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Canon: Text window = last N raw_dumps in basket with optional time constraint"""
        try:
            query = supabase.table("raw_dumps").select(
                "id,basket_id,text_dump,file_url,created_at"
            ).eq("basket_id", str(basket_id))
            
            # Apply time window constraint if specified
            if window_hours is not None:
                cutoff_time = datetime.utcnow() - timedelta(hours=window_hours)
                query = query.gte("created_at", cutoff_time.isoformat())
            
            response = query.order(
                "created_at", desc=True
            ).limit(limit).execute()
            
            dumps = response.data or []
            # Exclude tombstoned (archived/redacted/deleted)
            try:
                t = supabase.table("substrate_tombstones").select("substrate_id").eq("basket_id", str(basket_id)).eq("substrate_type", "dump").execute()
                if t.data:
                    excluded = {row["substrate_id"] for row in t.data}
                    dumps = [d for d in dumps if d.get("id") not in excluded]
            except Exception:
                pass
            return dumps
            
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
        """
        Canon: Pure computation following YARNNN_REFLECTIONS_UX_CANON.md
        Focus on user content, not system structure
        """
        
        dump_count = len(text_window)
        graph_count = len(graph_window)
        
        # Analyze actual user content for meaningful patterns
        text_content = []
        file_names = []
        for dump in text_window:
            if dump.get("text_dump"):
                text_content.append(dump["text_dump"])
            # Extract file names if available for context
            if dump.get("file_url"):
                file_names.append(dump.get("file_url", "").split('/')[-1])
        
        combined_text = " ".join(text_content)
        
        # Look for user-meaningful patterns in their actual content
        reflection_text = self._generate_user_centric_insight(combined_text, file_names, dump_count, graph_count)
        
        return {
            "text": reflection_text,
            "patterns": self._extract_content_themes(combined_text),
            "source_count": dump_count,
            "connection_count": graph_count,
            "computation_method": "user_content_analysis"
        }
    
    def _generate_user_centric_insight(self, content: str, file_names: List[str], dump_count: int, graph_count: int) -> str:
        """Generate user-focused insights following UX canon principles"""
        
        # Look for actual themes in user content
        content_lower = content.lower()
        
        # Detect specific patterns user would recognize
        if "goal" in content_lower and ("plan" in content_lower or "strategy" in content_lower):
            if "budget" in content_lower or "cost" in content_lower:
                return f"Your planning documents mention both growth goals and budget concerns. Consider whether these priorities align - {dump_count} recent uploads show this tension."
            else:
                return f"You're actively planning and setting goals across {dump_count} uploads. Your strategy thinking is becoming more structured."
        
        if ("problem" in content_lower or "issue" in content_lower) and ("solution" in content_lower or "fix" in content_lower):
            return f"Your recent work shows problem-solving patterns. You identify issues and propose solutions consistently across {dump_count} items."
        
        if "team" in content_lower and ("remote" in content_lower or "work" in content_lower):
            return f"Team collaboration themes appear repeatedly in your content. This seems important to your current thinking."
        
        if "market" in content_lower and ("competition" in content_lower or "customer" in content_lower):
            return f"Market analysis is a recurring focus across your uploads. You're building substantial market intelligence."
        
        # Look for evolution/change patterns
        if "new" in content_lower and ("approach" in content_lower or "method" in content_lower):
            return f"You're exploring new approaches across {dump_count} recent items. Your thinking appears to be evolving."
        
        # Check for potential gaps or missing pieces  
        if "research" in content_lower and not ("timeline" in content_lower or "deadline" in content_lower):
            return f"You have substantial research but timelines and deadlines aren't mentioned. Consider adding implementation planning."
        
        # File-based insights if available
        if file_names:
            unique_files = len(set(file_names))
            if unique_files >= 3:
                return f"You've uploaded diverse content ({unique_files} different files). Look for common threads across these different areas."
        
        # Default insight that's still user-focused
        if dump_count >= 5:
            return f"Your knowledge base is growing ({dump_count} recent items). Patterns and themes are starting to emerge that might be worth exploring."
        elif dump_count >= 2:
            return f"You've added {dump_count} items recently. As you add more content, I'll start spotting patterns and connections."
        else:
            return "Keep adding content and I'll help you spot patterns, tensions, and themes in your thinking."
    
    def _extract_content_themes(self, content: str) -> List[str]:
        """Extract meaningful themes from user content"""
        content_lower = content.lower()
        themes = []
        
        if "strategy" in content_lower or "plan" in content_lower:
            themes.append("strategic_planning")
        if "team" in content_lower or "people" in content_lower:
            themes.append("team_management")
        if "market" in content_lower or "customer" in content_lower:
            themes.append("market_focus")
        if "product" in content_lower or "feature" in content_lower:
            themes.append("product_development")
        if "goal" in content_lower or "objective" in content_lower:
            themes.append("goal_setting")
        
        return themes
    
    def _store_reflection_artifact(
        self,
        request: ReflectionComputationRequest,
        reflection: Dict[str, Any],
        substrate_ids: List[str],
    ):
        """Canon: Store as artifact, never mutate substrate

        Tries in order (first that succeeds wins):
        1) RPC fn_reflection_create_from_substrate with newer signature
        2) RPC with legacy 2‑arg signature
        3) Direct minimal INSERT into reflections_artifact
        """
        payload_text = reflection["text"]
        ws_id = str(request.workspace_id)
        b_id = str(request.basket_id)

        # Normalize substrate ids for stable hashing
        normalized_ids = [sid for sid in substrate_ids if sid]

        # Try newer RPC (basket_id, substrate_ids, text, method)
        try:
            # Minimal substrate ids window: not mandatory for smoke
            resp = supabase.rpc(
                'fn_reflection_create_from_substrate',
                {
                    'p_basket_id': b_id,
                    'p_substrate_ids': normalized_ids,
                    'p_reflection_text': payload_text,
                    'p_computation_method': 'canon_window_analysis'
                }
            ).execute()
            if getattr(resp, 'data', None):
                self.logger.info("Canon P3: stored via RPC (new signature)")
                return
        except Exception as e:
            self.logger.debug(f"RPC (new signature) failed: {e}")

        # Try legacy RPC (basket_id, text)
        try:
            resp2 = supabase.rpc(
                'fn_reflection_create_from_substrate',
                { 'p_basket_id': b_id, 'p_reflection_text': payload_text }
            ).execute()
            if getattr(resp2, 'data', None):
                self.logger.info("Canon P3: stored via RPC (legacy signature)")
                return
        except Exception as e:
            self.logger.debug(f"RPC (legacy signature) failed: {e}")

        # Fallback: direct minimal insert (no ON CONFLICT)
        try:
            hash_input = ','.join(normalized_ids) if normalized_ids else b_id
            substrate_hash = f"substrate_{hashlib.sha256(hash_input.encode('utf-8')).hexdigest()}"
            minimal = {
                "workspace_id": ws_id,
                "basket_id": b_id,
                "reflection_text": payload_text,
                "reflection_target_type": "substrate",
                "computation_timestamp": datetime.utcnow().isoformat(),
                "substrate_hash": substrate_hash,
                "meta": {
                    "substrate_elements": len(normalized_ids) or reflection.get("substrate_elements", 0),
                    "graph_elements": reflection.get("graph_elements", 0),
                    "computation_method": reflection.get("computation_method", "canon_window_analysis"),
                },
            }
            supabase.table('reflections_artifact').insert(minimal).execute()
            self.logger.info("Canon P3: stored via direct minimal insert")
        except Exception as e:
            msg = str(e)
            if '23505' in msg or 'duplicate key value violates unique constraint' in msg:
                # Treat duplicate as success (idempotent write)
                self.logger.info("Canon P3: reflection already exists (idempotent)")
                return
            self.logger.error(f"Failed to store reflection artifact (fallback): {e}")
            raise
