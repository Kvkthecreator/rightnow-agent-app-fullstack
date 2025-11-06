"""Task parameter schemas for different work session types.

These Pydantic schemas validate task_parameters based on task_type.
Stored as JSONB in database (flexible), validated at API layer (type-safe).

Usage:
    # API endpoint validates based on task_type
    if task_type == TaskType.RESEARCH:
        params = ResearchTaskParams(**task_parameters)
    elif task_type == TaskType.CONTENT_CREATION:
        params = ContentTaskParams(**task_parameters)
    # ... then store params.model_dump() as JSONB
"""

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


# ============================================================================
# Research Task Parameters
# ============================================================================


class ResearchTaskParams(BaseModel):
    """Parameters for research work sessions."""

    focus: str = Field(..., description="What to research", min_length=1, max_length=500)
    sources: List[str] = Field(
        default=["web"],
        description="Where to look",
        examples=[["web", "papers", "books"]],
    )
    depth: Literal["quick", "deep"] = Field(
        default="quick", description="How thorough"
    )

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "focus": "Competitor analysis for AI sales assistant market",
                "sources": ["web", "papers"],
                "depth": "deep",
            }
        }


# ============================================================================
# Content Creation Task Parameters
# ============================================================================


class ContentTaskParams(BaseModel):
    """Parameters for content creation work sessions."""

    platform: Literal["linkedin", "twitter", "blog", "email", "doc"] = Field(
        ..., description="Where content will be published"
    )
    target_audience: str = Field(
        ..., description="Who the content is for", min_length=1, max_length=200
    )
    tone: Literal["professional", "casual", "technical", "friendly"] = Field(
        default="professional", description="Voice and style"
    )
    length: Literal["short", "medium", "long"] = Field(
        default="medium", description="Approximate length"
    )
    cta: Optional[str] = Field(None, description="Call-to-action", max_length=200)

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "platform": "linkedin",
                "target_audience": "sales leaders at B2B SaaS companies",
                "tone": "professional",
                "length": "short",
                "cta": "Book a demo at acme.ai/demo",
            }
        }


# ============================================================================
# Analysis Task Parameters
# ============================================================================


class AnalysisTaskParams(BaseModel):
    """Parameters for analysis work sessions."""

    analysis_type: str = Field(
        ..., description="Type of analysis to perform", min_length=1, max_length=200
    )
    metrics: List[str] = Field(
        default_factory=list, description="Specific metrics to analyze"
    )
    depth: Literal["quick", "deep"] = Field(
        default="quick", description="How thorough"
    )

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "analysis_type": "market positioning analysis",
                "metrics": ["market_share", "pricing", "features"],
                "depth": "deep",
            }
        }


# ============================================================================
# Helper Functions
# ============================================================================


def validate_task_params(task_type: str, params: dict) -> dict:
    """
    Validate task_parameters based on task_type.

    Args:
        task_type: One of 'research' | 'content_creation' | 'analysis'
        params: Raw dict of parameters to validate

    Returns:
        Validated dict (from Pydantic model)

    Raises:
        ValidationError: If params don't match schema for task_type
    """
    if task_type == "research":
        validated = ResearchTaskParams(**params)
    elif task_type == "content_creation":
        validated = ContentTaskParams(**params)
    elif task_type == "analysis":
        validated = AnalysisTaskParams(**params)
    else:
        raise ValueError(f"Unknown task_type: {task_type}")

    return validated.model_dump()
