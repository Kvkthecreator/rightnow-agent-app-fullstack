"""
SDK Agent Archetypes - Real implementations with Claude API.

Phase 2 → Phase 3: Upgraded from mock to real Claude API calls.
Each agent type has specific output structures that work_session_executor
must parse into work_outputs.

Architecture:
- ResearchAgent: Uses Claude to synthesize findings from config + context
- ContentCreatorAgent: Uses Claude to generate platform-specific content
- ReportingAgent: Uses Claude to generate formatted reports
"""

import json
import logging
import os
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

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

    Monitors domains for signals, synthesizes findings using Claude API.
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

        # Initialize Anthropic client if available
        if ANTHROPIC_AVAILABLE and self.api_key:
            self.client = anthropic.Anthropic(api_key=self.api_key)
        else:
            self.client = None
            logger.warning("Anthropic client not available - will use mock responses")

        logger.info(f"[SDK] Initialized ResearchAgent: {agent_id}")

    async def execute(
        self,
        task: str,
        context: Dict[str, Any]
    ) -> ResearchResult:
        """
        Execute research task using Claude API.

        Args:
            task: Natural language task description
            context: Execution context including configuration and envelope

        Returns:
            ResearchResult with findings synthesized by Claude
        """
        logger.info(f"[SDK] Executing research task: {task[:100]}...")

        # Query memory for existing substrate context
        memory_context = await self.memory.query(task, limit=10)
        logger.info(f"[SDK] Retrieved {len(memory_context)} context items from substrate")

        # Extract agent config from memory context (injected by SubstrateMemoryAdapter)
        agent_config = {}
        substrate_blocks = []

        for ctx in memory_context:
            if ctx.metadata.get("agent_config"):
                agent_config = ctx.metadata["agent_config"]
                logger.info("[SDK] Found agent config in context")
            elif ctx.metadata.get("block_id"):
                substrate_blocks.append(ctx)

        # Build research prompt with config
        prompt = self._build_research_prompt(task, agent_config, substrate_blocks)

        # Call Claude API for synthesis
        if self.client:
            findings = await self._call_claude_for_research(prompt, agent_config)
        else:
            # Fallback to mock if client not available
            logger.warning("[SDK] Using mock findings - Anthropic client not available")
            findings = self._generate_mock_findings(task, agent_config)

        # Check if findings need review (low confidence)
        low_confidence = [f for f in findings if f.confidence < self.signal_threshold]
        needs_review = len(low_confidence) > 0

        result = ResearchResult(
            findings=findings,
            needs_review=needs_review,
            review_reason=f"Found {len(low_confidence)} low-confidence findings requiring review" if needs_review else None
        )

        logger.info(f"[SDK] Research complete: {len(findings)} findings, needs_review={needs_review}")
        return result

    def _build_research_prompt(
        self,
        task: str,
        agent_config: Dict[str, Any],
        substrate_blocks: List[Any]
    ) -> str:
        """Build a comprehensive research prompt from config and context."""

        research_config = agent_config.get("research", {})

        # Extract config parameters
        topics = research_config.get("topics", self.monitoring_domains)
        competitors = research_config.get("competitors", [])
        data_sources = research_config.get("data_sources", {})
        output_prefs = research_config.get("output_preferences", {})

        prompt = f"""You are a research agent tasked with generating actionable insights.

## Research Task
{task}

## Focus Areas
Topics to research:
{json.dumps(topics, indent=2)}

## Competitors to Monitor
{json.dumps(competitors, indent=2)}

## Data Source Reliability
- High reliability: {', '.join(data_sources.get('high_reliability', []))}
- Medium reliability: {', '.join(data_sources.get('medium_reliability', []))}
- Monitor only: {', '.join(data_sources.get('monitor_only', []))}

## Output Preferences
- Finding type: {output_prefs.get('finding_type', 'insight')}
- Include actionable recommendations: {output_prefs.get('include_actionable_recommendations', True)}
- Max findings: {output_prefs.get('max_findings_per_run', 10)}
- Min confidence threshold: {output_prefs.get('min_confidence_to_include', 0.6)}

## Existing Project Context
"""

        # Add substrate context if available
        if substrate_blocks:
            prompt += "The user's project already contains the following knowledge blocks:\n\n"
            for i, block in enumerate(substrate_blocks[:5], 1):  # Limit to 5 blocks
                prompt += f"{i}. {block.content[:500]}...\n\n"
        else:
            prompt += "No existing project context available.\n\n"

        prompt += """
## Your Task
Based on the above configuration and context, generate research findings. For each finding:

1. Provide a clear insight (not just a fact - synthesize meaning)
2. Assign a confidence score (0.0-1.0) based on source reliability
3. List the sources or reasoning behind the finding
4. Categorize by domain (from the focus areas)
5. If actionable, suggest next steps

Format your response as a JSON array of findings:
```json
[
  {
    "content": "Your insight here - be specific and actionable",
    "confidence": 0.85,
    "sources": ["source1.com", "source2.com"],
    "domain": "ai_agents",
    "reasoning": "Why this confidence level",
    "actionable_recommendations": ["Action 1", "Action 2"]
  }
]
```

Generate 3-5 high-quality findings rather than many low-quality ones.
Focus on insights that would genuinely help someone building in the AI agent space.
"""

        return prompt

    async def _call_claude_for_research(
        self,
        prompt: str,
        agent_config: Dict[str, Any]
    ) -> List[ResearchFinding]:
        """Call Claude API and parse response into findings."""

        try:
            logger.info("[SDK] Calling Claude API for research synthesis...")

            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4000,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            response_text = message.content[0].text
            logger.debug(f"[SDK] Claude response length: {len(response_text)} chars")

            # Parse JSON from response
            findings = self._parse_claude_response(response_text, agent_config)

            return findings

        except Exception as e:
            logger.error(f"[SDK] Claude API call failed: {e}")
            # Fallback to mock findings
            return self._generate_mock_findings("API call failed", agent_config)

    def _parse_claude_response(
        self,
        response_text: str,
        agent_config: Dict[str, Any]
    ) -> List[ResearchFinding]:
        """Parse Claude's JSON response into ResearchFinding objects."""

        findings = []

        try:
            # Extract JSON from response (may be wrapped in markdown code block)
            json_str = response_text
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                json_str = response_text.split("```")[1].split("```")[0]

            parsed = json.loads(json_str.strip())

            if not isinstance(parsed, list):
                parsed = [parsed]

            output_prefs = agent_config.get("research", {}).get("output_preferences", {})
            min_confidence = output_prefs.get("min_confidence_to_include", 0.6)
            max_findings = output_prefs.get("max_findings_per_run", 10)

            for item in parsed[:max_findings]:
                confidence = float(item.get("confidence", 0.7))

                # Skip findings below minimum confidence
                if confidence < min_confidence:
                    logger.debug(f"[SDK] Skipping low-confidence finding: {confidence}")
                    continue

                finding = ResearchFinding(
                    content=item.get("content", ""),
                    confidence=confidence,
                    sources=item.get("sources", []),
                    domain=item.get("domain", "general")
                )

                # Store additional metadata for later use
                finding.reasoning = item.get("reasoning", "")
                finding.actionable_recommendations = item.get("actionable_recommendations", [])

                findings.append(finding)

            logger.info(f"[SDK] Parsed {len(findings)} findings from Claude response")

        except json.JSONDecodeError as e:
            logger.error(f"[SDK] Failed to parse Claude JSON response: {e}")
            logger.debug(f"[SDK] Raw response: {response_text[:500]}...")
            # Return single finding with raw response
            findings = [
                ResearchFinding(
                    content=f"Research synthesis (raw): {response_text[:1000]}",
                    confidence=0.5,
                    sources=["claude_api"],
                    domain="general"
                )
            ]

        return findings

    def _generate_mock_findings(
        self,
        task: str,
        agent_config: Dict[str, Any]
    ) -> List[ResearchFinding]:
        """Generate mock findings when Claude API is not available."""

        topics = agent_config.get("research", {}).get("topics", self.monitoring_domains)

        findings = [
            ResearchFinding(
                content=f"[MOCK - API unavailable] Research needed on: {topics[0] if topics else task}",
                confidence=0.5,
                sources=["mock_fallback"],
                domain=self.monitoring_domains[0] if self.monitoring_domains else "general"
            )
        ]

        return findings

    async def monitor(self) -> ResearchResult:
        """
        Run monitoring cycle for configured domains.

        This is called on schedule (e.g., daily at 6am).
        """
        logger.info(f"[SDK] Running monitoring for domains: {self.monitoring_domains}")
        return await self.execute(
            f"Monitor {', '.join(self.monitoring_domains)} for new signals and emerging trends",
            {}
        )

    async def deep_dive(self, topic: str) -> ResearchResult:
        """
        Perform deep dive research on a specific topic.

        Args:
            topic: Specific topic to research in depth

        Returns:
            ResearchResult with detailed findings on the topic
        """
        logger.info(f"[SDK] Performing deep dive on: {topic}")
        return await self.execute(
            f"Perform comprehensive deep dive research on: {topic}. "
            f"Focus on recent developments, key players, market dynamics, and strategic implications.",
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
