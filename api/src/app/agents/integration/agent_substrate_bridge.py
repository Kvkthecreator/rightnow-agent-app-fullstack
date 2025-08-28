"""
Stub implementation for legacy agent substrate bridge.
This functionality is now handled by canonical P3 Reflection Agent and P4 Presentation Agent.
"""

from typing import Any, Dict, List, Optional
from uuid import UUID


async def agent_get_project_understanding(workspace_id: UUID, basket_id: UUID) -> Dict[str, Any]:
    """Legacy stub - use canonical P3 Reflection Agent instead."""
    return {
        "status": "deprecated",
        "message": "Use canonical P3 Reflection Agent instead",
        "understanding": {"summary": "", "key_points": [], "gaps": []}
    }


async def agent_generate_ai_assistance(workspace_id: UUID, basket_id: UUID, request_type: str) -> Dict[str, Any]:
    """Legacy stub - use canonical P4 Presentation Agent instead."""
    return {
        "status": "deprecated", 
        "message": "Use canonical P4 Presentation Agent instead",
        "assistance": {"content": "", "suggestions": [], "confidence": 0.0}
    }


async def agent_get_intelligent_guidance(workspace_id: UUID, basket_id: UUID, context: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy stub - use canonical P3 Reflection Agent instead.""" 
    return {
        "status": "deprecated",
        "message": "Use canonical P3 Reflection Agent instead",
        "guidance": {"recommendations": [], "insights": [], "next_steps": []}
    }


async def agent_assess_project_health(workspace_id: UUID, basket_id: UUID) -> Dict[str, Any]:
    """Legacy stub - use canonical P3 Reflection Agent instead."""
    return {
        "status": "deprecated",
        "message": "Use canonical P3 Reflection Agent instead", 
        "health": {"score": 0.5, "issues": [], "strengths": []}
    }


async def agent_get_contextual_next_steps(workspace_id: UUID, basket_id: UUID, current_state: str) -> Dict[str, Any]:
    """Legacy stub - use canonical P3 Reflection Agent instead."""
    return {
        "status": "deprecated",
        "message": "Use canonical P3 Reflection Agent instead",
        "next_steps": {"immediate": [], "short_term": [], "long_term": []}
    }