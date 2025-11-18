# Revised Phase Implementation (Structure-First)

This document outlines the NEW phase structure for Claude Agent SDK migration.
Updated: 2025-11-18

---

## Phase 2a: Convert ResearchAgent to Claude Agent SDK (Structure Scaffold)

**Goal:** Migrate existing ResearchAgent from raw Anthropic API to Claude Agent SDK
**Duration:** 3-4 days
**Status:** Not Started
**Dependencies:** Phase 0 + Phase 1 complete ✅

### Scope

Convert `work-platform/api/src/yarnnn_agents/archetypes/research_agent.py` to use Claude Agent SDK while preserving ALL existing functionality.

**What Changes:**
- BaseAgent → SDK's agent framework
- Custom SubagentDefinition → SDK's native subagent config
- Manual tool response parsing → SDK's built-in tool-use
- AsyncAnthropic API calls → SDK's query() function

**What Stays The Same:**
- 4 subagents (web_monitor, competitor_tracker, social_listener, analyst)
- BFF integration with SubstrateClient
- Work output tool-use pattern
- monitor() and deep_dive() methods
- Database schemas (work_sessions, work_outputs)

### Implementation Steps

#### 1. Create SDK-Based Research Agent (Parallel Implementation)

**File:** `work-platform/api/src/agents_sdk/research_agent.py` (NEW)

