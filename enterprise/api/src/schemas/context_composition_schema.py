"""Schema definitions for context composition intelligence."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from uuid import UUID
import datetime

from shared.substrate.models.context import ContextItemType, CompositionIntent


class BlockRelevanceScore(BaseModel):
    """Relevance scoring for blocks based on composition context."""
    block_id: UUID
    relevance_score: float = Field(ge=0.0, le=1.0)
    context_alignment: float = Field(ge=0.0, le=1.0)
    composition_value: float = Field(ge=0.0, le=1.0)
    reasoning: str
    contributing_contexts: List[UUID]  # Context items that influenced this score


class ContextDiscoveryRequest(BaseModel):
    """Request for context-driven memory discovery."""
    basket_id: UUID
    target_contexts: List[UUID]  # Context items to discover for
    discovery_scope: str = Field(default="blocks", pattern="^(blocks|documents|all)$")
    include_related: bool = Field(default=True)
    max_results: int = Field(default=20, ge=1, le=100)
    min_relevance_threshold: float = Field(default=0.3, ge=0.0, le=1.0)


class ContextDiscoveryResult(BaseModel):
    """Result of context-driven discovery."""
    target_context_ids: List[UUID]
    discovered_blocks: List[BlockRelevanceScore]
    discovery_summary: str
    total_candidates_analyzed: int
    results_returned: int
    average_relevance_score: float


class CompositionAnalysisRequest(BaseModel):
    """Request for composition intelligence analysis."""
    basket_id: UUID
    analysis_focus: str = Field(default="comprehensive", pattern="^(intent|hierarchy|opportunities|comprehensive)$")
    include_suggestions: bool = Field(default=True)
    context_enhancement: bool = Field(default=True)


class IntentAnalysisResult(BaseModel):
    """Result of intent analysis for composition intelligence."""
    detected_intents: List[str]
    primary_intent: Optional[str] = None
    intent_confidence: float = Field(ge=0.0, le=1.0)
    audience_indicators: List[str]
    style_indicators: List[str]
    scope_indicators: List[str]
    reasoning: str


class CompositionOpportunity(BaseModel):
    """An identified opportunity for composition."""
    opportunity_type: str  # "strategic_brief", "technical_guide", "executive_summary"
    description: str
    required_contexts: List[str]  # Context types needed
    available_blocks: int
    composition_readiness: float = Field(ge=0.0, le=1.0)
    estimated_value: str = Field(pattern="^(high|medium|low)$")
    creation_complexity: str = Field(pattern="^(simple|medium|complex)$")


class ContextEnhancementSuggestion(BaseModel):
    """Suggestion for enhancing context for better composition."""
    target_id: UUID  # Block or document to enhance
    target_type: str = Field(pattern="^(block|document)$")
    suggested_context_type: ContextItemType
    suggested_content: str
    enhancement_reason: str
    composition_impact: str = Field(pattern="^(high|medium|low)$")
    confidence: float = Field(ge=0.0, le=1.0)


class CompositionIntelligenceReport(BaseModel):
    """Comprehensive composition intelligence report."""
    basket_id: UUID
    intent_analysis: IntentAnalysisResult
    composition_opportunities: List[CompositionOpportunity]
    context_enhancements: List[ContextEnhancementSuggestion]
    overall_composition_readiness: float = Field(ge=0.0, le=1.0)
    key_insights: List[str]
    recommended_next_steps: List[str]
    analysis_metadata: Dict[str, Any] = Field(default_factory=dict)
    generated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)


class ContextWeightUpdate(BaseModel):
    """Request to update context composition weights."""
    context_id: UUID
    new_weight: float = Field(ge=0.0, le=10.0)
    new_hierarchy_level: Optional[str] = Field(None, pattern="^(primary|secondary|supporting)$")
    reasoning: Optional[str] = None


class BulkContextEnhancement(BaseModel):
    """Request for bulk context enhancement."""
    basket_id: UUID
    enhancement_focus: str = Field(default="composition", pattern="^(composition|hierarchy|intent)$")
    auto_apply_high_confidence: bool = Field(default=False)
    confidence_threshold: float = Field(default=0.8, ge=0.0, le=1.0)


class CompositionReadinessAssessment(BaseModel):
    """Assessment of composition readiness for a basket."""
    basket_id: UUID
    readiness_score: float = Field(ge=0.0, le=1.0)
    context_coverage: float = Field(ge=0.0, le=1.0)
    intent_clarity: float = Field(ge=0.0, le=1.0)
    hierarchy_strength: float = Field(ge=0.0, le=1.0)
    block_alignment: float = Field(ge=0.0, le=1.0)
    
    # Specific readiness factors
    has_primary_context: bool
    has_clear_intent: bool
    sufficient_supporting_contexts: bool
    adequate_block_coverage: bool
    
    # Improvement recommendations
    improvement_areas: List[str]
    quick_wins: List[str]
    strategic_improvements: List[str]
    
    assessment_timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)