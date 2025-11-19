# Tool Use Architecture Analysis & Recommendations
**Date**: November 19, 2025
**Purpose**: Validate YARNNN's tool use architecture against Claude's official patterns

---

## Executive Summary

**Analysis Result**: ⚠️ **PARTIALLY CORRECT** - Custom tools work, but missing Claude server tools (web_search, web_fetch)

**Key Findings**:
1. ✅ **Custom Tool Use**: emit_work_output correctly implemented
2. ✅ **Tool Schema**: Proper JSON Schema format
3. ❌ **Web Search**: Declared in subagents but NOT passed to Claude API
4. ❌ **Web Fetch**: Declared in subagents but NOT passed to Claude API
5. ⚠️ **Memory Pattern**: Using adapter (not Claude's memory tool) - architectural decision needed

---

## 1. Current Tool Use Architecture

### How YARNNN Implements Tools (Current)

```python
# BaseAgent.reason() - work-platform/api/src/yarnnn_agents/base.py:280-342
async def reason(self, task, context=None, tools=None, ...):
    request_params = {
        "model": self.model,
        "messages": messages,
    }

    if tools:
        request_params["tools"] = [
            {
                "name": tool["name"],
                "description": tool["description"],
                "input_schema": tool["input_schema"]
            }
            for tool in tools
        ]

    response = await self.claude.messages.create(**request_params)
```

**Pattern**: ✅ **CORRECT** - Matches Claude's client tool pattern

### Current Tool Usage

**ResearchAgentSDK** ([research_agent.py:496-500](work-platform/api/src/agents_sdk/research_agent.py#L496-L500)):
```python
response = await self.reason(
    task=research_prompt,
    context=context,
    tools=[EMIT_WORK_OUTPUT_TOOL],  # ✅ Only custom tool passed
    max_tokens=8000
)
```

**Problem**: Subagents declare `tools=["web_search", "web_fetch"]` but these are NEVER passed to Claude!

---

## 2. Gap Analysis: Web Search & Web Fetch

### What Subagents Declare (Unused)

**Web Monitor** ([research_agent.py:328-336](work-platform/api/src/agents_sdk/research_agent.py#L328-L336)):
```python
self.subagents.register(
    SubagentDefinition(
        name="web_monitor",
        system_prompt=WEB_MONITOR_PROMPT,
        tools=["web_search", "web_fetch"],  # ❌ Declared but never used
    )
)
```

**Competitor Tracker, Social Listener** - Same pattern

### Why Tools Aren't Working

**Root Cause**: `SubagentDefinition.tools` is just metadata - it's not passed to `BaseAgent.reason()`

**Current Flow**:
```
1. Subagent registered with tools=["web_search", "web_fetch"]
   ↓
2. ResearchAgentSDK.deep_dive() calls self.reason(tools=[EMIT_WORK_OUTPUT_TOOL])
   ↓
3. Claude receives ONLY emit_work_output tool
   ↓
4. web_search, web_fetch are NEVER sent to Claude
```

**Expected Flow** (according to Claude docs):
```
1. Enable web_search in Claude Console (org-level)
   ↓
2. Pass server tools to messages.create:
   request_params["tools"] = [
       {"type": "web_search_20250305", "name": "web_search"},
       EMIT_WORK_OUTPUT_TOOL
   ]
   ↓
3. Claude can now search the web autonomously
```

---

## 3. Claude's Official Tool Patterns

### Client Tools (Custom) ✅ IMPLEMENTED

**Definition**:
- Execute on YOUR systems
- You provide implementation
- Examples: emit_work_output, database queries, API calls

**YARNNN Implementation**: ✅ **CORRECT**
```python
EMIT_WORK_OUTPUT_TOOL = {
    "name": "emit_work_output",
    "description": "...",
    "input_schema": {...}
}
```

### Server Tools (Anthropic) ❌ MISSING

**Definition**:
- Execute on ANTHROPIC's servers
- No implementation needed
- Examples: web_search, web_fetch, computer_use

**Required Format**:
```python
{
    "type": "web_search_20250305",  # Versioned type
    "name": "web_search"
}
```

**NOT** like client tools (no input_schema needed)

---

## 4. Memory Architecture Analysis

### Current Pattern: Memory Adapter (BFF)

```python
# SubstrateMemoryAdapter - adapters/memory_adapter.py
class SubstrateMemoryAdapter(MemoryProvider):
    """
    Adapter that wraps substrate-API calls as MemoryProvider interface.

    Pattern: BFF (Backend-for-Frontend)
    - Memory is NOT a tool
    - Agent code calls memory.query() directly
    - Results injected into context parameter
    """

    def query(self, query_text: str) -> List[Block]:
        # Calls substrate-API /api/blocks
        return self.substrate_client.search_blocks(query_text)
```

**Usage in ResearchAgentSDK**:
```python
# deep_dive() - research_agent.py:476-483
if self.memory:
    relevant_context = await self.memory.query(f"Research about: {topic}")
    context = self._format_context_for_claude(relevant_context)

# Context injected as USER message (NOT tool)
response = await self.reason(
    task=research_prompt,
    context=context,  # Memory results here
    tools=[EMIT_WORK_OUTPUT_TOOL]
)
```

### Claude's Memory Tool Pattern

```python
# Claude's approach - docs.claude.com/memory-tool
{
    "type": "memory_20250627",  # Server tool
    "name": "memory",
    "operations": ["view", "create", "str_replace", "insert", "delete", "rename"]
}

# Claude manages memory autonomously:
# 1. Claude decides when to read/write memory
# 2. Claude structures memory as files (/memories/*.md)
# 3. Persistent across context resets
```

### Key Differences

| Aspect | YARNNN (Current) | Claude Memory Tool |
|--------|------------------|-------------------|
| **Control** | Agent code controls | Claude controls |
| **Pattern** | Pull (query before reasoning) | Push (Claude reads/writes as needed) |
| **Storage** | Substrate-API (blocks) | Client filesystem (/memories/) |
| **Persistence** | Database | Files |
| **Context** | Injected as user message | Tool use (dynamic) |
| **Provenance** | Block lineage | File operations |

---

## 5. First Principles Analysis: Memory Pattern

### Question: Should YARNNN use Claude's memory tool?

**Arguments FOR Memory Tool**:
1. **Claude Autonomy**: Let Claude decide when memory is relevant
2. **Token Efficiency**: No need to inject full context upfront
3. **Multi-turn**: Claude can update memory mid-conversation
4. **Standard Pattern**: Aligns with Claude's official approach

**Arguments AGAINST Memory Tool (Keep Adapter)**:
1. **Substrate Integration**: Our memory IS the substrate (blocks, timeline, semantic layer)
2. **Provenance**: Substrate provides lineage, quality scoring, governance
3. **Search Quality**: Substrate has semantic search, not just file reads
4. **Governance**: Memory modifications go through proposals (not direct writes)
5. **Architectural Consistency**: Work-platform is BFF to substrate-API

### Recommendation: **KEEP Memory Adapter Pattern**

**Rationale**:
1. **Substrate is NOT just memory** - it's a governed knowledge graph with:
   - Semantic search (not file-based)
   - Quality scoring and curation
   - Timeline and provenance
   - Multi-user governance (proposals)

2. **Memory tool is too simple** for YARNNN's needs:
   - Claude memory tool = filesystem operations
   - YARNNN substrate = governed knowledge base

3. **BFF pattern is correct** for this architecture:
   ```
   Agent → Memory Adapter (BFF) → Substrate-API → Supabase
   ```
   This is intentional separation of concerns.

4. **Context injection is appropriate** when:
   - Memory has structure (blocks with types, confidence, lineage)
   - Memory requires governance (can't let Claude write directly)
   - Memory is expensive to query (semantic search, not file read)

### Counter-Example Where Memory Tool WOULD Be Better

If YARNNN were just "persistent scratch space":
```
Agent needs to:
- Remember user preferences
- Track conversation state
- Store intermediate calculations
```

Then memory tool would be perfect. But YARNNN substrate is a **governed knowledge base**, not scratch space.

---

## 6. Recommendations

### Priority 1: Enable Web Search & Web Fetch (Critical)

**Problem**: ResearchAgentSDK cannot actually search the web despite subagents declaring it.

**Solution**:
```python
# research_agent.py - Update deep_dive()
tools = [EMIT_WORK_OUTPUT_TOOL]

# Add server tools for research
tools.extend([
    {"type": "web_search_20250305", "name": "web_search"},
    {"type": "web_fetch", "name": "web_fetch"}  # If available
])

response = await self.reason(
    task=research_prompt,
    context=context,
    tools=tools,  # Now includes web search!
    max_tokens=8000
)
```

**Prerequisites**:
1. Enable web_search in Claude Console (org-level setting)
2. Verify beta headers (if needed)
3. Handle rate limits ($10/1000 searches)

### Priority 2: Fix Subagent Tool Declaration

**Problem**: `SubagentDefinition.tools` is misleading - looks like tools are enabled but they're not.

**Options**:

**Option A**: Make SubagentDefinition.tools actually work
```python
# BaseAgent - Update reason() to merge subagent tools
def reason(self, task, context=None, tools=None, subagent_name=None, ...):
    if subagent_name and subagent_name in self.subagents:
        subagent = self.subagents[subagent_name]
        # Merge subagent-declared tools
        tools = (tools or []) + self._resolve_subagent_tools(subagent.tools)

    # ... rest of method
```

**Option B**: Remove tools from SubagentDefinition (simpler)
```python
# SubagentDefinition - Remove tools field (it's unused anyway)
SubagentDefinition(
    name="web_monitor",
    system_prompt=WEB_MONITOR_PROMPT,
    # tools removed - passed via reason() instead
)
```

**Recommendation**: **Option B** (remove tools field) - less complexity, explicit tool passing

### Priority 3: Document Memory Pattern Decision

**Action**: Add to YARNNN_PLATFORM_CANON_V4.md:

```markdown
### Memory Pattern: BFF Adapter (Not Memory Tool)

YARNNN uses a **Memory Adapter pattern** instead of Claude's memory tool.

**Why**: Substrate is a governed knowledge graph, not scratch space.
- Memory Adapter = BFF to substrate-API
- Substrate provides: semantic search, provenance, governance, quality scoring
- Claude memory tool = filesystem operations (too simple for our needs)

**When to use Memory Tool instead**:
- Scratch space for calculations
- User preferences
- Simple persistent state

**When to use Memory Adapter** (our choice):
- Governed knowledge base
- Multi-user content
- Semantic search required
- Provenance and quality tracking
```

---

## 7. Implementation Plan

### Phase 1: Enable Web Search (Immediate)

**Files to Update**:
1. `research_agent.py`: Add web_search tool to deep_dive()
2. Test with actual research task
3. Validate web_search results parsing

**Code Changes**:
```python
# research_agent.py:496
tools = [
    EMIT_WORK_OUTPUT_TOOL,
    {"type": "web_search_20250305", "name": "web_search"}
]

response = await self.reason(task=research_prompt, context=context, tools=tools)
```

### Phase 2: Clean Up SubagentDefinition (Next)

**Files to Update**:
1. `subagents.py`: Remove `tools` parameter from SubagentDefinition
2. `research_agent.py`: Update subagent registrations
3. `content_agent.py`, `reporting_agent.py`: Update if they use subagents

### Phase 3: Integration Test (Validate)

**Create Test**: `tests/integration/test_research_agent_web_search.py`

```python
async def test_research_agent_web_search():
    agent = ResearchAgentSDK(basket_id=..., workspace_id=..., work_ticket_id=...)

    result = await agent.deep_dive("What are the latest AI agent frameworks in 2025?")

    # Validate web search was used
    assert len(result["work_outputs"]) > 0

    # Findings should reference URLs (evidence of web search)
    finding = result["work_outputs"][0]
    assert "http" in finding.body  # Should cite web sources
```

---

## 8. References

- [Claude Tool Use Overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)
- [Web Search Tool](https://docs.claude.com/en/docs/agents-and-tools/tool-use/web-search-tool)
- [Memory Tool](https://docs.claude.com/en/docs/agents-and-tools/tool-use/memory-tool)
- Current Implementation:
  - [BaseAgent.reason()](work-platform/api/src/yarnnn_agents/base.py#L280-L342)
  - [ResearchAgentSDK.deep_dive()](work-platform/api/src/agents_sdk/research_agent.py#L456-L520)
  - [SubstrateMemoryAdapter](work-platform/api/src/adapters/memory_adapter.py)

---

**Document Version**: 1.0.0
**Next Action**: Enable web_search in ResearchAgentSDK and test