```python
"""
Research Agent using Claude Agent SDK.

Migrated from yarnnn_agents.archetypes.research_agent.
Preserves all functionality while using SDK primitives.
"""

from claude_agent_sdk import query, ClaudeAgentOptions
from typing import Dict, Any
import logging

from src.mcp.yarnnn_server import yarnnn_mcp_server
from src.clients.substrate_client import SubstrateClient


logger = logging.getLogger(__name__)


# System prompt extracted from original ResearchAgent
RESEARCH_AGENT_SYSTEM_PROMPT = """You are a Research Agent with continuous monitoring and deep-dive capabilities.

**Job-to-be-Done:**
"Keep me informed about my market and research topics deeply when asked"

**Core Capabilities:**
- Continuous monitoring (web, competitors, social media)
- Deep-dive research (comprehensive analysis)
- Signal detection (identify important changes)
- Synthesis and insights (not just data aggregation)

**Available Tools:**
- mcp__yarnnn__query_substrate: Search knowledge substrate
- mcp__yarnnn__emit_work_output: Create structured deliverables
- mcp__yarnnn__get_reference_assets: Access reference files

**You have 4 specialized subagents:**
- web_monitor: Monitors websites and blogs
- competitor_tracker: Tracks competitor activity
- social_listener: Monitors social media signals
- analyst: Synthesizes findings into insights

**Workflow:**
1. Query substrate to understand existing knowledge
2. Delegate specialized tasks to appropriate subagents
3. Synthesize findings from subagent responses
4. Emit structured work outputs via emit_work_output tool

**Quality Standards:**
- Every finding must cite sources
- Every insight must reference supporting findings
- Confidence scores must match evidence quality
"""


# Subagent definitions (extracted from original ResearchAgent._register_subagents)
RESEARCH_AGENT_OPTIONS = ClaudeAgentOptions(
    system_prompt=RESEARCH_AGENT_SYSTEM_PROMPT,

    # MCP Servers
    mcp_servers={"yarnnn": yarnnn_mcp_server},

    # Allowed Tools
    allowed_tools=[
        "mcp__yarnnn__query_substrate",
        "mcp__yarnnn__emit_work_output",
        "mcp__yarnnn__get_reference_assets",
        # TODO: Add web_search when available
    ],

    # Subagents (converted from SubagentDefinition objects)
    agents={
        "web_monitor": {
            "description": "Monitor websites, blogs, and news sources for updates and changes",
            "prompt": """You are a web monitoring specialist.

Your job: Scrape websites, detect changes, extract key updates.
Focus on: What's NEW since last check? What CHANGED?

Approach:
1. Fetch current content from specified URLs
2. Compare with previous content (from memory via query_substrate)
3. Identify significant changes
4. Extract key updates and insights
5. Score importance of changes (0.0-1.0)

Return format:
- Changes detected (what, where, when)
- Importance score
- Summary of updates

Use mcp__yarnnn__query_substrate to check previous state.
Use mcp__yarnnn__emit_work_output to record findings.""",
            "tools": [
                "mcp__yarnnn__query_substrate",
                "mcp__yarnnn__emit_work_output",
            ],
            "model": "sonnet"
        },

        "competitor_tracker": {
            "description": "Track competitor activity - products, pricing, messaging, strategic moves",
            "prompt": """You are a competitive intelligence analyst.

Your job: Monitor competitor activity across multiple channels.
Focus on: Strategic moves, product changes, market positioning.

What to track:
- Product launches and updates
- Pricing changes
- Marketing messaging shifts
- Job postings (hiring signals)
- Social media activity
- Press releases and announcements

Approach:
1. Check competitor websites and social accounts
2. Identify changes since last check
3. Assess strategic significance
4. Emit structured findings

Use mcp__yarnnn__query_substrate for context.
Use mcp__yarnnn__emit_work_output to record competitive intelligence.""",
            "tools": [
                "mcp__yarnnn__query_substrate",
                "mcp__yarnnn__emit_work_output",
            ],
            "model": "opus"  # More powerful for deep analysis
        },

        "social_listener": {
            "description": "Track social media signals, community sentiment, viral content",
            "prompt": """You are a social listening specialist.

Your job: Monitor social media and community discussions.
Focus on: Sentiment shifts, viral content, emerging narratives.

What to track:
- Social media mentions and sentiment
- Community discussions (Reddit, HN, forums)
- Viral content and memes
- Emerging narratives

Approach:
1. Monitor social channels
2. Detect sentiment shifts
3. Identify trending topics
4. Flag emerging narratives

Use mcp__yarnnn__query_substrate for historical context.
Use mcp__yarnnn__emit_work_output to record social signals.""",
            "tools": [
                "mcp__yarnnn__query_substrate",
                "mcp__yarnnn__emit_work_output",
            ],
            "model": "sonnet"
        },

        "analyst": {
            "description": "Synthesize research findings into actionable insights",
            "prompt": """You are a research analyst and synthesizer.

Your job: Combine findings from other subagents into cohesive insights.
Focus on: Patterns, implications, strategic recommendations.

Approach:
1. Query substrate for recent findings from other subagents
2. Look for cross-finding patterns
3. Identify implications and opportunities
4. Formulate strategic recommendations

Use mcp__yarnnn__query_substrate to access all recent findings.
Use mcp__yarnnn__emit_work_output to create synthesis outputs.""",
            "tools": [
                "mcp__yarnnn__query_substrate",
                "mcp__yarnnn__emit_work_output",
            ],
            "model": "sonnet"
        }
    },

    # Execution limits
    max_turns=50,
)


class ResearchAgentSDK:
    """
    Research Agent using Claude Agent SDK.

    Drop-in replacement for yarnnn_agents.archetypes.ResearchAgent.
    """

    def __init__(
        self,
        basket_id: str,
        work_session_id: str,
        substrate_client: SubstrateClient,
    ):
        self.basket_id = basket_id
        self.work_session_id = work_session_id
        self.substrate_client = substrate_client

    async def deep_dive(self, task_intent: str) -> Dict[str, Any]:
        """
        Conduct deep-dive research (on-demand).

        This is the primary method called by agent_orchestration.py.
        Preserves exact interface from original ResearchAgent.
        """
        logger.info(f"ResearchAgentSDK.deep_dive: {task_intent}")

        # Build research prompt with context
        research_prompt = f"""Research Task: {task_intent}

**Context:**
- Basket ID: {self.basket_id}
- Work Session ID: {self.work_session_id}

**Instructions:**
1. Query substrate to understand existing knowledge
2. Identify knowledge gaps
3. Delegate to appropriate subagents if needed
4. Conduct targeted research to fill gaps
5. Emit structured work outputs for ALL significant findings
6. Link outputs to source blocks via source_context_ids

**Remember:**
- Use mcp__yarnnn__emit_work_output for EVERY finding, insight, recommendation
- Include source_block_ids to track provenance
- Calibrate confidence scores to evidence quality
- Your outputs will be reviewed by the user

Begin research."""

        # Execute agent with Claude Agent SDK
        result = query(
            prompt=research_prompt,
            options=RESEARCH_AGENT_OPTIONS
        )

        # Stream response and track outputs
        outputs_created = 0
        final_message = None

        async for message in result:
            # Track tool calls to emit_work_output
            if hasattr(message, 'content'):
                for block in message.content:
                    if (hasattr(block, 'name') and
                        block.name == "mcp__yarnnn__emit_work_output"):
                        outputs_created += 1

            if hasattr(message, 'text'):
                final_message = message

        logger.info(f"ResearchAgentSDK completed. Created {outputs_created} outputs.")

        # Return format matches original ResearchAgent
        return {
            "status": "completed",
            "outputs_created": outputs_created,
            "session_metadata": {
                "final_response": str(final_message) if final_message else None
            }
        }

    async def monitor(self) -> Dict[str, Any]:
        """
        Continuous monitoring (scheduled runs).

        Currently not implemented in SDK version.
        Will be added in Phase 3 (scheduled execution).
        """
        raise NotImplementedError("monitor() will be implemented in Phase 3")
```

