# Claude Agent SDK Selection Rationale

**Why YARNNN Uses Claude Agent SDK Over Raw API or Alternative Frameworks**

**Version**: 1.0
**Date**: 2025-11-18
**Status**: ✅ Canonical - Architecture Decision Record
**Category**: Infrastructure Decision
**Audience**: Engineering, Architecture, Future Team Members

---

## 🎯 Purpose of This Document

This document permanently captures **why YARNNN selected the Claude Agent SDK** over alternatives (raw Anthropic API, OpenAI Agents SDK, custom frameworks). It exists to:

1. **Prevent confusion** between Claude API (simple LLM calls) vs Claude Agent SDK (agentic infrastructure)
2. **Document decision rationale** so future team members understand the architectural choice
3. **Preserve research context** - links, concepts, distinctions that took significant time to discern
4. **Avoid re-litigating** this decision without new information

**Critical Distinction:**
- **Claude API** = Make LLM calls, get text responses (like ChatGPT API)
- **Claude Agent SDK** = Full agentic infrastructure with Skills, subagents, session management, MCP tools

---

## ⚠️ The Confusion This Document Resolves

### Initial Misconception (2025-11-17)

The work-platform initially implemented agents using **raw Anthropic API**:

```python
# What we built initially (WRONG PATTERN)
from anthropic import AsyncAnthropic

client = AsyncAnthropic(api_key=key)
response = await client.messages.create(
    model="claude-sonnet-4-5",
    tools=[EMIT_WORK_OUTPUT_TOOL],
    messages=[{"role": "user", "content": task}]
)
# Parse response, extract tool calls, done
```

