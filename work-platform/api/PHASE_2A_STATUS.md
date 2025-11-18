# Phase 2a Status Report: Agent Architecture Refactoring

**Date:** 2025-11-18
**Status:** ✅ READY TO IMPLEMENT - Approach Clarified

## Strategic Clarification

**Key Discovery:** yarnnn_agents IS already an internalized Claude Agent SDK scaffold (based on https://github.com/Kvkthecreator/claude-agentsdk-opensource).

**What This Means:**
- Phase 2 is NOT "SDK migration" (we already have SDK scaffolding)
- Phase 2 IS "SDK refactoring and improvement"
- Focus: Improve existing SDK-based architecture, extract Skills

## Current Architecture (yarnnn_agents)

**Location:** `work-platform/api/src/yarnnn_agents/`

**SDK Components Already Implemented:**
- ✅ `BaseAgent` - Generic foundation for all agents
- ✅ `SubagentDefinition` - Subagent configuration
- ✅ `SubagentRegistry` - Subagent management and delegation
- ✅ Provider Interfaces - `MemoryProvider`, `GovernanceProvider`, `TaskProvider`
- ✅ Session Management - `AgentSession`, session tracking
- ✅ Lifecycle Hooks - step_start, step_end, execute_start, execute_end

**Current ResearchAgent Implementation:**
- Uses `AsyncAnthropic` directly (raw Claude API)
- 4 subagents: web_monitor, competitor_tracker, social_listener, analyst
- Tool-use pattern: `emit_work_output` for structured outputs
- BFF integration: SubstrateClient for substrate-API queries
- Work outputs tracked in work_sessions

## What Phase 2a Actually Does

**NOT Migration - This is REFACTORING**

**Goals:**
1. **Improve subagent isolation** - Better context boundaries
2. **Extract procedural knowledge** - Move prompts and patterns to reusable components
3. **Better tool-use patterns** - Cleaner structured output handling
4. **Prepare for Skills** - Create clean interfaces for Phase 2b

**Approach:**
Create `agents_sdk/` directory with **improved** implementations that:
- Use same `BaseAgent`, `SubagentDefinition` patterns
- Extract system prompts to module-level constants (reusability)
- Better separation of concerns (agent config vs execution)
- Cleaner interfaces for Skills to plug into

## Implementation Plan (Revised)

### Phase 2a: Refactor ResearchAgent ✅ READY

**Create:** `agents_sdk/research_agent.py`

**Pattern:** Improved SDK-based implementation

```python
from yarnnn_agents.base import BaseAgent
from yarnnn_agents.subagents import SubagentDefinition
from yarnnn_agents.tools import EMIT_WORK_OUTPUT_TOOL

# Extract prompts to module-level (reusability)
RESEARCH_AGENT_SYSTEM_PROMPT = """..."""
WEB_MONITOR_PROMPT = """..."""
# etc.

class ResearchAgentSDK(BaseAgent):
    """
    Improved ResearchAgent using cleaner SDK patterns.

    Key Improvements:
    - Prompts extracted for reuse
    - Better subagent isolation
    - Cleaner tool-use handling
    - Skills-ready architecture
    """

    def __init__(self, basket_id: str, work_session_id: str):
        # Create subagent definitions
        web_monitor = SubagentDefinition(
            name="web_monitor",
            description="Monitor websites and blogs for updates",
            system_prompt=WEB_MONITOR_PROMPT,
            tools=["emit_work_output", "query_substrate"],
            model="claude-sonnet-4-5"
        )
        # ... other subagents

        # Initialize BaseAgent with providers
        super().__init__(
            agent_type="research",
            memory=YarnnnMemory(basket_id=basket_id),
            governance=YarnnnGovernance(basket_id=basket_id),
            model="claude-sonnet-4-5"
        )

        # Register subagents
        self.subagents.register_multiple([
            web_monitor,
            competitor_tracker,
            social_listener,
            analyst
        ])

    async def deep_dive(self, task_intent: str) -> Dict[str, Any]:
        """
        Preserves exact interface from legacy.
        Improved implementation with better patterns.
        """
        # Use BaseAgent.execute() with clean delegation
        # ...
```

**Key Changes from Current Implementation:**
1. Prompts extracted to module-level constants
2. Use `SubagentDefinition` objects (not raw dicts)
3. Better separation: config vs execution
4. Cleaner tool response parsing
5. Skills-ready: `.claude/skills/` can augment prompts

**What Stays The Same:**
- `BaseAgent` and `SubagentDefinition` patterns
- `AsyncAnthropic` for Claude API
- Tool-use pattern with `emit_work_output`
- BFF pattern for substrate-API
- Work session tracking
- Database schemas

### Phase 2b: Extract Skills

**Create:** `.claude/skills/yarnnn-research-methodology/`

**Purpose:** Extract procedural knowledge from prompts into Skills

**Skills to Create:**
1. `yarnnn-research-methodology` - How to do research (query substrate first, fill gaps, cite sources)
2. `yarnnn-quality-standards` - Quality criteria (confidence scoring, evidence quality)
3. `yarnnn-substrate-patterns` - How to use substrate tools effectively

**Integration:**
Skills augment agent system prompts with reusable procedural knowledge.

## Exit Criteria

**Phase 2a Complete When:**
- ✅ `agents_sdk/research_agent.py` implemented with improved patterns
- ✅ Feature flag `USE_AGENT_SDK` enables new implementation
- ✅ Test shows new implementation creates work outputs successfully
- ✅ Prompts extracted to module-level constants
- ✅ Subagent definitions use clean `SubagentDefinition` pattern

**Phase 2b Complete When:**
- ✅ 3 Skills created in `.claude/skills/`
- ✅ Skills loaded and augment agent prompts
- ✅ Skills reduce prompt duplication
- ✅ Skills reusable across agents

## Files to Create/Modify

**New Files:**
- `work-platform/api/src/agents_sdk/__init__.py` - Module exports
- `work-platform/api/src/agents_sdk/research_agent.py` - Improved implementation
- `work-platform/api/.claude/skills/yarnnn-research-methodology/` - Skills (Phase 2b)

**Modified Files:**
- `work-platform/api/src/app/routes/agent_orchestration.py` - Feature flag integration

**Test File:**
- `work-platform/api/test_sdk_agent.py` - Validation test

## Next Steps

1. ✅ Clarification complete - yarnnn_agents IS SDK-based
2. ⏳ Implement improved `ResearchAgentSDK` using YARNNN SDK patterns
3. ⏳ Test against ani-project basket
4. ⏳ Extract Skills (Phase 2b)
5. ⏳ Remove legacy after validation

---

**Recommendation:** Proceed with Phase 2a implementation using correct YARNNN SDK patterns (BaseAgent, SubagentDefinition).
