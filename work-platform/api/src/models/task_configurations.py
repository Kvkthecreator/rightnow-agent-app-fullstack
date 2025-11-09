"""
Agent-specific task configuration models.

Each agent type has specific input requirements for optimal execution.
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import date


# ============================================================================
# RESEARCH AGENT CONFIGURATIONS
# ============================================================================

class ResearchScope(BaseModel):
    """Research scope parameters."""

    domains: Optional[List[str]] = Field(
        None,
        description="Specific domains to research (e.g., ['healthcare AI', 'enterprise tools'])"
    )

    timeframe_start_date: Optional[date] = Field(
        None,
        description="Research timeframe start date"
    )

    timeframe_lookback_days: Optional[int] = Field(
        None,
        ge=1,
        le=365,
        description="Research lookback period in days (alternative to start_date)"
    )

    depth: Literal["overview", "detailed", "comprehensive"] = Field(
        "detailed",
        description="Research depth level"
    )

    focus_areas: Optional[List[str]] = Field(
        None,
        description="Specific focus areas (e.g., ['pricing', 'technology', 'market share'])"
    )


class ResearchOutputPreferences(BaseModel):
    """Research output preferences."""

    format: Literal["summary", "detailed_report", "structured_data"] = Field(
        "detailed_report",
        description="Output format preference"
    )

    max_findings: int = Field(
        10,
        ge=1,
        le=50,
        description="Maximum number of findings to return"
    )

    confidence_threshold: float = Field(
        0.7,
        ge=0.0,
        le=1.0,
        description="Minimum confidence threshold for including findings"
    )


class ResearchConstraints(BaseModel):
    """Research constraints."""

    exclude_sources: Optional[List[str]] = Field(
        None,
        description="Sources to exclude (e.g., ['wikipedia'])"
    )

    must_include: Optional[List[str]] = Field(
        None,
        description="Required source types (e.g., ['peer-reviewed sources'])"
    )

    budget_tokens: Optional[int] = Field(
        None,
        ge=1000,
        description="Maximum LLM tokens to spend on research"
    )


class ResearchTaskConfiguration(BaseModel):
    """Complete research agent task configuration."""

    research_scope: ResearchScope = Field(
        default_factory=ResearchScope,
        description="Research scope parameters"
    )

    output_preferences: ResearchOutputPreferences = Field(
        default_factory=ResearchOutputPreferences,
        description="Output preferences"
    )

    constraints: Optional[ResearchConstraints] = Field(
        None,
        description="Research constraints"
    )


# ============================================================================
# CONTENT CREATOR AGENT CONFIGURATIONS
# ============================================================================

class ContentSpec(BaseModel):
    """Content specification parameters."""

    platform: Literal["linkedin", "twitter", "blog", "email", "landing_page", "general"] = Field(
        "general",
        description="Target platform for content"
    )

    tone: Literal["professional", "casual", "technical", "promotional"] = Field(
        "professional",
        description="Content tone"
    )

    target_audience: str = Field(
        ...,
        min_length=3,
        max_length=200,
        description="Target audience description (e.g., 'Enterprise CTOs')"
    )

    word_count_min: Optional[int] = Field(
        None,
        ge=10,
        description="Minimum word count"
    )

    word_count_max: Optional[int] = Field(
        None,
        le=10000,
        description="Maximum word count"
    )


class BrandRequirements(BaseModel):
    """Brand alignment requirements."""

    use_brand_voice: bool = Field(
        True,
        description="Align content with brand voice from context"
    )

    include_cta: bool = Field(
        False,
        description="Include call-to-action in content"
    )

    reference_blocks: Optional[List[str]] = Field(
        None,
        description="Specific substrate block IDs to reference (UUIDs as strings)"
    )


class ContentTaskConfiguration(BaseModel):
    """Complete content creator agent task configuration."""

    content_spec: ContentSpec = Field(
        ...,
        description="Content specification"
    )

    brand_requirements: BrandRequirements = Field(
        default_factory=BrandRequirements,
        description="Brand alignment requirements"
    )

    variations_count: int = Field(
        1,
        ge=1,
        le=5,
        description="Number of content variations to generate"
    )


# ============================================================================
# REPORTING AGENT CONFIGURATIONS
# ============================================================================

class ReportSpec(BaseModel):
    """Report specification parameters."""

    report_type: Literal["executive_summary", "progress_report", "analytics", "custom"] = Field(
        "executive_summary",
        description="Type of report to generate"
    )

    time_period_start: date = Field(
        ...,
        description="Report time period start date"
    )

    time_period_end: date = Field(
        ...,
        description="Report time period end date"
    )

    sections_required: List[str] = Field(
        default_factory=lambda: ["Overview", "Key Metrics", "Recommendations"],
        description="Required report sections"
    )


class ReportDataSources(BaseModel):
    """Report data sources configuration."""

    include_timeline_events: bool = Field(
        True,
        description="Include timeline events in report"
    )

    include_metrics: bool = Field(
        True,
        description="Include metrics and KPIs"
    )

    filter_by_tags: Optional[List[str]] = Field(
        None,
        description="Filter data by specific tags"
    )


class ReportAudience(BaseModel):
    """Report audience specification."""

    stakeholder_level: Literal["executive", "manager", "technical"] = Field(
        "executive",
        description="Target stakeholder level"
    )

    depth: Literal["high_level", "detailed"] = Field(
        "high_level",
        description="Report depth level"
    )


class ReportingTaskConfiguration(BaseModel):
    """Complete reporting agent task configuration."""

    report_spec: ReportSpec = Field(
        ...,
        description="Report specification"
    )

    data_sources: ReportDataSources = Field(
        default_factory=ReportDataSources,
        description="Data sources configuration"
    )

    audience: ReportAudience = Field(
        default_factory=ReportAudience,
        description="Target audience specification"
    )


# ============================================================================
# APPROVAL STRATEGY
# ============================================================================

class ApprovalStrategy(BaseModel):
    """Work session approval strategy configuration."""

    strategy: Literal["checkpoint_required", "final_only", "auto_approve_low_risk"] = Field(
        ...,
        description="Approval strategy type"
    )

    description: Optional[str] = Field(
        None,
        description="Human-readable strategy description"
    )


# ============================================================================
# UNIFIED WORK SESSION REQUEST
# ============================================================================

class CreateWorkSessionRequest(BaseModel):
    """Request to create a work session with agent-specific configuration."""

    agent_id: str = Field(
        ...,
        description="ID of the project agent to execute the work"
    )

    task_description: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        description="Natural language task description"
    )

    # Agent-specific configurations (only one should be provided)
    research_config: Optional[ResearchTaskConfiguration] = None
    content_config: Optional[ContentTaskConfiguration] = None
    reporting_config: Optional[ReportingTaskConfiguration] = None

    # Approval strategy
    approval_strategy: ApprovalStrategy = Field(
        default_factory=lambda: ApprovalStrategy(strategy="final_only"),
        description="Approval and checkpoint strategy"
    )

    # Priority (optional)
    priority: int = Field(
        5,
        ge=1,
        le=10,
        description="Task priority (1=low, 10=urgent)"
    )

    def get_task_configuration(self) -> dict:
        """
        Extract the agent-specific configuration as a dict.
        Returns the non-None configuration.
        """
        if self.research_config:
            return self.research_config.model_dump(exclude_none=True)
        elif self.content_config:
            return self.content_config.model_dump(exclude_none=True)
        elif self.reporting_config:
            return self.reporting_config.model_dump(exclude_none=True)
        else:
            return {}
