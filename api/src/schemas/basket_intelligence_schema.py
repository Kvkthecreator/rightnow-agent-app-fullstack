"""Schemas for flexible basket context intelligence and pattern recognition."""

from __future__ import annotations

from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field


class ThematicPattern(BaseModel):
    """A discovered thematic pattern within basket contents."""
    pattern_id: str
    theme_name: str
    keywords: List[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    evidence_sources: List[str] = Field(default_factory=list)  # document_ids, block_ids, context_ids
    pattern_strength: str = Field(default="medium")  # "weak", "medium", "strong"
    cross_document: bool = False  # Whether pattern spans multiple documents


class BasketThematicAnalysis(BaseModel):
    """Pattern recognition analysis of basket contents without enforcement."""
    basket_id: UUID
    analysis_timestamp: datetime = Field(default_factory=datetime.utcnow)
    dominant_themes: List[str] = Field(default_factory=list)
    theme_confidence: Dict[str, float] = Field(default_factory=dict)
    discovered_patterns: List[ThematicPattern] = Field(default_factory=list)
    content_diversity: float = Field(default=0.0, ge=0.0, le=1.0)
    coherence_level: str = Field(default="mixed")  # "high", "medium", "low", "mixed"
    inconsistency_areas: List[str] = Field(default_factory=list)
    thematic_summary: str = ""
    pattern_insights: List[str] = Field(default_factory=list)
    analysis_metadata: Dict[str, Any] = Field(default_factory=dict)


class CoherenceSuggestion(BaseModel):
    """A gentle suggestion for improving basket coherence (no enforcement)."""
    suggestion_id: str
    suggestion_type: str  # "context_link", "theme_clarification", "document_connection", etc.
    priority: str = Field(default="low")  # "low", "medium", "high"
    description: str
    reasoning: str
    suggested_action: str
    target_objects: List[UUID] = Field(default_factory=list)  # IDs of objects this suggestion relates to
    expected_benefit: str = ""
    effort_estimate: str = Field(default="low")  # "low", "medium", "high"
    user_choice_emphasis: str = "This is a suggestion - you decide if it's helpful"
    dismissible: bool = True  # Can user dismiss this suggestion permanently


class BasketCoherenceSuggestions(BaseModel):
    """Gentle suggestions for basket improvement without enforcement."""
    basket_id: UUID
    analysis_timestamp: datetime = Field(default_factory=datetime.utcnow)
    suggestions: List[CoherenceSuggestion] = Field(default_factory=list)
    priority_level: str = Field(default="low")  # Overall priority of suggestions
    user_choice_required: bool = False  # Whether any user action is needed
    suggestion_reasoning: str = ""
    accommodation_note: str = "Your basket works fine as-is. These are just ideas if you're interested."
    total_suggestions: int = 0
    high_value_suggestions: int = 0
    suggestions_metadata: Dict[str, Any] = Field(default_factory=dict)


class DocumentRelationship(BaseModel):
    """Discovered relationship between documents in basket."""
    relationship_id: str
    document_a_id: UUID
    document_b_id: UUID
    relationship_type: str  # "thematic_overlap", "sequential", "complementary", "conflicting"
    strength: float = Field(ge=0.0, le=1.0)
    connection_evidence: List[str] = Field(default_factory=list)
    suggested_links: List[str] = Field(default_factory=list)
    relationship_description: str = ""
    potential_value: str = Field(default="medium")  # "low", "medium", "high"


class CrossDocumentRelationships(BaseModel):
    """Discovered relationships between documents in basket."""
    basket_id: UUID
    analysis_timestamp: datetime = Field(default_factory=datetime.utcnow)
    document_pairs: List[DocumentRelationship] = Field(default_factory=list)
    relationship_strength: Dict[str, float] = Field(default_factory=dict)
    suggested_connections: List[str] = Field(default_factory=list)
    missed_opportunities: List[str] = Field(default_factory=list)
    overall_connectivity: float = Field(default=0.0, ge=0.0, le=1.0)
    connection_insights: List[str] = Field(default_factory=list)
    autonomy_note: str = "Documents maintain their independent context - these are connection opportunities"


class ContextInconsistency(BaseModel):
    """Identified context inconsistency (accommodated, not flagged as error)."""
    inconsistency_id: str
    inconsistency_type: str  # "intent_mismatch", "audience_conflict", "style_variation", "scope_difference"
    severity: str = Field(default="minor")  # "minor", "notable", "significant"
    description: str
    involved_objects: List[UUID] = Field(default_factory=list)
    accommodation_strategy: str = ""  # How the system accommodates this
    potential_value: str = ""  # Sometimes inconsistency is valuable
    user_benefit: str = "Inconsistency can indicate creative thinking or multi-faceted projects"


class BasketContextHealth(BaseModel):
    """Overall context health assessment (descriptive, not prescriptive)."""
    basket_id: UUID
    analysis_timestamp: datetime = Field(default_factory=datetime.utcnow)
    overall_health_score: float = Field(default=0.5, ge=0.0, le=1.0)  # Neutral default
    health_factors: Dict[str, Any] = Field(default_factory=dict)
    inconsistencies: List[ContextInconsistency] = Field(default_factory=list)
    accommodation_strategies: List[str] = Field(default_factory=list)
    flexibility_benefits: List[str] = Field(default_factory=list)
    health_insights: List[str] = Field(default_factory=list)
    human_compatibility_score: float = Field(default=0.8, ge=0.0, le=1.0)  # How well it works for humans
    health_note: str = "Context health reflects usefulness, not conformity to rigid structure"


class PatternAnalysisRequest(BaseModel):
    """Request for comprehensive basket pattern analysis."""
    basket_id: UUID
    analysis_depth: str = Field(default="standard")  # "light", "standard", "comprehensive"
    focus_areas: List[str] = Field(default_factory=list)  # Specific areas to analyze
    accommodate_inconsistency: bool = True  # Whether to accommodate rather than flag inconsistencies
    user_preferences: Dict[str, Any] = Field(default_factory=dict)
    include_suggestions: bool = True
    suggestion_gentleness: str = Field(default="gentle")  # "subtle", "gentle", "direct"


class BasketIntelligenceReport(BaseModel):
    """Comprehensive basket intelligence analysis report."""
    basket_id: UUID
    analysis_timestamp: datetime = Field(default_factory=datetime.utcnow)
    thematic_analysis: BasketThematicAnalysis
    coherence_suggestions: BasketCoherenceSuggestions
    document_relationships: CrossDocumentRelationships
    context_health: BasketContextHealth
    pattern_insights: List[str] = Field(default_factory=list)
    accommodation_summary: str = ""
    flexibility_assessment: str = ""
    human_value_proposition: str = ""
    next_steps_if_interested: List[str] = Field(default_factory=list)
    analysis_metadata: Dict[str, Any] = Field(default_factory=dict)


class SuggestionFeedback(BaseModel):
    """User feedback on basket intelligence suggestions."""
    suggestion_id: str
    feedback_type: str  # "helpful", "not_helpful", "dismissed", "implemented"
    user_comment: Optional[str] = None
    implementation_details: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class BasketImprovementGuidance(BaseModel):
    """Non-enforcing guidance for basket improvement."""
    basket_id: UUID
    guidance_timestamp: datetime = Field(default_factory=datetime.utcnow)
    guidance_type: str = Field(default="optional")  # "optional", "idea", "opportunity"
    improvement_opportunities: List[str] = Field(default_factory=list)
    gentle_recommendations: List[str] = Field(default_factory=list)
    user_autonomy_note: str = "You know your project best - these are just ideas to consider"
    no_pressure_message: str = "Your basket is working fine as-is"
    value_if_interested: List[str] = Field(default_factory=list)
    guidance_confidence: float = Field(default=0.6, ge=0.0, le=1.0)  # Modest confidence


class AgentBasketAnalysisRequest(BaseModel):
    """Request for agent-driven basket analysis."""
    agent_id: str
    agent_type: str = Field(pattern="^infra_.+")  # Only infra agents can analyze baskets
    basket_id: UUID
    analysis_goals: List[str] = Field(default_factory=list)
    analysis_constraints: List[str] = Field(default_factory=list)
    respect_inconsistency: bool = True
    suggestion_style: str = Field(default="gentle")  # "subtle", "gentle", "direct"
    focus_on_patterns: bool = True
    accommodate_messiness: bool = True


class ThematicEvolution(BaseModel):
    """How basket themes evolve over time."""
    basket_id: UUID
    evolution_period: str  # "week", "month", "quarter"
    theme_changes: List[Dict[str, Any]] = Field(default_factory=list)
    stability_score: float = Field(default=0.5, ge=0.0, le=1.0)
    evolution_insights: List[str] = Field(default_factory=list)
    natural_progression: bool = True  # Whether evolution seems natural
    evolution_value: str = "Theme evolution often indicates healthy project development"


class BasketFlexibilityMetrics(BaseModel):
    """Metrics about basket flexibility and accommodation."""
    basket_id: UUID
    flexibility_score: float = Field(default=0.8, ge=0.0, le=1.0)  # High default
    accommodation_examples: List[str] = Field(default_factory=list)
    inconsistency_tolerance: float = Field(default=0.9, ge=0.0, le=1.0)  # High tolerance
    human_compatibility: float = Field(default=0.85, ge=0.0, le=1.0)
    messiness_handling: str = "Graceful accommodation of human context patterns"
    flexibility_benefits: List[str] = Field(default_factory=list)
    rigidity_warnings: List[str] = Field(default_factory=list)  # What NOT to enforce