"""
SDK Agent Archetypes - Mock implementations.

Phase 2: These mocks define the expected behavior of SDK agents.
Each agent type has specific output structures that work_session_executor
must parse into work_outputs.

IMPORTANT: This is our best guess at SDK structure. Real SDK may differ.
"""

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .interfaces import MemoryProvider

logger = logging.getLogger(__name__)


@dataclass
class ResearchFinding:
    """Single research finding."""
    content: str
    confidence: float
    sources: List[str] = field(default_factory=list)
    domain: Optional[str] = None


@dataclass
class ResearchResult:
    """Result from ResearchAgent.execute()"""
    findings: List[ResearchFinding]
    needs_review: bool = False
    review_reason: Optional[str] = None

    def get(self, key: str, default=None):
        """Dict-like access for compatibility."""
        return getattr(self, key, default)


@dataclass
class ContentVariation:
    """Single content variation."""
    text: str
    platform: str
    tone: str
    requires_review: bool = False


@dataclass
class ContentResult:
    """Result from ContentCreatorAgent.execute()"""
    variations: List[ContentVariation]
    needs_review: bool = False
    review_reason: Optional[str] = None

    def get(self, key: str, default=None):
        return getattr(self, key, default)


@dataclass
class ReportData:
    """Report structure."""
    content: str
    type: str
    sections: List[str] = field(default_factory=list)
    charts: List[Dict] = field(default_factory=list)

    def get(self, key: str, default=None):
        return getattr(self, key, default)


@dataclass
class ReportResult:
    """Result from ReportingAgent.execute()"""
    report: ReportData
    needs_review: bool = False
    review_reason: Optional[str] = None

    def get(self, key: str, default=None):
        return getattr(self, key, default)


class ResearchAgent:
    """
    Research agent archetype.

    Monitors domains for signals, synthesizes findings.
    """

    def __init__(
        self,
        agent_id: str,
        memory: MemoryProvider,
        governance: Optional[Any],
        anthropic_api_key: str,
        monitoring_domains: List[str],
        monitoring_frequency: str,
        signal_threshold: float,
        synthesis_mode: str
    ):
        self.agent_id = agent_id
        self.memory = memory
        self.governance = governance
        self.api_key = anthropic_api_key
        self.monitoring_domains = monitoring_domains
        self.monitoring_frequency = monitoring_frequency
        self.signal_threshold = signal_threshold
        self.synthesis_mode = synthesis_mode

        logger.info(f"[MOCK SDK] Initialized ResearchAgent: {agent_id}")

    async def execute(
        self,
        task: str,
        context: Dict[str, Any]
    ) -> ResearchResult:
        """
        Execute research task.

        Args:
            task: Natural language task description
            context: Execution context including configuration and envelope

        Returns:
            ResearchResult with findings

        MOCK IMPLEMENTATION: Returns placeholder findings.
        Real SDK would call Anthropic API and process results.
        """
        logger.info(f"[MOCK SDK] Executing research task: {task[:100]}...")

        # Mock: Query memory for existing context
        memory_context = await self.memory.query(task, limit=10)
        logger.debug(f"[MOCK SDK] Retrieved {len(memory_context)} context items")

        # Mock: Generate findings based on task
        # Real SDK would call Anthropic API here
        findings = [
            ResearchFinding(
                content=f"[MOCK] Finding 1 for task: {task[:50]}...",
                confidence=0.85,
                sources=["mock_source_1"],
                domain=self.monitoring_domains[0] if self.monitoring_domains else "general"
            ),
            ResearchFinding(
                content=f"[MOCK] Finding 2: Additional insight from {self.synthesis_mode} mode",
                confidence=0.72,
                sources=["mock_source_2", "mock_source_3"],
                domain=self.monitoring_domains[0] if self.monitoring_domains else "general"
            ),
        ]

        # Check if findings need review (low confidence)
        low_confidence = [f for f in findings if f.confidence < self.signal_threshold]
        needs_review = len(low_confidence) > 0

        result = ResearchResult(
            findings=findings,
            needs_review=needs_review,
            review_reason=f"Found {len(low_confidence)} low-confidence findings" if needs_review else None
        )

        logger.info(f"[MOCK SDK] Research complete: {len(findings)} findings, needs_review={needs_review}")
        return result

    async def monitor(self) -> ResearchResult:
        """
        Run monitoring cycle for configured domains.

        This is called on schedule (e.g., daily at 6am).
        """
        logger.info(f"[MOCK SDK] Running monitoring for domains: {self.monitoring_domains}")
        return await self.execute(
            f"Monitor {', '.join(self.monitoring_domains)} for new signals",
            {}
        )


class ContentCreatorAgent:
    """
    Content creator agent archetype.

    Creates platform-specific content with brand voice.
    """

    def __init__(
        self,
        agent_id: str,
        memory: MemoryProvider,
        governance: Optional[Any],
        anthropic_api_key: str,
        enabled_platforms: List[str],
        brand_voice_mode: str,
        voice_temperature: float
    ):
        self.agent_id = agent_id
        self.memory = memory
        self.governance = governance
        self.api_key = anthropic_api_key
        self.enabled_platforms = enabled_platforms
        self.brand_voice_mode = brand_voice_mode
        self.voice_temperature = voice_temperature

        logger.info(f"[MOCK SDK] Initialized ContentCreatorAgent: {agent_id}")

    async def execute(
        self,
        task: str,
        context: Dict[str, Any]
    ) -> ContentResult:
        """
        Execute content creation task.

        Returns:
            ContentResult with variations for each platform
        """
        logger.info(f"[MOCK SDK] Executing content task: {task[:100]}...")

        # Query memory for brand context
        memory_context = await self.memory.query(task, limit=10)

        # Generate variations for each platform
        variations = []
        for platform in self.enabled_platforms[:2]:  # Limit to 2 for mock
            variations.append(
                ContentVariation(
                    text=f"[MOCK] {platform.upper()} content: {task[:50]}... #yarnnn",
                    platform=platform,
                    tone=self.brand_voice_mode,
                    requires_review=False
                )
            )

        result = ContentResult(
            variations=variations,
            needs_review=False,
            review_reason=None
        )

        logger.info(f"[MOCK SDK] Content complete: {len(variations)} variations")
        return result


class ReportingAgent:
    """
    Reporting agent archetype.

    Generates formatted reports from substrate data.
    """

    def __init__(
        self,
        agent_id: str,
        memory: MemoryProvider,
        governance: Optional[Any],
        anthropic_api_key: str,
        default_format: str,
        template_library: str
    ):
        self.agent_id = agent_id
        self.memory = memory
        self.governance = governance
        self.api_key = anthropic_api_key
        self.default_format = default_format
        self.template_library = template_library

        logger.info(f"[MOCK SDK] Initialized ReportingAgent: {agent_id}")

    async def execute(
        self,
        task: str,
        context: Dict[str, Any]
    ) -> ReportResult:
        """
        Execute reporting task.

        Returns:
            ReportResult with formatted report
        """
        logger.info(f"[MOCK SDK] Executing reporting task: {task[:100]}...")

        # Query memory for data to report on
        memory_context = await self.memory.query(task, limit=20)

        report = ReportData(
            content=f"[MOCK REPORT]\n\nTask: {task}\n\nFormat: {self.default_format}\n\nThis is placeholder content.",
            type=self.default_format,
            sections=["Executive Summary", "Key Findings", "Recommendations"],
            charts=[]
        )

        result = ReportResult(
            report=report,
            needs_review=False,
            review_reason=None
        )

        logger.info(f"[MOCK SDK] Report complete: {report.type} format")
        return result