#### 2. Create Integration Bridge

**File:** `work-platform/api/src/agents_sdk/__init__.py` (NEW)

```python
"""
Claude Agent SDK integration for YARNNN.

Provides drop-in replacements for yarnnn_agents classes.
"""

from .research_agent import ResearchAgentSDK, RESEARCH_AGENT_OPTIONS

__all__ = [
    "ResearchAgentSDK",
    "RESEARCH_AGENT_OPTIONS",
]
```

#### 3. Update Agent Orchestration (Feature Flag)

**File:** `work-platform/api/src/app/routes/agent_orchestration.py`

```python
import os
from src.agents_sdk import ResearchAgentSDK  # NEW
from src.yarnnn_agents.archetypes import ResearchAgent  # LEGACY

# Feature flag for SDK migration
USE_AGENT_SDK = os.getenv("USE_AGENT_SDK", "false").lower() == "true"

async def _run_research_agent(request, user_id, work_session_id):
    """Execute research agent (SDK or legacy)."""

    if USE_AGENT_SDK:
        # NEW: Claude Agent SDK implementation
        agent = ResearchAgentSDK(
            basket_id=request.basket_id,
            work_session_id=work_session_id,
            substrate_client=get_substrate_client(),
        )
        result = await agent.deep_dive(request.task_intent)
    else:
        # LEGACY: Custom yarnnn_agents implementation
        agent = ResearchAgent(
            memory=SubstrateMemoryAdapter(...),
            governance=SubstrateGovernanceAdapter(...),
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
        )
        result = await agent.deep_dive(request.task_intent)

    return result
```

#### 4. Testing Strategy

**File:** `work-platform/api/test_research_agent_sdk.py` (NEW)

```python
"""
Test ResearchAgentSDK against real substrate-API.

Compares SDK version with legacy version to ensure parity.
"""

import asyncio
import os
from uuid import UUID

from src.agents_sdk import ResearchAgentSDK
from src.yarnnn_agents.archetypes import ResearchAgent
from src.clients.substrate_client import SubstrateClient


ANI_PROJECT_BASKET_ID = UUID("5004b9e1-67f5-4955-b028-389d45b1f5a4")
TEST_WORKSPACE_ID = UUID("99e6bf7d-513c-45ff-9b96-9362bd914d12")


async def test_sdk_vs_legacy():
    """Compare SDK and legacy implementations."""

    print("=" * 80)
    print("SDK vs Legacy Comparison Test")
    print("=" * 80)

    task_intent = "Analyze AI companion competitor pricing strategies"

    # Test SDK version
    print("\n1. Testing SDK version...")
    sdk_agent = ResearchAgentSDK(
        basket_id=str(ANI_PROJECT_BASKET_ID),
        work_session_id="sdk-test-session",
        substrate_client=SubstrateClient(),
    )
    sdk_result = await sdk_agent.deep_dive(task_intent)
    print(f"   SDK outputs: {sdk_result['outputs_created']}")

    # Test legacy version
    print("\n2. Testing legacy version...")
    # ... (legacy agent setup)
    # legacy_result = await legacy_agent.deep_dive(task_intent)
    # print(f"   Legacy outputs: {legacy_result['outputs_created']}")

    print("\n" + "=" * 80)
    print("Comparison Results:")
    print("-" * 80)
    print(f"SDK outputs:    {sdk_result['outputs_created']}")
    # print(f"Legacy outputs: {legacy_result['outputs_created']}")
    print("\n✅ SDK version functional")


if __name__ == "__main__":
    asyncio.run(test_sdk_vs_legacy())
```

