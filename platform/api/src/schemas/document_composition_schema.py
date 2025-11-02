"""Schemas for context-driven document composition."""

from __future__ import annotations

from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field


class ContextDrivenCompositionRequest(BaseModel):
    """Request for creating a context-driven document."""
    basket_id: UUID
    title: Optional[str] = None  # Auto-generated from context if not provided
    primary_context_ids: List[UUID] = Field(default_factory=list)  # Context DNA drivers
    composition_intent: Optional[str] = None  # Override intent detection
    target_audience: Optional[str] = None  # Override audience detection
    style_preference: Optional[str] = None  # Override style detection
    max_blocks: int = Field(default=15, ge=1, le=50)  # Limit discovered blocks
    include_supporting_contexts: bool = True  # Include secondary/supporting contexts
    auto_generate_structure: bool = True  # Let AI determine document structure
    custom_instructions: Optional[str] = None  # Additional composition guidance


class CompositionFromIntentRequest(BaseModel):
    """Request for creating document from detected intent."""
    basket_id: UUID
    title: Optional[str] = None
    detected_intent: str  # From intent analysis
    confidence_threshold: float = Field(default=0.6, ge=0.0, le=1.0)
    max_blocks: int = Field(default=15, ge=1, le=50)
    enhance_with_discovery: bool = True  # Use context discovery for additional blocks


class DocumentRecompositionRequest(BaseModel):
    """Request for recomposing existing document with new context DNA."""
    document_id: UUID
    new_primary_context_ids: Optional[List[UUID]] = None
    composition_intent: Optional[str] = None
    target_audience: Optional[str] = None
    style_preference: Optional[str] = None
    preserve_custom_content: bool = True  # Keep manually added content
    recomposition_reason: Optional[str] = None


class DiscoveredBlock(BaseModel):
    """Block discovered through context-driven analysis."""
    block_id: UUID
    content: str
    semantic_type: str
    state: str
    relevance_score: float = Field(ge=0.0, le=1.0)
    context_alignment: float = Field(ge=0.0, le=1.0)
    composition_value: float = Field(ge=0.0, le=1.0)
    discovery_reasoning: str
    contributing_contexts: List[UUID] = Field(default_factory=list)
    section_placement: Optional[str] = None  # Suggested document section


class CompositionContext(BaseModel):
    """Context DNA information used for composition."""
    primary_contexts: List[Dict[str, Any]] = Field(default_factory=list)
    secondary_contexts: List[Dict[str, Any]] = Field(default_factory=list)
    supporting_contexts: List[Dict[str, Any]] = Field(default_factory=list)
    detected_intent: Optional[str] = None
    intent_confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    target_audience: Optional[str] = None
    composition_style: Optional[str] = None
    composition_scope: Optional[str] = None
    hierarchy_strength: float = Field(default=0.0, ge=0.0, le=1.0)
    context_coherence: float = Field(default=0.0, ge=0.0, le=1.0)


class NarrativeIntelligence(BaseModel):
    """Intelligence metadata about narrative generation."""
    generation_approach: str  # "context_driven", "template_based", "agent_composed"
    narrative_style: str  # "formal", "conversational", "detailed"
    structure_type: str  # "linear", "hierarchical", "thematic"
    audience_adaptation: Dict[str, Any] = Field(default_factory=dict)
    style_elements: List[str] = Field(default_factory=list)
    content_organization: Dict[str, Any] = Field(default_factory=dict)
    generation_confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    enhancement_suggestions: List[str] = Field(default_factory=list)


class DocumentSection(BaseModel):
    """Individual section of a context-driven document."""
    section_id: str
    title: str
    content: str
    section_type: str  # "introduction", "main", "conclusion", "appendix"
    context_alignment: float = Field(ge=0.0, le=1.0)
    contributing_blocks: List[UUID] = Field(default_factory=list)
    contributing_contexts: List[UUID] = Field(default_factory=list)
    generation_metadata: Dict[str, Any] = Field(default_factory=dict)


