"""
Agent Knowledge Modules - Procedural knowledge for agent execution.

Knowledge modules teach agents HOW to work (methodology, standards, patterns).
They are static markdown files loaded into agent system prompts at execution time.

This is NOT the official Claude SDK Skills pattern (which requires autonomous invocation).
"""

import logging
from pathlib import Path
from typing import Dict, List

logger = logging.getLogger(__name__)


class KnowledgeModuleLoader:
    """Loads procedural knowledge modules for agent execution."""

    def __init__(self):
        self.modules_dir = Path(__file__).parent

    def load_for_agent(self, agent_type: str) -> str:
        """
        Load knowledge modules for specific agent type.

        Args:
            agent_type: Type of agent ("research", "content", "reporting")

        Returns:
            Combined knowledge modules as markdown string
        """
        modules = self._get_modules_for_agent(agent_type)

        if not modules:
            logger.warning(f"No knowledge modules found for agent_type={agent_type}")
            return ""

        content_parts = []
        for module_name in modules:
            module_path = self.modules_dir / f"{module_name}.md"
            if module_path.exists():
                with open(module_path) as f:
                    content_parts.append(f.read())
            else:
                logger.warning(f"Knowledge module not found: {module_path}")

        combined_content = "\n\n---\n\n".join(content_parts)

        logger.info(
            f"Loaded {len(content_parts)} knowledge modules for {agent_type} "
            f"({len(combined_content)} chars)"
        )

        return combined_content

    def _get_modules_for_agent(self, agent_type: str) -> List[str]:
        """
        Get list of module names for agent type.

        Returns module names without .md extension.
        """
        # Core modules for all agents
        core_modules = [
            "quality_standards",
            "substrate_patterns",
        ]

        # Agent-specific modules
        agent_modules: Dict[str, List[str]] = {
            "research": ["research_methodology"],
            "content": [],  # Add content_creation_guide.md when created
            "reporting": [],  # Add report_formatting_guide.md when created
        }

        specific_modules = agent_modules.get(agent_type, [])

        return core_modules + specific_modules


__all__ = ["KnowledgeModuleLoader"]