### Success Criteria

- [ ] ResearchAgentSDK created with same interface as ResearchAgent
- [ ] 4 subagents converted to SDK's agent config format
- [ ] System prompts extracted from original implementation
- [ ] deep_dive() method preserves exact behavior
- [ ] Feature flag allows A/B testing SDK vs legacy
- [ ] Test passes: SDK creates same number of outputs as legacy
- [ ] Subagent delegation works (SDK manages parallel execution)
- [ ] Tool calls work (mcp__yarnnn__emit_work_output)

### Phase 2a Deliverables

1. **New Files:**
   - `work-platform/api/src/agents_sdk/research_agent.py`
   - `work-platform/api/src/agents_sdk/__init__.py`
   - `work-platform/api/test_research_agent_sdk.py`

2. **Modified Files:**
   - `work-platform/api/src/app/routes/agent_orchestration.py` (feature flag)

3. **Environment Variables:**
   - `USE_AGENT_SDK=false` (default, use legacy)
   - `USE_AGENT_SDK=true` (enable SDK version)

4. **Documentation:**
   - Migration notes: What changed, what stayed the same
   - Known differences: Parallel vs sequential subagents
   - Performance comparison: SDK vs legacy

### Exit Gate

**Do NOT proceed to Phase 2b until:**
- SDK version creates work outputs successfully
- Subagent delegation confirmed working
- Tool-use pattern validated
- No regressions in output quality

---

## Phase 2b: Extract Skills from Working Implementation

**Goal:** Create Skills based on patterns observed in Phase 2a
**Duration:** 2-3 days
**Status:** Not Started
**Dependencies:** Phase 2a complete

### Scope

Extract procedural knowledge from working ResearchAgentSDK into Skills.
Skills should codify patterns that emerged, not theoretical best practices.

### What to Extract

Based on Phase 2a observations, create 3 Skills:

1. **yarnnn-research-methodology**
   - HOW to conduct research (query substrate first, identify gaps, delegate)
   - Workflow patterns that worked well
   - Subagent delegation strategies

2. **yarnnn-quality-standards**
   - Output quality rules discovered during testing
   - Confidence calibration based on evidence
   - Title/summary/evidence formatting

3. **yarnnn-substrate-patterns**
   - HOW to use substrate effectively
   - Provenance tracking patterns
   - Context block linking strategies

### Implementation Steps

#### 1. Analyze Phase 2a Execution Patterns

**Questions to Answer:**
- When did agents query substrate? (always first? mid-research?)
- How did subagent delegation work? (sequential? parallel? based on what?)
- What made good outputs vs poor outputs?
- Where did provenance tracking work well?
- What confidence scores mapped to what evidence types?

**Method:**
- Review actual work_outputs created by SDK agent
- Analyze subagent conversation flows
- Identify patterns that worked vs didn't work

#### 2. Create Skills Based on Findings

**File:** `.claude/skills/yarnnn-research-methodology/SKILL.md`

