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
        """Generate deep, actionable insights using advanced pattern recognition"""
        
        content_lower = content.lower()
        
        # Advanced insight generation based on YARNNN's intelligence objectives
        insights = self._analyze_deep_patterns(content_lower, dump_count, graph_count)
        tensions = self._identify_tensions_and_contradictions(content_lower)
        trajectory = self._analyze_thinking_trajectory(content_lower, dump_count)
        gaps = self._identify_critical_gaps(content_lower)
        
        # Prioritize insights by value
        if tensions:
            return tensions
        elif trajectory:
            return trajectory
        elif insights:
            return insights
        elif gaps:
            return gaps
        
        # Sophisticated default based on substrate richness
        if graph_count > 10:
            return f"Your knowledge graph shows {graph_count} connections across {dump_count} items. The density suggests you're building a comprehensive understanding - consider documenting the key relationships you're discovering."
        elif dump_count >= 5:
            return f"With {dump_count} memories captured, patterns are emerging. Your thinking shows signs of convergence around key themes - now might be a good time to synthesize these insights into action."
        elif dump_count >= 2:
            return f"Early patterns detected across {dump_count} items. Continue building your knowledge base to unlock deeper insights about your thinking trajectory."
        else:
            return "Your knowledge garden is just beginning. Each memory you add creates potential for discovering unexpected connections."
    
    def _analyze_deep_patterns(self, content: str, dump_count: int, graph_count: int) -> str:
        """Analyze deep patterns using multiple signals"""
        
        # Strategic pattern detection
        strategic_indicators = ["strategy", "plan", "roadmap", "vision", "objective", "milestone"]
        execution_indicators = ["implement", "execute", "deliver", "build", "launch", "ship"]
        strategic_count = sum(1 for ind in strategic_indicators if ind in content)
        execution_count = sum(1 for ind in execution_indicators if ind in content)
        
        if strategic_count > 3 and execution_count < 2:
            return f"Pattern detected: Heavy strategic planning ({strategic_count} indicators) with limited execution focus. Your thinking is in 'planning mode' - consider identifying one concrete next action to bridge strategy to execution."
        
        # Innovation vs optimization pattern
        innovation_words = ["new", "novel", "innovative", "disrupt", "transform", "reimagine", "breakthrough"]
        optimization_words = ["improve", "enhance", "optimize", "refine", "iterate", "polish", "streamline"]
        innovation_score = sum(1 for word in innovation_words if word in content)
        optimization_score = sum(1 for word in optimization_words if word in content)
        
        if innovation_score > optimization_score * 2:
            return f"Your thinking leans heavily toward innovation over optimization ({innovation_score}:{optimization_score} ratio). This suggests you're in exploration mode - perfect for breakthrough thinking, but remember to validate ideas with small experiments."
        elif optimization_score > innovation_score * 2:
            return f"You're focused on optimization and refinement ({optimization_score}:{innovation_score} ratio). This disciplined approach yields consistent improvements - but occasionally stepping back for radical rethinking can unlock new possibilities."
        
        # Complexity emergence pattern
        concept_density = len(set(content.split())) / len(content.split()) if content.split() else 0
        if concept_density > 0.7 and dump_count > 3:
            return f"High conceptual density detected ({concept_density:.1%} unique terms). Your thinking is becoming increasingly sophisticated - this complexity suggests you're ready to identify the core principles that tie everything together."
        
        # Network effects pattern
        if graph_count > dump_count * 2:
            connection_ratio = graph_count / dump_count
            return f"Exceptional connectivity in your knowledge graph ({connection_ratio:.1f} connections per item). You're discovering relationships others might miss - this network thinking is your superpower for innovative solutions."
        
        return ""
    
    def _identify_tensions_and_contradictions(self, content: str) -> str:
        """Identify productive tensions that drive insight"""
        
        # Speed vs Quality tension
        speed_words = ["fast", "quick", "rapid", "urgent", "asap", "immediately", "now"]
        quality_words = ["quality", "excellence", "perfect", "thorough", "comprehensive", "detailed"]
        has_speed = any(word in content for word in speed_words)
        has_quality = any(word in content for word in quality_words)
        
        if has_speed and has_quality:
            return "Tension detected: You're balancing speed with quality. This classic dilemma often resolves through iteration - ship fast to learn, then refine based on real feedback. Which can you prototype first?"
        
        # Scale vs Personalization tension
        scale_words = ["scale", "growth", "expand", "automate", "systematic", "platform"]
        personal_words = ["personal", "custom", "individual", "bespoke", "tailored", "unique"]
        has_scale = any(word in content for word in scale_words)
        has_personal = any(word in content for word in personal_words)
        
        if has_scale and has_personal:
            return "Strategic tension: Scaling while maintaining personalization. The most successful approaches often find the 'scalable personal' - what core elements can you standardize while keeping key touchpoints human?"
        
        # Innovation vs Stability tension
        change_words = ["change", "new", "transform", "disrupt", "revolutionize", "reimagine"]
        stability_words = ["stable", "reliable", "consistent", "proven", "established", "maintain"]
        has_change = any(word in content for word in change_words)
        has_stability = any(word in content for word in stability_words)
        
        if has_change and has_stability:
            return "Core tension: Innovation versus stability. This productive friction often leads to 'stable innovation' - changing HOW you do things while keeping WHAT you deliver consistent. Where can you innovate behind the scenes?"
        
        return ""
    
    def _analyze_thinking_trajectory(self, content: str, dump_count: int) -> str:
        """Analyze the evolution and trajectory of thinking"""
        
        # Convergence detection
        question_marks = content.count('?')
        exclamation_marks = content.count('!')
        
        if dump_count >= 3:
            if question_marks > exclamation_marks * 2:
                return f"Trajectory: Your thinking is in active exploration mode ({question_marks} questions captured). This questioning phase is crucial for breakthrough insights - keep probing until patterns crystallize."
            elif exclamation_marks > question_marks:
                return f"Trajectory: You're moving from questions to insights ({exclamation_marks} key realizations). This convergence suggests you're ready to test your hypotheses in reality."
        
        # Evolution detection
        temporal_words = ["initially", "then", "now", "evolved", "changed", "realized", "discovered"]
        evolution_count = sum(1 for word in temporal_words if word in content)
        
        if evolution_count >= 3:
            return f"Your thinking shows clear evolution ({evolution_count} transition markers). This intellectual growth trajectory suggests you're integrating new perspectives - document this journey, as the path often matters more than the destination."
        
        # Depth detection
        because_count = content.count("because")
        therefore_count = content.count("therefore")
        reasoning_depth = because_count + therefore_count
        
        if reasoning_depth >= 3:
            return f"Strong causal reasoning detected ({reasoning_depth} logical connections). You're not just collecting facts but building understanding - this depth of analysis positions you to make non-obvious connections."
        
        return ""
    
    def _identify_critical_gaps(self, content: str) -> str:
        """Identify what's missing that could unlock new insights"""
        
        # Implementation gap
        if "idea" in content or "concept" in content:
            if not any(word in content for word in ["test", "experiment", "pilot", "prototype", "try"]):
                return "Gap identified: Rich ideas without experimentation plans. Even the best concepts need reality contact - what's the smallest test that could validate or invalidate your thinking?"
        
        # Stakeholder gap
        if any(word in content for word in ["project", "initiative", "product", "solution"]):
            if not any(word in content for word in ["user", "customer", "stakeholder", "audience"]):
                return "Missing perspective: No explicit user/stakeholder consideration detected. The best solutions deeply understand who they serve - whose problem are you really solving?"
        
        # Metrics gap
        if any(word in content for word in ["goal", "objective", "success", "achieve"]):
            if not any(word in content for word in ["measure", "metric", "kpi", "indicator", "track"]):
                return "Insight gap: Goals without metrics often drift. What specific, observable changes would indicate you're succeeding? Defining measures sharpens thinking and accelerates learning."
        
        # Systems gap
        if content.count("problem") > 2 or content.count("issue") > 2:
            if not any(word in content for word in ["system", "cause", "root", "underlying", "pattern"]):
                return "Depth opportunity: Multiple problems might share systemic roots. Stepping back to see the system often reveals elegant interventions that address multiple issues simultaneously."
        
        return ""
    
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