class ContextDrivenDocument(BaseModel):
    """Complete context-driven document with intelligence metadata."""
    id: UUID
    title: str
    content_raw: str  # Context-driven markdown
    content_rendered: str  # Processed content
    composition_context: CompositionContext  # Context DNA used
    discovered_blocks: List[DiscoveredBlock]  # Context-surfaced blocks
    narrative_intelligence: NarrativeIntelligence  # Generation metadata
    context_coherence_score: float = Field(ge=0.0, le=1.0)  # Semantic coherence rating
    document_sections: List[DocumentSection] = Field(default_factory=list)
    composition_metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime
    created_by_agent: Optional[str] = None
    workspace_id: str
    basket_id: UUID


class DocumentContextAlignment(BaseModel):
    """Analysis of document alignment with context DNA."""
    document_id: UUID
    overall_alignment_score: float = Field(ge=0.0, le=1.0)
    context_coverage: float = Field(ge=0.0, le=1.0)  # How well contexts are represented
    intent_alignment: float = Field(ge=0.0, le=1.0)  # Match with detected intent
    audience_appropriateness: float = Field(ge=0.0, le=1.0)  # Audience match
    style_consistency: float = Field(ge=0.0, le=1.0)  # Style adherence
    content_coherence: float = Field(ge=0.0, le=1.0)  # Internal coherence
    missing_contexts: List[UUID] = Field(default_factory=list)
    underrepresented_contexts: List[UUID] = Field(default_factory=list)
    alignment_issues: List[Dict[str, Any]] = Field(default_factory=list)
    enhancement_opportunities: List[Dict[str, Any]] = Field(default_factory=list)
    analysis_timestamp: datetime


class CompositionSuggestion(BaseModel):
    """Suggestion for document composition."""
    suggestion_id: str
    composition_type: str  # "strategic_analysis", "technical_guide", etc.
    suggested_title: str
    confidence: float = Field(ge=0.0, le=1.0)
    primary_contexts: List[UUID] = Field(default_factory=list)
    estimated_block_count: int
    target_audience: Optional[str] = None
    suggested_style: Optional[str] = None
    composition_rationale: str
    expected_value: str  # "high", "medium", "low"
    creation_complexity: str  # "simple", "medium", "complex"
    prerequisite_contexts: List[str] = Field(default_factory=list)  # Missing context types


class AgentCompositionRequest(BaseModel):
    """Request for agent-driven document composition."""
    agent_id: str
    agent_type: str = Field(pattern="^tasks_.+")  # Only tasks agents can compose
    basket_id: UUID
    composition_goal: str  # High-level goal for the document
    composition_constraints: List[str] = Field(default_factory=list)
    max_blocks: int = Field(default=20, ge=1, le=50)
    preferred_style: Optional[str] = None
    target_audience: Optional[str] = None
    custom_instructions: Optional[str] = None
    auto_title_generation: bool = True


class CompositionOpportunityAnalysis(BaseModel):
    """Analysis of composition opportunities for a basket."""
    basket_id: UUID
    total_opportunities: int
    high_value_opportunities: int
    composition_readiness_score: float = Field(ge=0.0, le=1.0)
    suggested_compositions: List[CompositionSuggestion] = Field(default_factory=list)
    missing_context_types: List[str] = Field(default_factory=list)
    context_gaps: List[Dict[str, Any]] = Field(default_factory=list)
    recommended_next_steps: List[str] = Field(default_factory=list)
    analysis_metadata: Dict[str, Any] = Field(default_factory=dict)


class DocumentEvolutionRequest(BaseModel):
    """Request for evolving document with new context intelligence."""
    document_id: UUID
    evolution_type: str = Field(pattern="^(refresh|expand|refocus|restructure)$")
    new_context_ids: List[UUID] = Field(default_factory=list)
    evolution_guidance: Optional[str] = None
    preserve_manual_edits: bool = True
    revalidate_context_alignment: bool = True


class DocumentEvolutionResult(BaseModel):
    """Result of document evolution operation."""
    document_id: UUID
    evolution_type: str
    changes_made: List[str] = Field(default_factory=list)
    content_diff: Dict[str, Any] = Field(default_factory=dict)
    new_coherence_score: float = Field(ge=0.0, le=1.0)
    context_alignment_change: float  # Positive = improved, negative = degraded
    blocks_added: int = 0
    blocks_removed: int = 0
    sections_modified: List[str] = Field(default_factory=list)
    evolution_success: bool
    evolution_reasoning: str