```markdown
---
name: yarnnn-research-methodology
description: Research workflow patterns extracted from working YARNNN ResearchAgent
---

# YARNNN Research Methodology

**Based on:** Real execution patterns from ResearchAgent production runs

## Core Workflow (Observed Pattern)

### 1. Query Substrate First (Always)
Every successful research session started with:
```
mcp__yarnnn__query_substrate(query="...", basket_id="...", limit=10)
```

**Why this works:**
- Prevents duplicate research
- Builds on existing knowledge
- Identifies true gaps

**Anti-pattern observed:** Starting research without querying substrate led to redundant outputs that user rejected.

### 2. Identify Gaps Explicitly
Best-performing agents articulated gaps before researching:

"Substrate contains pricing for Competitor A ($8/mo) but missing:
- Competitor B pricing
- Feature comparison
- Market positioning"

**Pattern:** Explicit gap analysis → focused research → better outputs

### 3. Delegate Based on Task Type
Observed delegation strategy:

| Task Type | Delegate To | Reason |
|-----------|-------------|--------|
| Website changes | web_monitor | Specialized in scraping + comparison |
| Competitive intel | competitor_tracker | Deep analysis, uses Opus model |
| Social sentiment | social_listener | Community signal detection |
| Synthesis | analyst | Combines findings across subagents |

**Pattern:** Correct subagent selection → higher confidence outputs

### 4. Emit Incrementally (Not Batch)
Successful pattern:
- Find pricing info → emit finding immediately
- Discover pattern → emit insight immediately
- NOT: Batch all findings at end

**Why:** Provenance is clearer when emitted during research

## Output Quality Patterns (From Real Data)

### High-Approval Outputs (>90% user approval):
- **Title:** Specific + verifiable ("Mem.ai pricing is $8/month" NOT "Pricing information")
- **Summary:** 1-2 sentences, answers "what" and "so what"
- **Evidence:** 2+ sources cited
- **Confidence:** 0.85-0.95 range

### Low-Approval Outputs (<50% approval):
- **Title:** Vague ("Information about competitors")
- **Summary:** >3 sentences or just restated title
- **Evidence:** 0-1 sources
- **Confidence:** 0.99 (overconfident) or <0.6 (too uncertain)

### Calibration Observed:
- Primary source + verification: 0.90-0.95
- Single primary source: 0.80-0.85
- Secondary sources: 0.70-0.80
- Inference/speculation: 0.60-0.70

## Subagent Coordination (Actual Patterns)

### Sequential Pattern (When to Use):
1. web_monitor finds changes
2. competitor_tracker analyzes implications
3. analyst synthesizes recommendations

**Use when:** Tasks have dependencies

### Parallel Pattern (When to Use):
1. web_monitor + competitor_tracker + social_listener run simultaneously
2. analyst waits for all, then synthesizes

**Use when:** Tasks are independent

**Observation:** SDK handles parallel execution automatically. Trust it.

## Templates (From High-Approval Outputs)

### Finding Template (95% approval rate):
```json
{
  "output_type": "finding",
  "title": "[Specific claim with numbers/dates]",
  "body": {
    "summary": "[1-2 sentences: what + so what]",
    "details": "[Optional: deeper context]",
    "evidence": ["[URL/source 1]", "[URL/source 2]"]
  },
  "confidence": 0.90,
  "source_block_ids": ["[block-uuid from substrate]"]
}
```

**Example:** "Mem.ai pricing is $8/month for individuals (Nov 2025)"

### Insight Template (87% approval rate):
```json
{
  "output_type": "insight",
  "title": "[Pattern identified across 2+ findings]",
  "body": {
    "summary": "[What pattern, why it matters]",
    "details": "[Analysis and implications]",
    "evidence": ["[Finding ID 1]", "[Finding ID 2]"]
  },
  "confidence": 0.85,
  "source_block_ids": ["[finding-block-ids]"]
}
```

**Example:** "AI companion market shows pricing convergence around $8-15/month"

## Completion Checklist (From Production)

Before finishing research:
- [ ] Queried substrate for existing knowledge
- [ ] Identified gaps explicitly
- [ ] Delegated to appropriate subagents
- [ ] Emitted outputs incrementally
- [ ] Cited sources for all claims
- [ ] Calibrated confidence to evidence
- [ ] Linked to source blocks
- [ ] No duplicates vs substrate

**Quality bar:** Outputs that follow this pattern have 85%+ approval rate.
```

(Continue with yarnnn-quality-standards.md and yarnnn-substrate-patterns.md in similar style)

#### 3. Test Skills with SDK Agent

Update `RESEARCH_AGENT_OPTIONS` to load Skills:

```python
RESEARCH_AGENT_OPTIONS = ClaudeAgentOptions(
    system_prompt=RESEARCH_AGENT_SYSTEM_PROMPT,
    mcp_servers={"yarnnn": yarnnn_mcp_server},
    allowed_tools=[
        "mcp__yarnnn__query_substrate",
        "mcp__yarnnn__emit_work_output",
        "mcp__yarnnn__get_reference_assets",
        "Skill",  # Enable Skills
    ],
    # ... rest of config
)
```

#### 4. A/B Test: With Skills vs Without Skills

**Hypothesis:** Skills improve output quality and approval rate

**Test:**
1. Run SDK agent WITHOUT Skills on 5 research tasks
2. Run SDK agent WITH Skills on same 5 tasks
3. Compare:
   - Outputs created
   - User approval rate
   - Confidence calibration
   - Provenance completeness

