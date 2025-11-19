"""
Reporting Agent SDK - Internalized for YARNNN BFF Architecture

Phase 2c: Report generation agent using SDK patterns with SubstrateMemoryAdapter.

Differences from archetype:
- Uses SubstrateMemoryAdapter (BFF pattern) instead of YarnnnMemory
- Simplified to core generate() method
- Prompts extracted to module-level constants (reusable for Skills)
- Auto-creates memory adapter if not provided
"""

import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from yarnnn_agents.base import BaseAgent
from yarnnn_agents.subagents import SubagentDefinition
from yarnnn_agents.tools import EMIT_WORK_OUTPUT_TOOL, parse_work_outputs_from_response

# Memory adapter for BFF-to-substrate integration
from adapters.memory_adapter import SubstrateMemoryAdapter

logger = logging.getLogger(__name__)


# ============================================================================
# PROMPTS (Module-level constants for Skills extraction in future)
# ============================================================================

REPORTING_AGENT_SYSTEM_PROMPT = """You are a professional reporting and analytics specialist.

Your core capabilities:
- Generate professional reports from data and analysis
- Create executive summaries and insights
- Format content for business deliverables (PDF, XLSX, PPT)
- Synthesize complex information into actionable insights

Report Types:
- **Executive Summary**: High-level overview with key takeaways
- **Monthly Metrics**: Performance tracking and trend analysis
- **Research Report**: Detailed findings with supporting data
- **Status Update**: Progress tracking and milestone reporting

Output Formats:
- **PDF**: Professional reports with sections and formatting
- **XLSX**: Data tables, charts, pivot analysis
- **PPT**: Presentation slides with visual storytelling
- **Markdown**: Structured documents for web/wiki

Quality Standards:
- Clear, concise language
- Data-driven insights
- Professional formatting
- Actionable recommendations
- Executive-friendly summaries

You have access to the substrate (data, templates, past reports) via memory.
Use emit_work_output to save generated reports for approval.
"""

REPORT_GENERATION_USER_PROMPT_TEMPLATE = """Generate a {report_type} report in {format} format.

**Topic**: {topic}

**Data/Context**:
{data}

**Requirements**:
{requirements}

**Instructions**:
1. Query substrate for relevant data, templates, and past reports
2. Analyze and synthesize information
3. Structure report according to format best practices
4. Generate professional, actionable content
5. Emit work output with:
   - output_type: "report_draft"
   - title: Report title
   - body: Full report content (formatted for {format})
   - confidence: Quality confidence (0.0-1.0)
   - metadata: {{report_type, format, topic}}
   - source_block_ids: IDs of data/templates used

Report Structure Guidelines:
- Start with executive summary (1-2 paragraphs)
- Present key findings with supporting data
- Include actionable recommendations
- End with next steps or conclusions

Remember:
- Be data-driven and specific
- Use professional business language
- Format appropriately for {format}
- Make it actionable for decision-makers
"""


# ============================================================================
# ReportingAgentSDK Class
# ============================================================================

