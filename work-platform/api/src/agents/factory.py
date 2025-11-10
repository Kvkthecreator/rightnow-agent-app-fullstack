"""
Agent factory: Creates Claude Agent SDK agents with substrate adapters.

Phase 4: This factory bridges the open-source SDK with our Phase 1-3 architecture.

Architecture flow:
factory.create_X_agent() → SDK agent + adapters → substrate_client → substrate-api
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Optional
from uuid import UUID

import yaml

# Import SDK archetypes (open-source dependency)
try:
    from claude_agent_sdk.archetypes import (
        ResearchAgent,
        ContentCreatorAgent,
        ReportingAgent,
    )
    SDK_AVAILABLE = True
except ImportError:
    SDK_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("Claude Agent SDK not installed - agent creation will fail")

# Import our adapters (Phase 4)
from adapters import SubstrateMemoryAdapter, SubstrateGovernanceAdapter

logger = logging.getLogger(__name__)


def load_agent_config(agent_type: str) -> dict:
    """
    Load agent configuration from YAML file.

    Args:
        agent_type: Type of agent (research, content, reporting)

    Returns:
        Configuration dictionary

    Raises:
        FileNotFoundError: If config file doesn't exist
        ValueError: If config is invalid
    """
    config_path = Path(__file__).parent / "config" / f"{agent_type}.yaml"

    if not config_path.exists():
        raise FileNotFoundError(
            f"Agent config not found: {config_path}\n"
            f"Available configs: {list((Path(__file__).parent / 'config').glob('*.yaml'))}"
        )

    logger.info(f"Loading agent config: {config_path}")

    with open(config_path) as f:
        config = yaml.safe_load(f)

    # Validate config structure
    if not config or "agent" not in config:
        raise ValueError(f"Invalid config structure in {config_path}")

    logger.debug(f"Loaded config for {agent_type} agent: {config.get('agent', {}).get('id')}")
    return config


def create_research_agent(
    basket_id: str | UUID,
    workspace_id: str,
    user_id: Optional[str] = None
) -> ResearchAgent:
    """
    Create ResearchAgent with substrate adapters.

    Args:
        basket_id: Basket ID for agent context
        workspace_id: Workspace ID for authorization context
        user_id: User ID for governance operations (optional)

    Returns:
        Configured ResearchAgent

    Raises:
        ImportError: If SDK not installed
        ValueError: If configuration invalid or env vars missing
    """
    if not SDK_AVAILABLE:
        raise ImportError(
            "Claude Agent SDK not installed. "
            "Install with: pip install claude-agent-sdk"
        )

    logger.info(f"Creating ResearchAgent for basket {basket_id} in workspace {workspace_id}")

    # Load configuration
    config = load_agent_config("research")

    # Create adapters (use our substrate_client internally - Phase 3 BFF)
    memory = SubstrateMemoryAdapter(basket_id=basket_id, workspace_id=workspace_id)

    # NOTE: Governance should NOT be used during agent execution.
    # Agents READ from substrate (via memory) and WRITE artifacts.
    # Governance happens separately: work approval → bridge → substrate proposals.
    # See: docs/architecture/GOVERNANCE_SEPARATION_REFACTOR_PLAN.md
    # For now, pass None - if SDK requires it, we'll create a no-op adapter
    governance = None

    # Get Anthropic API key
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
    if not anthropic_api_key:
        raise ValueError(
            "ANTHROPIC_API_KEY environment variable required for agent creation"
        )

    # Create agent from SDK with our adapters
    agent = ResearchAgent(
        agent_id=config["agent"]["id"],
        memory=memory,
        governance=governance,
        anthropic_api_key=anthropic_api_key,
        monitoring_domains=config["research"]["monitoring_domains"],
        monitoring_frequency=config["research"]["monitoring_frequency"],
        signal_threshold=config["research"]["signal_threshold"],
        synthesis_mode=config["research"]["synthesis_mode"]
    )

    logger.info(f"Created ResearchAgent: {agent.agent_id}")
    return agent


def create_content_agent(
    basket_id: str | UUID,
    workspace_id: str,
    user_id: Optional[str] = None
) -> ContentCreatorAgent:
    """
    Create ContentCreatorAgent with substrate adapters.

    Args:
        basket_id: Basket ID for agent context
        workspace_id: Workspace ID for authorization context
        user_id: User ID for governance operations (optional)

    Returns:
        Configured ContentCreatorAgent

    Raises:
        ImportError: If SDK not installed
        ValueError: If configuration invalid or env vars missing
    """
    if not SDK_AVAILABLE:
        raise ImportError(
            "Claude Agent SDK not installed. "
            "Install with: pip install claude-agent-sdk"
        )

    logger.info(f"Creating ContentCreatorAgent for basket {basket_id} in workspace {workspace_id}")

    # Load configuration
    config = load_agent_config("content")

    # Create adapters (use our substrate_client internally - Phase 3 BFF)
    memory = SubstrateMemoryAdapter(basket_id=basket_id, workspace_id=workspace_id)

    # NOTE: Governance should NOT be used during agent execution.
    # Agents READ from substrate (via memory) and WRITE artifacts.
    # Governance happens separately: work approval → bridge → substrate proposals.
    # See: docs/architecture/GOVERNANCE_SEPARATION_REFACTOR_PLAN.md
    # For now, pass None - if SDK requires it, we'll create a no-op adapter
    governance = None

    # Get Anthropic API key
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
    if not anthropic_api_key:
        raise ValueError(
            "ANTHROPIC_API_KEY environment variable required for agent creation"
        )

    # Create agent from SDK with our adapters
    agent = ContentCreatorAgent(
        agent_id=config["agent"]["id"],
        memory=memory,
        governance=governance,
        anthropic_api_key=anthropic_api_key,
        enabled_platforms=config["content"]["enabled_platforms"],
        brand_voice_mode=config["content"]["brand_voice_mode"],
        voice_temperature=config["content"]["voice_temperature"]
    )

    logger.info(f"Created ContentCreatorAgent: {agent.agent_id}")
    return agent


def create_reporting_agent(
    basket_id: str | UUID,
    workspace_id: str,
    user_id: Optional[str] = None
) -> ReportingAgent:
    """
    Create ReportingAgent with substrate adapters.

    Args:
        basket_id: Basket ID for agent context
        workspace_id: Workspace ID for authorization context
        user_id: User ID for governance operations (optional)

    Returns:
        Configured ReportingAgent

    Raises:
        ImportError: If SDK not installed
        ValueError: If configuration invalid or env vars missing
    """
    if not SDK_AVAILABLE:
        raise ImportError(
            "Claude Agent SDK not installed. "
            "Install with: pip install claude-agent-sdk"
        )

    logger.info(f"Creating ReportingAgent for basket {basket_id} in workspace {workspace_id}")

    # Load configuration
    config = load_agent_config("reporting")

    # Create adapters (use our substrate_client internally - Phase 3 BFF)
    memory = SubstrateMemoryAdapter(basket_id=basket_id, workspace_id=workspace_id)

    # NOTE: Governance should NOT be used during agent execution.
    # Agents READ from substrate (via memory) and WRITE artifacts.
    # Governance happens separately: work approval → bridge → substrate proposals.
    # See: docs/architecture/GOVERNANCE_SEPARATION_REFACTOR_PLAN.md
    # For now, pass None - if SDK requires it, we'll create a no-op adapter
    governance = None

    # Get Anthropic API key
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
    if not anthropic_api_key:
        raise ValueError(
            "ANTHROPIC_API_KEY environment variable required for agent creation"
        )

    # Create agent from SDK with our adapters
    agent = ReportingAgent(
        agent_id=config["agent"]["id"],
        memory=memory,
        governance=governance,
        anthropic_api_key=anthropic_api_key,
        default_format=config["reporting"]["default_format"],
        template_library=config["reporting"].get("template_library", "standard")
    )

    logger.info(f"Created ReportingAgent: {agent.agent_id}")
    return agent
