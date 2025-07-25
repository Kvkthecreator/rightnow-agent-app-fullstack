"""Infrastructure agent for comprehensive memory analysis and health monitoring."""

import logging
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel

from ...agents.services.context_tagger import ContextTaggerService
from ...agents.services.substrate_ops import (
    AgentSubstrateService,
    AgentSubstrateRequest,
    SubstrateOperationType
)

logger = logging.getLogger("uvicorn.error")


class InfraMemoryAnalyzerInput(BaseModel):
    """Input for infrastructure memory analyzer agent."""
    basket_id: str
    workspace_id: str
    analysis_type: str = "comprehensive"  # 'health', 'semantic', 'comprehensive'
    auto_tag_context: bool = True
    confidence_threshold: float = 0.8


class InfraMemoryAnalyzerOutput(BaseModel):
    """Output from infrastructure memory analyzer agent."""
    basket_id: str
    analysis_type: str
    health_score: float
    total_blocks: int
    context_coverage: float
    issues_found: int
    context_items_created: int
    recommendations: List[str]
    processing_time_ms: int
    success: bool
    error_message: Optional[str] = None


async def run_infra_memory_analyzer(
    input_data: InfraMemoryAnalyzerInput
) -> InfraMemoryAnalyzerOutput:
    """Infrastructure agent for memory analysis and enhancement."""
    
    start_time = datetime.now(timezone.utc)
    agent_id = "infra_memory_analyzer"
    
    try:
        basket_id = UUID(input_data.basket_id)
        
        # Perform memory analysis
        analysis_request = AgentSubstrateRequest(
            operation_type=SubstrateOperationType.ANALYZE_MEMORY,
            agent_id=agent_id,
            agent_type="infra_memory_analyzer",
            target_id=basket_id,
            parameters={"basket_id": input_data.basket_id},
            reasoning="Comprehensive memory health analysis"
        )
        
        analysis_result = await AgentSubstrateService.execute_operation(
            analysis_request, input_data.workspace_id
        )
        
        if not analysis_result.success:
            raise Exception(analysis_result.error_message or "Analysis failed")
        
        analysis = analysis_result.result_data.get("analysis", {})
        
        # Calculate health score
        total_blocks = analysis.get("total_blocks", 0)
        context_coverage = analysis.get("context_coverage", 0.0)
        consistency_issues = len(analysis.get("consistency_issues", []))
        
        health_score = 1.0
        if consistency_issues > 0:
            health_score -= min(0.3, consistency_issues * 0.1)
        if context_coverage < 0.5:
            health_score -= (0.5 - context_coverage) * 0.4
        
        context_items_created = 0
        
        # Auto-tag context if enabled and health score is low
        if input_data.auto_tag_context and (health_score < 0.7 or context_coverage < 0.5):
            try:
                tagging_result = await ContextTaggerService.analyze_memory_semantics(
                    basket_id=basket_id,
                    workspace_id=input_data.workspace_id,
                    agent_id=agent_id,
                    focus_types=None  # Analyze all types
                )
                
                # Only count high-confidence tags
                context_items_created = len([
                    item for item in tagging_result.context_items_created
                    if item.get("confidence", 0.0) >= input_data.confidence_threshold
                ])
                
            except Exception as e:
                logger.warning(f"Auto-tagging failed: {e}")
        
        # Generate enhanced recommendations
        recommendations = analysis.get("recommendations", [])
        
        if health_score < 0.6:
            recommendations.insert(0, "Memory health is poor - consider reviewing and organizing blocks")
        if context_coverage < 0.3:
            recommendations.append("Very low context coverage - consider adding semantic tags")
        if consistency_issues > 5:
            recommendations.append("Multiple consistency issues detected - review flagged items")
        
        # Calculate processing time
        end_time = datetime.now(timezone.utc)
        processing_time_ms = int((end_time - start_time).total_seconds() * 1000)
        
        return InfraMemoryAnalyzerOutput(
            basket_id=input_data.basket_id,
            analysis_type=input_data.analysis_type,
            health_score=round(health_score, 2),
            total_blocks=total_blocks,
            context_coverage=round(context_coverage, 2),
            issues_found=consistency_issues,
            context_items_created=context_items_created,
            recommendations=recommendations,
            processing_time_ms=processing_time_ms,
            success=True
        )
        
    except Exception as e:
        logger.exception(f"Infra memory analyzer failed: {e}")
        
        end_time = datetime.now(timezone.utc)
        processing_time_ms = int((end_time - start_time).total_seconds() * 1000)
        
        return InfraMemoryAnalyzerOutput(
            basket_id=input_data.basket_id,
            analysis_type=input_data.analysis_type,
            health_score=0.0,
            total_blocks=0,
            context_coverage=0.0,
            issues_found=0,
            context_items_created=0,
            recommendations=[],
            processing_time_ms=processing_time_ms,
            success=False,
            error_message=str(e)
        )