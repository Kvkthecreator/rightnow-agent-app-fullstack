"""
Agent status and health endpoints.

Phase 4: Provides status information for Claude Agent SDK integration.
"""

from __future__ import annotations

import logging
import os

from fastapi import APIRouter, HTTPException

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/agents/status")
async def get_agents_status():
    """
    Get status of all available agents.

    Returns:
        Status information for all agent types
    """
    logger.info("Checking agents status")

    # Check required environment variables
    required_vars = ["ANTHROPIC_API_KEY", "SUBSTRATE_API_URL"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        logger.warning(f"Agents not configured - missing vars: {missing_vars}")
        return {
            "status": "not_configured",
            "message": f"Missing environment variables: {', '.join(missing_vars)}",
            "note": "Set ANTHROPIC_API_KEY and SUBSTRATE_API_URL to enable agents",
            "agents": {
                "research": "not_configured",
                "content": "not_configured",
                "reporting": "not_configured"
            }
        }

    # Check if SDK is available
    try:
        import claude_agent_sdk
        sdk_version = getattr(claude_agent_sdk, "__version__", "unknown")
    except ImportError:
        logger.error("Claude Agent SDK not installed")
        return {
            "status": "not_configured",
            "message": "Claude Agent SDK not installed",
            "note": "Install with: pip install claude-agent-sdk",
            "agents": {
                "research": "sdk_missing",
                "content": "sdk_missing",
                "reporting": "sdk_missing"
            }
        }

    logger.info("All agents configured and ready")
    return {
        "status": "ready",
        "message": "All agents configured and ready",
        "sdk_version": sdk_version,
        "agents": {
            "research": {
                "status": "ready",
                "capabilities": ["monitor", "deep_dive"],
                "description": "Continuous monitoring and deep research"
            },
            "content": {
                "status": "ready",
                "capabilities": ["create", "repurpose"],
                "description": "Platform-specific content creation"
            },
            "reporting": {
                "status": "ready",
                "capabilities": ["generate"],
                "description": "Multi-format document generation"
            }
        },
        "architecture": {
            "pattern": "BFF",
            "adapters": ["memory", "governance", "auth"],
            "backend": "substrate-api (via HTTP)"
        }
    }


@router.get("/agents/{agent_type}/status")
async def get_agent_status(agent_type: str):
    """
    Get status of specific agent type.

    Args:
        agent_type: Agent type (research, content, reporting)

    Returns:
        Status information for agent

    Raises:
        HTTPException: If agent type not found
    """
    logger.info(f"Checking {agent_type} agent status")

    # Validate agent type
    valid_types = ["research", "content", "reporting"]
    if agent_type not in valid_types:
        raise HTTPException(
            status_code=404,
            detail=f"Agent type '{agent_type}' not found. Valid types: {valid_types}"
        )

    # Check configuration
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    substrate_url = os.getenv("SUBSTRATE_API_URL")

    if not anthropic_key or not substrate_url:
        return {
            "status": "not_configured",
            "agent_type": agent_type,
            "message": "Missing required environment variables",
            "required": ["ANTHROPIC_API_KEY", "SUBSTRATE_API_URL"]
        }

    # Agent-specific info
    agent_info = {
        "research": {
            "capabilities": ["monitor", "deep_dive"],
            "description": "Continuous monitoring across domains and deep-dive research",
            "config_file": "agents/config/research.yaml",
            "subagents": ["web_monitor", "competitor_tracker", "social_listener", "analyst"]
        },
        "content": {
            "capabilities": ["create", "repurpose"],
            "description": "Platform-specific content creation and cross-platform repurposing",
            "config_file": "agents/config/content.yaml",
            "subagents": ["twitter_writer", "linkedin_writer", "blog_writer", "instagram_creator", "repurposer"]
        },
        "reporting": {
            "capabilities": ["generate"],
            "description": "Multi-format document generation (Excel, PowerPoint, PDF)",
            "config_file": "agents/config/reporting.yaml",
            "subagents": ["excel_specialist", "presentation_designer", "report_writer", "data_analyst"]
        }
    }

    return {
        "status": "ready",
        "agent_type": agent_type,
        "message": f"{agent_type.capitalize()} agent ready",
        **agent_info[agent_type]
    }


@router.get("/agents/health")
async def get_agents_health():
    """
    Health check for agent system.

    Returns:
        Health status
    """
    # Simple health check
    return {
        "status": "healthy",
        "service": "work-platform-agents",
        "phase": "4",
        "architecture": "SDK + Adapters + BFF"
    }