class ReportingAgentSDK(BaseAgent):
    """
    Reporting Agent using internalized SDK patterns.

    Simplified from archetype - focused on core generate() method.
    Uses SubstrateMemoryAdapter for BFF-to-substrate communication.

    Usage:
        from agents_sdk import ReportingAgentSDK

        agent = ReportingAgentSDK(
            basket_id="analytics_basket",
            workspace_id="user_workspace",
            anthropic_api_key="sk-ant-...",
            default_format="pdf"
        )

        result = await agent.generate(
            report_type="monthly_metrics",
            format="pdf",
            topic="Q4 Performance",
            data={"revenue": 1000000, "growth": "15%"}
        )
    """

    def __init__(
        self,
        # BFF context (REQUIRED for SubstrateMemoryAdapter)
        basket_id: Union[str, UUID],
        workspace_id: str,

        # Claude configuration
        anthropic_api_key: Optional[str] = None,
        model: str = "claude-sonnet-4-5",

        # Reporting configuration
        default_format: str = "pdf",
        template_library: Optional[Dict[str, str]] = None,

        # Optional providers (can override auto-creation)
        memory: Optional[Any] = None,
        governance: Optional[Any] = None,
        tasks: Optional[Any] = None,

        # Knowledge modules (Phase 2d)
        knowledge_modules: str = "",
    ):
        """
        Initialize Reporting Agent SDK.

        Args:
            basket_id: Basket ID for data/templates context
            workspace_id: Workspace ID for authorization
            anthropic_api_key: Anthropic API key (defaults to env var)
            model: Claude model to use
            default_format: Default output format (pdf, xlsx, ppt, markdown)
            template_library: Paths to template files (optional)
            memory: Memory provider (auto-creates SubstrateMemoryAdapter if None)
            governance: Governance provider (optional)
            tasks: Task provider (optional)
            knowledge_modules: Knowledge modules (procedural knowledge) loaded from orchestration layer
        """
        # Store configuration
        self.basket_id = str(basket_id)
        self.workspace_id = workspace_id
        self.default_format = default_format
        self.template_library = template_library or {}
        self.knowledge_modules = knowledge_modules

        # Get Anthropic API key
        if not anthropic_api_key:
            anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
            if not anthropic_api_key:
                raise ValueError(
                    "ANTHROPIC_API_KEY must be provided or set in environment"
                )

        # Create memory adapter using BFF pattern (substrate-API via SubstrateClient)
        # Uses SUBSTRATE_SERVICE_SECRET (not YARNNN_API_KEY)
        if memory is None:
            memory_adapter = SubstrateMemoryAdapter(
                basket_id=basket_id,
                workspace_id=workspace_id
            )
            logger.info(f"Created SubstrateMemoryAdapter for basket={basket_id}")
        else:
            memory_adapter = memory

        # Build system prompt with Knowledge Modules (Phase 2d)
        system_prompt = REPORTING_AGENT_SYSTEM_PROMPT
        if self.knowledge_modules:
            system_prompt += f"\n\n# 📚 YARNNN Knowledge Modules (Procedural Knowledge)\n\n"
            system_prompt += self.knowledge_modules

        # Initialize BaseAgent with substrate memory adapter
        super().__init__(
            agent_type="reporting",
            agent_name="Reporting Agent SDK",
            memory=memory_adapter,
            governance=governance,
            tasks=tasks,
            anthropic_api_key=anthropic_api_key,
            model=model,
            system_prompt=system_prompt,
            tools=[EMIT_WORK_OUTPUT_TOOL],
        )

        logger.info(
            f"ReportingAgentSDK initialized - Default format: {default_format}"
        )

    async def execute(self, task: str) -> Dict[str, Any]:
        """
        Execute report generation task (BaseAgent abstract method).

        Routes to generate() for report generation tasks.

        Args:
            task: Task description (parsed for report_type, format, topic)

        Returns:
            Result dictionary with generated report
        """
        # Simple task parsing (can be improved)
        # Expected format: "Generate <report_type> report about <topic>"

        # Default values
        report_type = "executive_summary"
        format = self.default_format
        topic = task

        # Try to parse report type
        if "monthly" in task.lower():
            report_type = "monthly_metrics"
        elif "research" in task.lower():
            report_type = "research_report"
        elif "status" in task.lower():
            report_type = "status_update"

        # Try to parse format
        if "pdf" in task.lower():
            format = "pdf"
        elif "excel" in task.lower() or "xlsx" in task.lower():
            format = "xlsx"
        elif "ppt" in task.lower() or "powerpoint" in task.lower():
            format = "ppt"
        elif "markdown" in task.lower():
            format = "markdown"

        # Execute report generation
        return await self.generate(
            report_type=report_type,
            format=format,
            topic=topic
        )

    async def generate(
        self,
        report_type: str,
        format: str,
        topic: str,
        data: Optional[Dict[str, Any]] = None,
        requirements: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate professional report.

        Args:
            report_type: Type of report (executive_summary, monthly_metrics, etc.)
            format: Output format (pdf, xlsx, ppt, markdown)
            topic: Report topic/title
            data: Data to include in report (optional)
            requirements: Additional requirements (optional)

        Returns:
            Result dictionary with:
            - report: Generated report content
            - work_outputs: Work outputs emitted
            - substrate_context: Substrate blocks used
        """
        logger.info(
            f"Generating {report_type} report - Format: {format}, Topic: {topic}"
        )

        # Format data for prompt
        data_str = ""
        if data:
            data_str = "\n".join([f"- {k}: {v}" for k, v in data.items()])
        else:
            data_str = "(No specific data provided - use substrate context)"

        # Build user prompt
        user_prompt = REPORT_GENERATION_USER_PROMPT_TEMPLATE.format(
            report_type=report_type,
            format=format,
            topic=topic,
            data=data_str,
            requirements=requirements or "Standard professional quality"
        )

        # Execute with Claude (BaseAgent handles memory context injection)
        response = await self.execute_with_context(user_prompt)

        # Parse work outputs from response
        work_outputs = parse_work_outputs_from_response(response)

        logger.info(
            f"Report generated - {len(work_outputs)} work outputs emitted"
        )

        return {
            "report": response.content[0].text if response.content else "",
            "work_outputs": [wo.model_dump() for wo in work_outputs],
            "report_type": report_type,
            "format": format,
            "topic": topic,
        }


# ============================================================================
# Factory Function (backward compatibility)
# ============================================================================

def create_reporting_agent_sdk(
    basket_id: Union[str, UUID],
    workspace_id: str,
    anthropic_api_key: Optional[str] = None,
    **kwargs
) -> ReportingAgentSDK:
    """
    Factory function to create ReportingAgentSDK.

    Provides backward compatibility with existing factory pattern.
    """
    return ReportingAgentSDK(
        basket_id=basket_id,
        workspace_id=workspace_id,
        anthropic_api_key=anthropic_api_key,
        **kwargs
    )