**Problems with this approach:**
1. No agentic loop (single-shot only)
2. No session management (we'd have to build it)
3. No Skills (organizational context = bloated prompts)
4. No subagents (would require custom orchestration)
5. Conversation history management = our responsibility
6. Reinventing infrastructure that Claude Agent SDK provides

### Why This Happened

- Claude Agent SDK documentation wasn't clearly distinguished from Claude API docs
- The SDK requires Node.js + CLI (seemed like extra complexity)
- Initial prototyping used simpler API pattern
- No clear comparison of SDK features vs raw API

**This document ensures we never make this mistake again.**

---

## 📊 The Decision Matrix

### Options Evaluated (2025-11-17 to 2025-11-18)

| Option | Description | Verdict |
|--------|-------------|---------|
| **Raw Anthropic API** | Direct `messages.create()` calls | ❌ Too low-level, reinvents infrastructure |
| **Claude Agent SDK** | Full agentic framework from Anthropic | ✅ **SELECTED** - Perfect alignment with YARNNN thesis |
| **OpenAI Agents SDK** | Provider-agnostic agent framework | ❌ Missing Skills, requires manual session mgmt |
| **Custom Framework** | Build our own agent loop | ❌ Undifferentiated heavy lifting |

---

## ✅ Why Claude Agent SDK Was Selected

### 1. Skills = Organizational Context (YARNNN's Core Thesis)

**The Problem:**
YARNNN's value proposition is **"context understanding enables superior agent reasoning"**. We need to provide agents with:
- Research methodologies
- Quality standards
- Output templates
- Substrate query patterns
- Work output structures

**Raw API Approach:**
- Stuff everything into system prompts (context bloat, $$$)
- OR retrieve dynamically (reinventing Skills)

**Claude Agent SDK Solution:**
Skills provide **procedural knowledge at zero token cost until relevant**.

```markdown
# .claude/skills/yarnnn-research/SKILL.md
---
name: yarnnn-research-methodology
description: Research methodology for YARNNN substrate-backed intelligence
---

## Workflow
1. Query substrate for existing knowledge (avoid redundancy)
2. Identify knowledge gaps from substrate blocks
3. Conduct targeted research on gaps only
4. Structure findings as work outputs (finding/insight/recommendation)
5. Track provenance to source blocks

## Quality Standards
- Confidence >0.8 requires primary sources
- Always link to source_block_ids
- Findings must extend substrate, not duplicate

## Templates
[Templates for structured outputs]
```

**Progressive Loading:**
- Metadata (100 tokens) always loaded
- Instructions (~5k tokens) loaded when relevant
- Resources (scripts, templates) accessed via bash (no context tokens)

**Why This Matters:**
- Skills embed YARNNN's organizational context (substrate patterns, quality standards)
- No token cost until needed
- Reusable across all agents
- **This IS the moat** - organizational intelligence encoded as Skills

**Documentation:**
- Official Docs: https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview
- Key Insight: "Skills package instructions, metadata, and resources that Claude uses automatically when relevant"

---

### 2. Built-in Session Management (Not Our Value-Add)

**The Problem:**
Agents need conversation history for multi-turn reasoning. Managing this is:
- Low-value work (infrastructure plumbing)
- High-risk (memory bloat, compaction complexity)
- Not YARNNN's differentiator

**Raw API Approach:**
```python
# We'd have to manage this ourselves
messages = []
messages.append({"role": "user", "content": "Research competitors"})
response = await client.messages.create(messages=messages)
messages.append({"role": "assistant", "content": response.content})
messages.append({"role": "user", "content": "Now analyze pricing"})
# Manage history growth, compaction, persistence, cleanup...
```

**Claude Agent SDK Solution:**
- Built-in session management via Claude Code infrastructure
- Sessions stored/resumed automatically
- **Auto-compaction** for long conversations
- We don't touch conversation history

**Why This Matters:**
- Focus engineering time on YARNNN's moat (substrate ↔ work integration)
- Avoid conversation memory bloat (known risk, managed by SDK)
- Session resumption out-of-the-box

**Documentation:**
- Session Management: https://docs.claude.com/en/docs/agent-sdk/hosting
- Key Quote: "Sessions don't timeout automatically" - built-in persistence

---

### 3. Subagents = YARNNN's Multi-Agent Architecture

**The Vision:**
YARNNN's architecture includes specialized agent types:
- **Research Agent** with subagents:
  - Market Intelligence (track trends)
  - Competitor Tracker (deep analysis)
  - Social Listener (social signals)
  - Analyst (synthesis)

**Raw API Approach:**
- Build custom orchestration
- Manage context isolation manually
- Sequential execution unless we build parallelization

**Claude Agent SDK Solution:**
```javascript
agents: {
  'market-intelligence': {
    description: 'Track market trends and competitor movements',
    prompt: 'You monitor markets and identify signals...',
    tools: ['query_substrate', 'web_search', 'emit_work_output'],
    model: 'sonnet'  // Cost-efficient for monitoring
  },
  'competitor-tracker': {
    description: 'Deep analysis of specific competitors',
    prompt: 'You analyze competitor strategy...',
    tools: ['query_substrate', 'web_search', 'emit_work_output'],
    model: 'opus'  // More powerful for deep analysis
  },
  'analyst': {
    description: 'Synthesize findings into insights',
    prompt: 'You synthesize research into actionable insights...',
    tools: ['query_substrate', 'emit_work_output'],
    model: 'sonnet'
  }
}
```

**Key Features:**
- **Context Isolation:** Each subagent has clean context (no bloat)
- **Parallel Execution:** Built-in concurrency
- **Model Selection:** Different models per subagent (cost optimization)
- **Tool Restriction:** Limit tools per subagent (security)

**Why This Matters:**
- Direct mapping to YARNNN's planned agent hierarchy
- Context isolation prevents the "everything in one prompt" problem
- Parallel execution = faster research workflows
- Declarative definition (no orchestration code)

**Documentation:**
- Subagents Overview: https://docs.claude.com/en/docs/agent-sdk/subagents
- Key Quote: "Context isolation prevents information overload"

---

### 4. MCP Tools = YARNNN's Integration Layer

**The Integration Challenge:**
YARNNN agents need to:
- Query substrate for context blocks
- Emit work outputs for supervision
- Get reference assets
- (Future) Search web, analyze data

**Raw API Approach:**
- Define tools as JSON schemas
- Parse tool_use responses
- Execute tools in our code
- Return tool_result messages
- Build the agentic loop ourselves

**Claude Agent SDK Solution:**
MCP (Model Context Protocol) provides standard tool integration:

```python
from claude_agent_sdk import create_sdk_mcp_server, tool

@tool("query_substrate", "Query YARNNN substrate for context blocks", {
    "query": str,
    "limit": int,
    "min_similarity": float
})
async def query_substrate(args):
    """Semantic search across substrate blocks."""
    return await substrate_client.semantic_search(
        query=args["query"],
        limit=args.get("limit", 10),
        min_similarity=args.get("min_similarity", 0.7)
    )

@tool("emit_work_output", "Submit structured work output", {
    "output_type": str,
    "title": str,
    "body": dict,
    "confidence": float,
    "source_block_ids": list
})
async def emit_work_output(args):
    """Write work output to substrate-API via BFF."""
    return await work_output_service.create(
        output_type=args["output_type"],
        title=args["title"],
        body=args["body"],
        confidence=args["confidence"],
        source_context_ids=args["source_block_ids"]
    )

yarnnn_mcp = create_sdk_mcp_server(
    name="yarnnn",
    version="1.0.0",
    tools=[query_substrate, emit_work_output, get_reference_assets]
)
```

**Why This Matters:**
- Standard protocol (MCP is Anthropic's ecosystem standard)
- Clean separation (tools live in work-platform, called by agents)
- Growing ecosystem (future tools via MCP marketplace)
- In-process execution (no subprocess overhead like external MCP servers)

**Documentation:**
- MCP Overview: https://github.com/anthropics/courses/blob/master/tool_use/01_tool_use_overview.ipynb
- SDK MCP: Built-in support via `create_sdk_mcp_server()`

---

### 5. Hosting Flexibility = Deployment Options

**Deployment Patterns Supported:**

1. **Ephemeral Sessions** (current plan)
   - Create container per work session
   - Destroy when complete
   - Good for: One-off research tasks

2. **Long-Running Sessions** (future)
   - Persistent containers
   - Good for: Proactive monitoring, continuous agents

3. **Hybrid Sessions** (future)
   - Ephemeral containers hydrated with historical state
   - Good for: Multi-day projects

**Infrastructure Requirements:**
- Python 3.10+ ✅ (already have)
- Node.js 18+ ⚠️ (REQUIRED - Claude Code CLI dependency)
- Claude Code CLI ⚠️ (REQUIRED - Python SDK is a wrapper)
- ~1GB RAM, 5GB disk ✅ (Render supports)

**Critical Understanding:**
The Python SDK is **NOT standalone** - it wraps the Claude Code CLI (which requires Node.js). The SDK communicates with the CLI via subprocess. Architecture:

```
Python SDK (your code)
    ↓ subprocess calls
Claude Code CLI (Node.js process)
    ↓ API calls
Claude API (Anthropic)
```

**Why This Matters:**
- You MUST install Node.js even though you're using Python
- You MUST install Claude Code CLI globally (`npm install -g`)
- The SDK cannot function without CLI in system PATH
- Runtime has both Python and Node.js processes

**Render Compatibility:**
```dockerfile
# Dockerfile for work-platform (Render)
FROM python:3.10

# Install Node.js (REQUIRED for Claude Code CLI)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

# Install Claude Code CLI (REQUIRED for Python SDK)
RUN npm install -g @anthropic-ai/claude-code

# Verify Claude Code installation
RUN claude-code --version

# Install Python deps (includes claude-agent-sdk)
COPY requirements.txt .
RUN pip install -r requirements.txt

# App code
COPY . /app
WORKDIR /app

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Cost Profile:**
- Container: ~$0.05/hour (minimal)
- Tokens: Dominant cost (same as raw API)
- No premium for using SDK
- Extra process overhead: Python + Node.js (CLI) running simultaneously

**Documentation:**
- Hosting Guide: https://docs.claude.com/en/docs/agent-sdk/hosting
- Python SDK Docs: https://docs.claude.com/en/docs/agent-sdk/python
- Key Quote: "A minimum cost is roughly 5 cents per hour running"

---

### ⚠️ Critical Architecture Understanding: Python SDK = CLI Wrapper

**This is important to understand before proceeding:**

The Claude Agent SDK for Python is **NOT** a direct API client. It's a **wrapper around the Claude Code CLI**.

**What this means:**
```
┌─────────────────────────────────────┐
│  Your Python Code                   │
│  (uses claude-agent-sdk)            │
└────────────┬────────────────────────┘
             │ subprocess.Popen()
             │ stdin/stdout communication
             ▼
┌─────────────────────────────────────┐
│  Claude Code CLI                    │
│  (Node.js process)                  │
│  (@anthropic-ai/claude-code)        │
└────────────┬────────────────────────┘
             │ HTTP requests
             ▼
┌─────────────────────────────────────┐
│  Claude API                         │
│  (Anthropic infrastructure)         │
└─────────────────────────────────────┘
```

**Implications:**
1. **Node.js is NOT optional** - Even though you're writing Python, you MUST have Node.js installed
2. **Two runtimes running** - Python (your app) + Node.js (CLI subprocess)
3. **Subprocess overhead** - IPC communication between Python and Node.js processes
4. **Deployment complexity** - Must install both Python and Node.js dependencies
5. **Error surface** - Errors can occur in Python SDK, CLI subprocess, or API layer

**Why Anthropic Built It This Way:**
- Claude Code CLI is their battle-tested agentic infrastructure (powers Claude Code product)
- Python SDK provides Python-friendly API to that infrastructure
- Avoids reimplementing agentic loop in Python
- Ensures feature parity across SDK languages (TypeScript, Python both use same CLI)

**Trade-off Acceptance:**
Yes, this adds deployment complexity (Node.js + CLI). But:
- ✅ We get battle-tested agentic infrastructure
- ✅ Skills, subagents, session management work out-of-box
- ✅ No need to build agentic loop ourselves
- ✅ Organizational context (Skills) is worth the complexity

**Alternative Considered:**
Raw Anthropic API (Python-only, no Node.js) was rejected because:
- ❌ No Skills (organizational context in prompts = bloat)
- ❌ No session management (we'd build it)
- ❌ No subagents (custom orchestration)
- ❌ Agentic loop = our responsibility

**The Node.js dependency is justified by the value Skills + subagents + session management provide.**

---

## 🚫 Why Alternatives Were Rejected

### Raw Anthropic API

**Reasons for Rejection:**
1. No Skills (would bloat prompts with organizational context)
2. No session management (we'd build it ourselves)
3. No subagents (custom orchestration required)
4. Agentic loop = our responsibility
5. Conversation history = our responsibility
6. **Reinventing infrastructure that SDK provides**

**When to Use Raw API:**
- Simple, single-shot LLM calls
- No multi-turn reasoning needed
- No organizational context
- Stateless interactions

**Not Appropriate for YARNNN Because:**
- We need multi-turn reasoning (work sessions)
- We need organizational context (research methodology, quality standards)
- We need session persistence (long-running work)
- We need subagent orchestration (specialized research)

---

### OpenAI Agents Python SDK

**What It Provides:**
- Generic agent framework
- Provider-agnostic (100+ LLMs via LiteLLM)
- Handoffs for multi-agent orchestration
- Built-in session backends (SQLite, Redis, PostgreSQL)
- Structured outputs

**Reasons for Rejection:**

#### 1. No Skills Equivalent
OpenAI SDK only has:
- Tools (function_tool decorator)
- System prompts (static instructions)
- Handoffs (agent delegation)

To provide organizational context, you must:
- Stuff into system prompts (context bloat, $$)
- OR build custom retrieval (reinventing Skills)

**Skills are critical for YARNNN** - they embed substrate patterns, research methodology, quality standards at zero token cost.

#### 2. Session Management = Our Responsibility
```python
# OpenAI SDK - you manage sessions
from agents import SQLiteSession, Runner

session = SQLiteSession("sessions.db")
result = await Runner.run(agent, input, session=session)
# You manage: history growth, compaction, cleanup
```

vs.

```python
# Claude Agent SDK - sessions managed for you
result = await query(prompt, options={...})
# Session automatically managed, compacted, persisted
```

**We don't want to manage conversation history** - it's undifferentiated heavy lifting.

#### 3. Handoffs ≠ Subagents
```python
# OpenAI SDK - handoffs are sequential
planner = Agent(name="Planner", ...)
researcher = Agent(name="Researcher", ...)
synthesizer = Agent(name="Synthesizer", ...)

coordinator = Agent(
    name="Coordinator",
    handoffs=[planner, researcher, synthesizer]
)
# Coordinator hands off to planner → researcher → synthesizer
# Sequential execution, shared history
```

vs.

```python
# Claude Agent SDK - subagents are parallel + isolated
agents: {
  'planner': {...},
  'researcher': {...},
  'synthesizer': {...}
}
# Parallel execution, context isolation
```

**YARNNN needs parallel subagents with context isolation** - not sequential handoffs.

#### 4. Provider-Agnostic = Not an Advantage
Yes, OpenAI SDK supports 100+ models via LiteLLM. But:
- We're committed to Claude (quality, extended thinking, reliability)
- Provider-agnostic means lowest-common-denominator features
- Claude-specific features (Skills, compaction) not available

**We'd rather optimize for Claude than support all models.**

**Documentation:**
- OpenAI Agents SDK: https://github.com/openai/openai-agents-python
- Our Analysis: Conducted 2025-11-18, concluded Skills gap is disqualifying

---

### Custom Framework

**Why We Don't Build Our Own:**
1. **Undifferentiated heavy lifting** - agentic loops are solved problems
2. **Maintenance burden** - every Claude API change requires updates
3. **Feature gap** - Skills, compaction, session management take months to build
4. **Not our moat** - YARNNN's value is substrate ↔ work integration, not agent framework

**When to Build Custom:**
- No existing solution meets needs
- Unique requirements justify investment
- Framework itself is the product

**Not Appropriate for YARNNN Because:**
- Claude Agent SDK exists and fits perfectly
- Our moat is elsewhere (substrate, governance, work supervision)
- Engineering time better spent on differentiation

---

## 📖 Key Concepts Reference (Permanent)

### Skills vs Tools: The Critical Distinction

**Tools = Actions Claude Can Take**
```python
@tool("send_email", "Send an email", {"to": str, "subject": str, "body": str})
async def send_email(args):
    # Execute action
    return await email_service.send(...)
```

- What: Specific executable functions
- When invoked: Claude decides based on task
- Token cost: Tool definition + execution result
- Example: `send_email`, `query_database`, `fetch_weather`

**Skills = Procedural Knowledge + Context**
```markdown
# .claude/skills/email-triage/SKILL.md
---
name: email-triage-workflow
description: Email triage and response methodology
---

## Workflow
1. Classify email by urgency (high/medium/low)
2. Check sender history for context
3. Draft response using templates
4. Flag for review if sensitive

## Templates
- Standard response: [template]
- Escalation: [template]
```

- What: Instructions, workflows, templates, organizational context
- When loaded: Metadata always (100 tokens), full content when relevant
- Token cost: Near-zero until needed (progressive disclosure)
- Example: Research methodology, code review checklist, customer support workflows

**Key Insight:**
> "Tools are the primary building blocks of execution. Skills provide procedural knowledge that Claude uses automatically when relevant."

**For YARNNN:**
- **Tools:** `query_substrate`, `emit_work_output`, `get_reference_assets`
- **Skills:** Research methodology, quality standards, output templates, substrate patterns

**Why Skills Matter:**
Organizational context (research workflows, quality standards) would cost thousands of tokens if embedded in prompts. Skills provide this at ~100 tokens (metadata only) until relevant.

---

### Subagents vs Handoffs

**Subagents (Claude Agent SDK):**
```javascript
agents: {
  'specialist-a': {
    description: 'Handles task type A',
    prompt: 'You are an expert at A...',
    tools: ['tool1', 'tool2'],
    model: 'sonnet'
  },
  'specialist-b': {
    description: 'Handles task type B',
    prompt: 'You are an expert at B...',
    tools: ['tool3', 'tool4'],
    model: 'opus'
  }
}
```

- **Execution:** Parallel (both run concurrently)
- **Context:** Isolated (each has clean context)
- **Invocation:** Automatic (based on description + task)
- **Tools:** Restricted per subagent
- **Model:** Different per subagent

**Handoffs (OpenAI Agents SDK):**
```python
agent_a = Agent(name="A", handoffs=[agent_b])
agent_b = Agent(name="B", handoffs=[agent_c])
```

- **Execution:** Sequential (A → B → C)
- **Context:** Shared (conversation history flows)
- **Invocation:** Explicit (agent decides to hand off)
- **Tools:** Per agent definition
- **Model:** Per agent definition

**For YARNNN:**
Research workflow needs **parallel execution** with **context isolation**:
- Market Intelligence + Competitor Tracker + Social Listener run in parallel
- Each subagent has focused context (not bloated with others' findings)
- Analyst subagent synthesizes results

**Subagents are the right pattern.**

---

### Session Types: Ephemeral vs Long-Running

**Ephemeral Sessions:**
```python
# Create container for task, destroy when done
async def handle_work_session(task_id):
    result = await query(
        prompt=f"Research: {task_intent}",
        options={...}
    )
    # Session ends, container destroyed
    return result
```

- **Use Case:** One-off tasks (research, content generation)
- **Cost:** Per-execution
- **State:** Stateless (hydrated from DB if needed)
- **YARNNN Fit:** ✅ Perfect for work sessions

**Long-Running Sessions:**
```python
# Maintain persistent container
async def run_continuous_agent():
    while True:
        tasks = await poll_for_tasks()
        for task in tasks:
            result = await query(task, options={...})
        await asyncio.sleep(60)
```

- **Use Case:** Monitoring, proactive agents
- **Cost:** Continuous container cost (~$0.05/hr)
- **State:** Persistent
- **YARNNN Fit:** 🔮 Future (proactive monitoring agents)

**Hybrid Sessions:**
```python
# Ephemeral container + historical state
async def handle_multi_day_project(project_id):
    # Hydrate from DB
    history = await load_project_history(project_id)

    result = await query(
        prompt="Continue work on project",
        options={"resume_session": history}
    )
    # Session ends, state saved to DB
```

- **Use Case:** Multi-day projects, intermittent work
- **Cost:** Per-execution + state storage
- **State:** Hydrated/dehydrated
- **YARNNN Fit:** 🔮 Future (long-running research projects)

**Current Plan:** Ephemeral sessions for work sessions (one task = one container)

---

### MCP Tools: In-Process vs External

**In-Process MCP (What We'll Use):**
```python
from claude_agent_sdk import create_sdk_mcp_server, tool

@tool("query_substrate", "...", {...})
async def query_substrate(args):
    return await substrate_client.search(...)

yarnnn_mcp = create_sdk_mcp_server(
    name="yarnnn",
    tools=[query_substrate, ...]
)

# Use in agent
options = ClaudeAgentOptions(
    mcp_servers={"yarnnn": yarnnn_mcp}
)
```

- **Execution:** Same Python process
- **Performance:** No IPC overhead
- **Deployment:** Bundled with app
- **Use Case:** Custom business logic (YARNNN substrate, work outputs)

**External MCP (Future):**
```python
# Reference external MCP server
options = ClaudeAgentOptions(
    mcp_servers={
        "web-search": "mcp://tavily-search-server"
    }
)
```

- **Execution:** Separate process/service
- **Performance:** IPC overhead
- **Deployment:** External dependency
- **Use Case:** Third-party integrations (Tavily search, Firecrawl, etc.)

**YARNNN Strategy:**
- In-process MCP for substrate/work integration (core logic)
- External MCP for third-party services (search, data sources)

---

## 🔗 Essential Documentation Links

### Official Claude Agent SDK Documentation

**Core SDK:**
- Overview: https://docs.claude.com/en/docs/agent-sdk/overview
- Installation: https://docs.claude.com/en/docs/agent-sdk/installation
- Hosting: https://docs.claude.com/en/docs/agent-sdk/hosting

**Skills:**
- Overview: https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview
- Creating Skills: https://docs.claude.com/en/docs/agents-and-tools/agent-skills/creating-skills
- Progressive Loading: Described in overview (metadata → instructions → resources)

**Subagents:**
- Overview: https://docs.claude.com/en/docs/agent-sdk/subagents
- Configuration: Programmatic via `agents` parameter (recommended for SDK)

**MCP Tools:**
- Tool Use Notebook: https://github.com/anthropics/courses/blob/master/tool_use/01_tool_use_overview.ipynb
- SDK MCP: `create_sdk_mcp_server()` for in-process tools

**Key Blog Post:**
- Building Agents: https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk
- Covers: Skills philosophy, context efficiency, organizational knowledge

### Comparison Resources

**OpenAI Agents SDK:**
- Repository: https://github.com/openai/openai-agents-python
- Documentation: https://openai.github.io/openai-agents-python/
- Our Analysis: 2025-11-18, concluded Skills gap disqualifies it for YARNNN

**Raw Anthropic API:**
- Messages API: https://docs.anthropic.com/en/api/messages
- Tool Use: https://docs.anthropic.com/en/docs/build-with-claude/tool-use
- Use Case: Single-shot LLM calls, not agentic workflows

---

## 📋 Decision Summary

### Selected: Claude Agent SDK

**Core Rationale:**
1. **Skills** embed organizational context (YARNNN's moat) at zero token cost
2. **Built-in session management** lets us focus on substrate ↔ work integration
3. **Subagents** with context isolation match our multi-agent architecture
4. **MCP tools** provide clean integration layer
5. **Hosting flexibility** supports current (ephemeral) and future (long-running) patterns

**Trade-offs Accepted:**
- Node.js + CLI dependency (manageable on Render)
- Claude-only (not provider-agnostic) - acceptable, Claude is our choice
- SDK learning curve (documented in this file)

**Alignment with YARNNN Thesis:**
> **"Context understanding + Work supervision = Superior AI outcomes"**

Claude Agent SDK's **Skills architecture directly enables the context understanding** that powers YARNNN's flywheel.

---

## 🚀 Next Steps

1. **Read Implementation Plan:** See `CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md` (working document)
2. **Setup Infrastructure:** Node.js + Claude Code CLI on Render
3. **Build MCP Tools:** `query_substrate`, `emit_work_output`, `get_reference_assets`
4. **Define Skills:** Research methodology, quality standards, output templates
5. **Scaffold Research Agent:** With subagents (market intel, competitor, analyst)

---

## 📎 See Also

### YARNNN Canon
- [YARNNN_PLATFORM_CANON_V4.md](./YARNNN_PLATFORM_CANON_V4.md) - Core philosophy
- [YARNNN_WORK_PLATFORM_THESIS.md](./YARNNN_WORK_PLATFORM_THESIS.md) - Context + Work thesis
- [AGENT_SUBSTRATE_ARCHITECTURE.md](./AGENT_SUBSTRATE_ARCHITECTURE.md) - Integration architecture
- [TERMINOLOGY_GLOSSARY.md](./TERMINOLOGY_GLOSSARY.md) - Terminology reference

### Implementation
- [CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md](../architecture/CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md) - Scaffolding plan (working doc)

---

**This decision is canonical. Refer to this document before questioning the Claude Agent SDK choice.**

**Last Updated:** 2025-11-18
**Decision Made By:** Architecture review with comprehensive SDK evaluation
**Reviewers:** Engineering team