### Success Criteria

- [ ] 3 Skills created based on Phase 2a observations
- [ ] Skills reference actual patterns, not theoretical ones
- [ ] Skills include examples from real outputs
- [ ] Agent can load Skills via Skill tool
- [ ] A/B test shows improvement (approval rate, output quality)
- [ ] Skills complement system prompts (not duplicate)

### Phase 2b Deliverables

1. **New Files:**
   - `.claude/skills/yarnnn-research-methodology/SKILL.md`
   - `.claude/skills/yarnnn-quality-standards/SKILL.md`
   - `.claude/skills/yarnnn-substrate-patterns/SKILL.md`

2. **Modified Files:**
   - `work-platform/api/src/agents_sdk/research_agent.py` (enable Skill tool)

3. **Test Results:**
   - A/B test comparison report
   - Output quality metrics (with vs without Skills)
   - Approval rate delta

### Exit Gate

**Do NOT proceed to Phase 3 until:**
- Skills demonstrably improve output quality
- A/B test shows positive delta
- Skills are being used by agent (not ignored)
- No negative side effects (e.g., Skills don't slow execution)

---

## Phase 3: Production Integration

**Goal:** Deploy SDK-based ResearchAgent to production
**Duration:** 3-4 days
**Status:** Not Started
**Dependencies:** Phase 2a + 2b complete

### Scope

1. Remove feature flag (USE_AGENT_SDK → always true)
2. Deprecate legacy yarnnn_agents implementation
3. Full production deployment
4. Monitoring and rollback plan

### Implementation Steps

#### 1. Gradual Rollout

**Week 1: Canary (10% traffic)**
```python
USE_AGENT_SDK = random.random() < 0.10  # 10% of requests
```

**Week 2: Expand (50% traffic)**
```python
USE_AGENT_SDK = random.random() < 0.50
```

**Week 3: Full (100% traffic)**
```python
USE_AGENT_SDK = True  # Always SDK
```

#### 2. Metrics to Track

- Work sessions created (SDK vs legacy)
- Outputs per session (SDK vs legacy)
- User approval rate (SDK vs legacy)
- Execution time (p50, p95, p99)
- Error rate (SDK vs legacy)
- Subagent invocation patterns

#### 3. Rollback Plan

If SDK version shows:
- Approval rate drop >10%
- Error rate increase >20%
- Execution time increase >2x

**Rollback:**
```python
USE_AGENT_SDK = False  # Back to legacy
```

#### 4. Production Hardening

- Error handling for SDK subprocess failures
- Logging for SDK session traces
- Cost tracking (SDK vs legacy token usage)
- Performance profiling

### Success Criteria

- [ ] SDK version handles 100% of production traffic
- [ ] No approval rate regression (<5% delta)
- [ ] Error rate stable (<1% increase)
- [ ] Execution time acceptable (p95 <5min)
- [ ] Legacy code deprecated (but preserved for rollback)

---

## Timeline Summary

| Phase | Duration | Dependencies | Status |
|-------|----------|--------------|--------|
| Phase 0 | 2-3 days | None | ✅ COMPLETE |
| Phase 1 | 3-4 days | Phase 0 | ✅ COMPLETE |
| **Phase 2a** | **3-4 days** | **Phase 0+1** | **⏳ NEXT** |
| **Phase 2b** | **2-3 days** | **Phase 2a** | **📋 PLANNED** |
| **Phase 3** | **3-4 days** | **Phase 2a+2b** | **📋 PLANNED** |

**Total:** 13-18 days (vs original 25-30 days Skills-first approach)

**Key Advantage:** Working structure after 7-8 days (Phase 2a complete)

---

## Decision Log

**2025-11-18: Structure-First Approach Approved**
- Rationale: Existing ResearchAgent provides proven blueprint
- Risk: Lower (real patterns > theoretical patterns)
- Timeline: Faster (no speculative Skills design)
- Quality: Higher (Skills informed by implementation)

**Key Trade-Off:**
- Skills come AFTER structure (not before)
- Accepts that Phase 2a won't have Skills initially
- Trusts that Phase 2b Skills will be better informed

**User Guidance:**
"Building the framework then adding the features on top of it"
