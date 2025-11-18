# Claude Agent SDK Implementation Plan

**Scaffolding Plan for YARNNN's Claude Agent SDK Integration**

**Version**: 3.0 (Revised Structure-First Approach)
**Date**: 2025-11-18
**Status**: 🚧 Working Document (can be deleted after implementation)
**Category**: Implementation Guide
**Owner**: Engineering

---

## ⚠️ Document Status

**This is a WORKING DOCUMENT** - it serves as the implementation blueprint and can be deleted or archived after completion.

**Permanent Documentation:**
- Rationale: See [CLAUDE_AGENT_SDK_SELECTION_RATIONALE.md](../canon/CLAUDE_AGENT_SDK_SELECTION_RATIONALE.md)
- Architecture: See [AGENT_SUBSTRATE_ARCHITECTURE.md](../canon/AGENT_SUBSTRATE_ARCHITECTURE.md)
- Work Output Lifecycle: See [WORK_OUTPUT_LIFECYCLE_IMPLEMENTATION.md](../canon/WORK_OUTPUT_LIFECYCLE_IMPLEMENTATION.md)

---

## 🎯 Revised Strategy: Structure-First Approach

**Key Insight from Architecture Audit (2025-11-18):**
YARNNN already has a proven ResearchAgent architecture with:
- Custom implementation using raw Anthropic API
- 4 subagents pattern (web_monitor, competitor_tracker, social_listener, analyst)
- Tool-use pattern with `emit_work_output` **ALREADY DEPLOYED**
- Work output lifecycle **COMPLETE** (Phase 1-4 ✅ DEPLOYED)

**Why Structure-First:**
1. **Existing Blueprint**: ResearchAgent provides proven patterns to extract
2. **Architectural Constraints**: SDK integration will reveal what belongs in Skills vs config
3. **Better Skills**: Skills informed by real implementation, not theoretical patterns
4. **Incremental Risk**: Test structure works, THEN extract procedural knowledge

**Revised Implementation Order:**
- ~~Phase 0: Prove SDK works~~ **✅ COMPLETE**
- ~~Phase 1: MCP Tools for Substrate~~ **✅ COMPLETE**
- **Phase 2a: Convert ResearchAgent to Claude Agent SDK** (NEW - structure scaffold)
- **Phase 2b: Extract Skills from Working Implementation** (NEW - informed by Phase 2a)
- **Phase 3: Production Integration** (deploy with all Skills)

**Key Principle:** Build the framework first, then extract features that enhance it.

---

## 📊 Current State Summary (2025-11-18)

### What's Already Deployed ✅

**Phase 0 Infrastructure (COMPLETE):**
- Docker + Node.js 18.x runtime
- Claude Agent SDK Python package (claude-agent-sdk==0.1.6)
- Node.js Claude Code CLI bundled (SDK handles spawning)
- Deployed to Render successfully

**Phase 1 MCP Tools (COMPLETE):**
- `query_substrate` - Semantic search across knowledge substrate
- `emit_work_output` - Create structured deliverables
- `get_reference_assets` - Fetch reference files
- All three tools tested against production substrate-API
- Service-to-service auth working (temporarily exempted via exempt_prefixes)

**Work Output Lifecycle (Phase 1-4 COMPLETE - 2025-11-17):**
- `work_outputs` table in substrate-API with RLS
- Tool-use pattern: ResearchAgent emits structured outputs via `emit_work_output` tool
- BFF pattern: work-platform orchestrates, substrate-API owns data
- Dual auth: Service-to-service + User JWT supported
- Supervision status: pending_review → approved/rejected/revision_requested
- Provenance tracking: source_context_ids maps outputs to source blocks

**Existing ResearchAgent Architecture (Custom Implementation):**
- Location: `work-platform/api/src/yarnnn_agents/archetypes/research_agent.py`
- Uses **raw AsyncAnthropic API** (NOT Claude Agent SDK)
- 4 subagents: web_monitor, competitor_tracker, social_listener, analyst
- Capabilities: `monitor()` (scheduled), `deep_dive()` (on-demand)
- Already emits 6 output types: finding, recommendation, insight, draft_content, report_section, data_analysis
- SubstrateClient integration via BFF pattern
- Circuit breaker + retry logic for resilience

### What's Missing (Migration Target) ❌

**Claude Agent SDK Integration:**
- Current: Custom `SubagentDefinition` class with manual delegation
- Target: SDK's native subagent configuration with parallel execution
- Current: Manual tool response parsing
- Target: SDK's built-in tool-use pattern
- Current: No Skills support
- Target: Progressive Skills loading from `.claude/skills/`

**Skills Architecture:**
- `.claude/skills/` directory exists with test-skill only
- Production Skills NOT created yet:
  - `yarnnn-research-methodology` (planned)
  - `yarnnn-quality-standards` (planned)
  - `yarnnn-substrate-patterns` (planned)

**Subagent Constraints:**
- Current: Sequential execution (NOT parallel)
- Current: Shared context (NOT isolated)
- Target: SDK manages parallel execution with context isolation

### Key Architectural Findings

**Database Topology:**
- **work-platform DB**: projects, work_sessions, project_agents, agent_catalog
- **substrate-API DB**: baskets, blocks, reference_assets, **work_outputs**

**Cross-DB References:**
- work_session_id appears in both DBs but NOT FK-enforced (validated in app code)
- Same Supabase instance, different logical domains

**Service Boundaries (BFF Pattern):**
```
work-platform (orchestrator)
    ↓ HTTP
substrate-API (data owner)
    ↓
Supabase (storage)
```

**Tool-Use Pattern (Already Proven):**
- ResearchAgent.deep_dive() uses `emit_work_output` tool
- Forces structured outputs (prevents free-form text)
- Tool responses parsed manually via `parse_work_outputs_from_response()`
- Works reliably with Claude Sonnet 4.5

### Migration Challenges Identified

1. **Node.js subprocess overhead**: Python SDK wraps CLI, adds IPC layer
2. **Tool namespace changes**: `emit_work_output` → `mcp__yarnnn__emit_work_output`
3. **Context isolation**: SDK subagents have separate contexts (current shares)
4. **Parallel execution**: SDK runs subagents in parallel (current sequential)
5. **Skills as files**: Organizational context must be filesystem-based, not blocks

### What We Learned (Recent Commits)

**Commit d794f328-a8faba57 (Phase 1 Auth Removal):**
- Middleware exempt_prefixes doesn't bypass Depends() injection
- Must remove auth dependency from endpoint signature OR use service auth properly
- Solution: Temporarily exempt Phase 1 endpoints, plan for proper service auth in Phase 6

**Commit 346e0f73 (Phase 1 MCP Tools):**
- HTTP-only testing bypassed mcp package Python 3.10+ requirement
- MCP tools work independently without agent integration
- SubstrateClient BFF pattern proven

**Commit bd2c7e74 (Canon Docs Update):**
- Terminology settled: "work outputs" NOT "work artifacts"
- work_session states: pending → running → completed/failed
- Supervision status separate: pending_review → approved/rejected
- Substrate absorption intentionally deferred (outputs stay as outputs)

---

## 🎯 Implementation Phases (Revised)

### Phase 0: Prove Claude Agent SDK Works (Isolated)
**Goal:** Verify Claude Agent SDK works in our infrastructure, NO YARNNN integration
**Duration:** 2-3 days
**Status:** Not Started
**Dependencies:** None

**Scope:**
- Update Dockerfile (Node.js + Claude Code CLI)
- Install `claude-agent-sdk` in requirements.txt
- Create minimal test agent (hello world level)
- Verify subagents spawn correctly
- Verify Skills load from filesystem
- Test on Render (deployment validation)

**Success Criteria:**
- ✅ Docker build succeeds with Node.js + Claude Code CLI
- ✅ `claude-code --version` works in container
- ✅ Can import `claude_agent_sdk` in Python
- ✅ Simple agent runs end-to-end
- ✅ Subagent delegation works
- ✅ Skills load without errors
- ✅ Deployed to Render, no subprocess errors

**Exit Gate:** Do NOT proceed to Phase 1 until all success criteria pass.

---

### Phase 1: MCP Tools for Substrate (Bridge Layer)
**Goal:** Create clean interface between Claude Agent SDK and YARNNN substrate
**Duration:** 3-4 days
**Status:** Not Started
**Dependencies:** Phase 0 complete

**Scope:**
- Build 3 MCP tools:
  - `query_substrate` (semantic search)
  - `emit_work_output` (create deliverables)
  - `get_reference_assets` (fetch files)
- Test tools independently (NO agent integration yet)
- Validate substrate-API auth works (service-to-service + user JWT)
- Test against real ani-project basket

**Success Criteria:**
- ✅ MCP server starts without errors
- ✅ `query_substrate` returns blocks from substrate-API
- ✅ `emit_work_output` creates work_outputs rows
- ✅ `get_reference_assets` fetches files from Supabase Storage
- ✅ Auth works (service token + user JWT)
- ✅ Can call tools from test script (not agent yet)

**Exit Gate:** Do NOT proceed to Phase 2 until tools work independently.

---

### Phase 2: Base Skills (YARNNN Patterns)
**Goal:** Encode YARNNN-specific patterns as static Skills
**Duration:** 2-3 days
**Status:** Not Started
**Dependencies:** Phase 1 complete

**Scope:**
- Create 3 Skills (static, filesystem):
  - `yarnnn-research-methodology` (research workflow)
  - `yarnnn-quality-standards` (output quality rules)
  - `yarnnn-substrate-patterns` (how to use substrate)
- NO dynamic/project-specific Skills yet (deferred to Phase 5)
- Test Skills load correctly in agent context
- Verify Skills metadata shows up in agent prompts

**Success Criteria:**
- ✅ 3 Skill directories created in `.claude/skills/`
- ✅ Skills markdown validated (frontmatter + content)
- ✅ Skills load without errors
- ✅ Agent can invoke "Skill" tool
- ✅ Skill content appears in context when relevant

**Exit Gate:** Do NOT proceed to Phase 3 until Skills are loadable and testable.

---

### Phase 3: Simple Research Agent (End-to-End Integration)
**Goal:** ONE agent archetype, end-to-end flow, NO subagents yet
**Duration:** 4-5 days
**Status:** Not Started
**Dependencies:** Phase 2 complete

**Scope:**
- Research Agent ONLY (single agent, no delegation)
- Uses MCP tools from Phase 1
- Uses Skills from Phase 2
- Creates work outputs in substrate-API
- Test with ani-project basket
- User reviews work outputs (manual testing)

**Success Criteria:**
- ✅ User starts work session via work-platform API
- ✅ Agent queries substrate (sees existing blocks)
- ✅ Agent uses Skills (research methodology)
- ✅ Agent emits work outputs (findings, insights)
- ✅ Work outputs appear in substrate-API table
- ✅ User can review outputs (supervision flow)
- ✅ Approved outputs update substrate (governance)

**Exit Gate:** Do NOT proceed to Phase 4 until full user flow works.

---

### Phase 4: Subagents (Parallel Execution)
**Goal:** Add specialized subagents to Research Agent
**Duration:** 3-4 days
**Status:** Not Started
**Dependencies:** Phase 3 complete

**Scope:**
- Add 4 subagents to Research Agent:
  - market-intelligence
  - competitor-tracker
  - social-listener
  - analyst
- Configure tool restrictions per subagent
- Test parallel execution
- Verify subagent outputs synthesize correctly

**Success Criteria:**
- ✅ Research agent delegates to subagents
- ✅ Subagents execute in parallel
- ✅ Each subagent has correct tool access
- ✅ Parent agent synthesizes subagent findings
- ✅ Work outputs reference subagent provenance

**Exit Gate:** Do NOT proceed to Phase 5 until subagents work reliably.

---

### Phase 5: Dynamic Project Context (Advanced)
**Goal:** Project-specific procedural knowledge from substrate
**Duration:** 3-4 days
**Status:** Not Started
**Dependencies:** Phase 4 complete

**Scope:**
- Create `load_project_context` MCP tool
- Store project-specific patterns in substrate (as blocks)
- Agent loads base Skills + project context
- Test with multiple projects (ani-project + test project)

**Success Criteria:**
- ✅ `load_project_context` tool fetches project blocks
- ✅ Project-specific methodology appears in context
- ✅ Different projects have different patterns
- ✅ User can approve updates to project patterns

**Exit Gate:** Do NOT proceed to Phase 6 until dynamic context works.

---

### Phase 6: Production Hardening
**Goal:** Make it production-ready
**Duration:** 5-7 days
**Status:** Not Started
**Dependencies:** Phase 5 complete

**Scope:**
- Error handling (subprocess failures, API errors)
- Session management (link Agent SDK session ↔ work session)
- Logging/monitoring (CloudWatch, Sentry)
- Cost tracking (token usage per session)
- Rollback strategy (keep old implementation running)
- Documentation (API docs, troubleshooting guide)

**Success Criteria:**
- ✅ Deployed to Render production
- ✅ Error handling covers common failure modes
- ✅ Logs show session linkage correctly
- ✅ Cost tracking works
- ✅ Can rollback to old implementation if needed
- ✅ Documentation updated

**Exit Gate:** Production launch approved.

---

**Total Timeline:** 5-6 weeks (vs. original 3-4 weeks, but with lower risk)

---

## 📋 Phase 0: Prove Claude Agent SDK Works (Isolated)

**Goal:** Verify Claude Agent SDK works in our infrastructure, completely isolated from YARNNN

**Why This Phase Matters:**
- De-risks the entire migration by proving the SDK works BEFORE we integrate it
- Tests Node.js + Python subprocess communication in Render environment
- Validates Skills loading mechanism
- Confirms subagent delegation works

---

### 0.1 Update Dockerfile

**File:** `work-platform/api/Dockerfile`

**Current Dockerfile (simplified):**
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**New Dockerfile:**
```dockerfile
FROM python:3.10-slim

# Install Node.js 18.x (REQUIRED for Claude Code CLI)
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Verify Node.js and npm installed
RUN node --version && npm --version

# Install Claude Code CLI globally (REQUIRED for Python SDK)
RUN npm install -g @anthropic-ai/claude-code

# Verify Claude Code CLI installed
RUN claude-code --version

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Start application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Test locally:**
```bash
cd work-platform/api
docker build -t yarnnn-work-platform-test .

# Should see:
# - Node.js v18.x.x installation
# - npm v9.x.x installation
# - Claude Code CLI v2.x.x installation

docker run yarnnn-work-platform-test node --version
# Output: v18.x.x

docker run yarnnn-work-platform-test npm --version
# Output: 9.x.x

docker run yarnnn-work-platform-test claude-code --version
# Output: Claude Code 2.x.x
```

---

### 0.2 Update requirements.txt

**File:** `work-platform/api/requirements.txt`

**Add:**
```
# Claude Agent SDK
claude-agent-sdk==0.5.0  # Check PyPI for latest version
```

**Test:**
```bash
cd work-platform/api
docker build -t yarnnn-work-platform-test .
docker run yarnnn-work-platform-test python -c "import claude_agent_sdk; print('SDK imported successfully')"
# Output: SDK imported successfully
```

---

### 0.3 Create Minimal Test Agent

**File:** `work-platform/api/test_agent_sdk_hello.py`

```python
"""
Minimal Claude Agent SDK test - NO YARNNN integration.

This tests:
1. Python SDK can spawn Claude Code CLI subprocess
2. Agent can respond to simple queries
3. Subprocess communication works in container
"""

import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions


async def test_hello_world():
    """Most basic test - can the SDK work at all?"""
    print("Testing Claude Agent SDK hello world...")

    try:
        result = await query(
            prompt="Say 'Hello from Claude Agent SDK!' and nothing else.",
            options=ClaudeAgentOptions(max_turns=1)
        )

        response_text = ""
        async for message in result:
            if hasattr(message, 'text'):
                response_text += message.text
                print(f"Agent: {message.text}")

        if "Hello from Claude Agent SDK" in response_text:
            print("✅ Test passed: Agent responded correctly")
            return True
        else:
            print(f"❌ Test failed: Unexpected response: {response_text}")
            return False

    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_hello_world())
    exit(0 if success else 1)
```

**Test:**
```bash
cd work-platform/api
docker run yarnnn-work-platform-test python test_agent_sdk_hello.py

# Expected output:
# Testing Claude Agent SDK hello world...
# Agent: Hello from Claude Agent SDK!
# ✅ Test passed: Agent responded correctly
```

---

### 0.4 Test Skills Loading

**Create test Skill directory:**

**Directory:** `work-platform/api/.claude/skills/test-skill/`

**File:** `work-platform/api/.claude/skills/test-skill/SKILL.md`

```markdown
---
name: test-skill
description: A minimal test skill to verify Skills loading works
---

# Test Skill

This is a test skill. If you can read this, Skills loading works correctly.

When asked "Can you read the test skill?", respond with:
"Yes, I can read the test skill. Skills loading is working."
```

**File:** `work-platform/api/test_agent_sdk_skills.py`

```python
"""
Test Skills loading - NO YARNNN integration.

This tests:
1. Skills can be discovered from .claude/skills/ directory
2. Agent can invoke "Skill" tool
3. Skill content appears in agent context
"""

import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions


async def test_skills_loading():
    """Test that Skills load from filesystem."""
    print("Testing Claude Agent SDK Skills loading...")

    try:
        result = await query(
            prompt="Can you read the test skill? Use the Skill tool to load it.",
            options=ClaudeAgentOptions(
                max_turns=3,
                allowed_tools=["Skill"]
            )
        )

        response_text = ""
        async for message in result:
            if hasattr(message, 'text'):
                response_text += message.text
                print(f"Agent: {message.text}")

        if "Skills loading is working" in response_text:
            print("✅ Test passed: Skills loaded correctly")
            return True
        else:
            print(f"❌ Test failed: Skill not loaded. Response: {response_text}")
            return False

    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_skills_loading())
    exit(0 if success else 1)
```

**Test:**
```bash
cd work-platform/api
docker run -v $(pwd)/.claude:/app/.claude yarnnn-work-platform-test python test_agent_sdk_skills.py

# Expected output:
# Testing Claude Agent SDK Skills loading...
# Agent: Yes, I can read the test skill. Skills loading is working.
# ✅ Test passed: Skills loaded correctly
```

---

### 0.5 Test Subagent Delegation

**File:** `work-platform/api/test_agent_sdk_subagents.py`

```python
"""
Test subagent delegation - NO YARNNN integration.

This tests:
1. Parent agent can spawn subagents
2. Subagents execute with context isolation
3. Parent agent receives subagent responses
"""

import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions


async def test_subagent_delegation():
    """Test that subagents work."""
    print("Testing Claude Agent SDK subagent delegation...")

    options = ClaudeAgentOptions(
        max_turns=5,
        agents={
            "math-helper": {
                "description": "Helps with simple math calculations",
                "prompt": "You are a math helper. When asked to calculate something, provide the answer.",
            }
        }
    )

    try:
        result = await query(
            prompt="Delegate to the math-helper subagent: What is 7 + 5?",
            options=options
        )

        response_text = ""
        async for message in result:
            if hasattr(message, 'text'):
                response_text += message.text
                print(f"Agent: {message.text}")

        if "12" in response_text:
            print("✅ Test passed: Subagent delegation worked")
            return True
        else:
            print(f"❌ Test failed: Subagent did not respond correctly. Response: {response_text}")
            return False

    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_subagent_delegation())
    exit(0 if success else 1)
```

**Test:**
```bash
cd work-platform/api
docker run yarnnn-work-platform-test python test_agent_sdk_subagents.py

# Expected output:
# Testing Claude Agent SDK subagent delegation...
# Agent: The answer is 12.
# ✅ Test passed: Subagent delegation worked
```

---

### 0.6 Deploy to Render (Smoke Test)

**Goal:** Verify it works in Render environment, not just local Docker

**Steps:**

1. **Create test branch:**
```bash
cd /Users/macbook/yarnnn-app-fullstack
git checkout -b test/claude-agent-sdk-phase0
git add work-platform/api/Dockerfile
git add work-platform/api/requirements.txt
git add work-platform/api/test_agent_sdk_*.py
git add work-platform/api/.claude/skills/test-skill/
git commit -m "Phase 0: Add Claude Agent SDK infrastructure (test branch)"
git push origin test/claude-agent-sdk-phase0
```

2. **Deploy to Render:**
- Go to Render dashboard
- work-platform service → Settings → Deploy branch
- Select `test/claude-agent-sdk-phase0`
- Deploy

3. **Test via Render shell:**
```bash
# In Render shell
python test_agent_sdk_hello.py
# Should output: ✅ Test passed
```

4. **Verify logs:**
- Check Render logs for subprocess spawn errors
- Verify Node.js + Claude Code CLI installed correctly
- Check for any IPC communication issues

---

### 0.7 Phase 0 Completion Checklist

**Infrastructure:**
- [ ] Dockerfile updated with Node.js + Claude Code CLI
- [ ] `requirements.txt` includes `claude-agent-sdk`
- [ ] Docker build succeeds locally
- [ ] `node --version` works in container
- [ ] `npm --version` works in container
- [ ] `claude-code --version` works in container
- [ ] `import claude_agent_sdk` works in Python

**Basic Agent:**
- [ ] `test_agent_sdk_hello.py` passes locally
- [ ] `test_agent_sdk_hello.py` passes in Render

**Skills:**
- [ ] Test Skill created in `.claude/skills/test-skill/`
- [ ] `test_agent_sdk_skills.py` passes locally
- [ ] Skills load without errors

**Subagents:**
- [ ] `test_agent_sdk_subagents.py` passes locally
- [ ] Subagent delegation works correctly

**Deployment:**
- [ ] Deployed to Render test branch
- [ ] No subprocess errors in Render logs
- [ ] No Node.js installation errors
- [ ] No Claude Code CLI errors

**Exit Gate:**
- [ ] ALL tests pass in Render environment
- [ ] No blocking errors in logs
- [ ] Confident subprocess communication works

**If ALL checkboxes are checked: PROCEED TO PHASE 1**

**If ANY checkboxes fail: DO NOT PROCEED - debug Phase 0 issues first**

---

## 📋 Phase 1: Infrastructure Setup

### 1.1 Add Node.js to Render Service

**Current State:**
- work-platform runs Python 3.10
- Deployed on Render as web service
- Uses FastAPI + Uvicorn

**Required Changes:**

#### Update Dockerfile

**File:** `work-platform/api/Dockerfile`

```dockerfile
FROM python:3.10-slim

# Install Node.js 18.x
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Verify installations
RUN node --version
RUN npm --version

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Verify Claude Code installation
RUN claude-code --version

# Install Python dependencies
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Testing:**
```bash
# Build locally
docker build -t work-platform:test .

# Verify Node.js
docker run work-platform:test node --version
# Expected: v18.x.x

# Verify Claude Code CLI
docker run work-platform:test claude-code --version
# Expected: 2.x.x

# Run app
docker run -p 8000:8000 work-platform:test
```

---

### 1.2 Install claude-agent-sdk Python Package

**File:** `work-platform/api/requirements.txt`

Add:
```txt
# Claude Agent SDK
claude-agent-sdk>=1.0.0
```

**Verify Installation:**
```python
# Test import
from claude_agent_sdk import query, ClaudeAgentOptions, create_sdk_mcp_server, tool

print("Claude Agent SDK installed successfully")
```

---

### 1.3 Environment Variables

**File:** `work-platform/api/.env` (local) / Render Dashboard (production)

Add:
```bash
# Claude Agent SDK
ANTHROPIC_API_KEY=sk-ant-...

# Claude Code CLI path (usually auto-detected)
CLAUDE_CODE_PATH=/usr/local/bin/claude-code

# Session storage (optional, defaults to in-memory)
CLAUDE_SESSIONS_DIR=/app/data/claude-sessions
```

**Render Configuration:**
1. Go to Render Dashboard → work-platform service
2. Environment → Add Environment Variable
3. Add `ANTHROPIC_API_KEY` with value from 1Password
4. Redeploy

---

### 1.4 Health Check Integration

**File:** `work-platform/api/src/main.py`

Add health check for Claude Agent SDK:

```python
from fastapi import FastAPI
from claude_agent_sdk import query

app = FastAPI()

@app.get("/health/claude-sdk")
async def health_check_claude_sdk():
    """Verify Claude Agent SDK is functional."""
    try:
        # Simple test query
        result = await query(
            prompt="Respond with 'ok' if you receive this",
            options=ClaudeAgentOptions(max_turns=1)
        )

        # Check response
        async for message in result:
            if isinstance(message, AssistantMessage):
                return {
                    "status": "healthy",
                    "sdk_version": "1.0.0",
                    "message": "Claude Agent SDK operational"
                }

        return {"status": "degraded", "message": "No response from SDK"}

    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
```

**Test:**
```bash
curl http://localhost:8000/health/claude-sdk
```

Expected response:
```json
{
  "status": "healthy",
  "sdk_version": "1.0.0",
  "message": "Claude Agent SDK operational"
}
```

---

### 1.5 Phase 1 Completion Checklist

- [ ] Node.js 18.x installed in Docker
- [ ] Claude Code CLI installed globally
- [ ] `claude-agent-sdk` Python package installed
- [ ] `ANTHROPIC_API_KEY` environment variable set
- [ ] Health check endpoint returns healthy
- [ ] Local Docker build succeeds
- [ ] Render deployment succeeds
- [ ] Basic query test passes

**Acceptance Criteria:**
```python
# This should work
from claude_agent_sdk import query

result = await query(prompt="Hello, Claude SDK!")
async for message in result:
    print(message)
```

---

## 📋 Phase 2: YARNNN MCP Tools

### 2.1 Create MCP Server Module

**File:** `work-platform/api/src/mcp/yarnnn_server.py`

```python
"""
YARNNN MCP Server

Provides substrate and work management tools for Claude agents.
"""

from claude_agent_sdk import create_sdk_mcp_server, tool
from typing import Any, Dict, List
from uuid import UUID

from src.clients.substrate_client import SubstrateClient
from src.services.work_output_service import WorkOutputService


# Initialize clients (singleton pattern)
substrate_client = SubstrateClient()
work_output_service = WorkOutputService()


@tool(
    "query_substrate",
    "Query YARNNN substrate for relevant context blocks using semantic search",
    {
        "query": str,
        "basket_id": str,
        "limit": int,
        "min_similarity": float
    }
)
async def query_substrate(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Semantic search across substrate blocks.

    Returns:
        {
            "blocks": [
                {
                    "id": "block-uuid",
                    "content": "...",
                    "semantic_type": "finding",
                    "similarity": 0.95,
                    "metadata": {...}
                }
            ],
            "total": 10
        }
    """
    try:
        results = await substrate_client.semantic_search(
            query=args["query"],
            basket_id=args["basket_id"],
            limit=args.get("limit", 10),
            min_similarity=args.get("min_similarity", 0.7)
        )

        return {
            "content": [{
                "type": "text",
                "text": f"Found {len(results)} relevant blocks:\n\n" +
                       "\n\n".join([
                           f"Block {i+1} (similarity: {r['similarity']:.2f}):\n{r['block']['content']}"
                           for i, r in enumerate(results)
                       ])
            }]
        }

    except Exception as e:
        return {
            "content": [{
                "type": "text",
                "text": f"Error querying substrate: {str(e)}"
            }],
            "isError": True
        }


@tool(
    "emit_work_output",
    "Submit a structured work output for user supervision",
    {
        "output_type": str,  # "finding", "recommendation", "insight", etc.
        "title": str,
        "body": dict,  # {"summary": str, "details": str, "evidence": [str], ...}
        "confidence": float,  # 0.0 to 1.0
        "source_block_ids": list,  # List of block UUIDs used as sources
        "work_session_id": str
    }
)
async def emit_work_output(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a work output that will be reviewed by the user.

    Returns confirmation with output ID.
    """
    try:
        output_id = await work_output_service.create(
            work_session_id=UUID(args["work_session_id"]),
            output_type=args["output_type"],
            title=args["title"],
            body=args["body"],
            confidence=args["confidence"],
            source_context_ids=[UUID(id) for id in args.get("source_block_ids", [])]
        )

        return {
            "content": [{
                "type": "text",
                "text": f"Work output created successfully.\n\n" +
                       f"Output ID: {output_id}\n" +
                       f"Type: {args['output_type']}\n" +
                       f"Title: {args['title']}\n" +
                       f"Confidence: {args['confidence']:.0%}\n\n" +
                       f"This output will be reviewed by the user before being added to the substrate."
            }]
        }

    except Exception as e:
        return {
            "content": [{
                "type": "text",
                "text": f"Error creating work output: {str(e)}"
            }],
            "isError": True
        }


@tool(
    "get_reference_assets",
    "Retrieve reference assets for the work session",
    {
        "work_session_id": str,
        "asset_types": list,  # Optional: filter by type
        "permanence": str  # Optional: "temporary" or "permanent"
    }
)
async def get_reference_assets(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get reference assets (documents, images, files) for context.

    Returns:
        List of assets with signed URLs for access.
    """
    try:
        assets = await substrate_client.get_reference_assets(
            work_session_id=UUID(args["work_session_id"]),
            asset_types=args.get("asset_types"),
            permanence=args.get("permanence")
        )

        if not assets:
            return {
                "content": [{
                    "type": "text",
                    "text": "No reference assets found for this work session."
                }]
            }

        asset_list = "\n".join([
            f"- {a['filename']} ({a['asset_type']}) - {a['size_bytes']} bytes"
            for a in assets
        ])

        return {
            "content": [{
                "type": "text",
                "text": f"Found {len(assets)} reference assets:\n\n{asset_list}\n\n" +
                       f"Note: Use signed URLs from asset metadata to access content."
            }]
        }

    except Exception as e:
        return {
            "content": [{
                "type": "text",
                "text": f"Error retrieving reference assets: {str(e)}"
            }],
            "isError": True
        }


# Create MCP server
yarnnn_mcp_server = create_sdk_mcp_server(
    name="yarnnn",
    version="1.0.0",
    tools=[
        query_substrate,
        emit_work_output,
        get_reference_assets
    ]
)
```

---

### 2.2 Tool Testing Script

**File:** `work-platform/api/test_mcp_tools.py`

```python
#!/usr/bin/env python3
"""
Test YARNNN MCP tools locally.
"""

import asyncio
from src.mcp.yarnnn_server import query_substrate, emit_work_output, get_reference_assets


async def test_query_substrate():
    """Test substrate query tool."""
    print("Testing query_substrate...")

    result = await query_substrate({
        "query": "AI companion pricing",
        "basket_id": "5004b9e1-67f5-4955-b028-389d45b1f5a4",
        "limit": 5,
        "min_similarity": 0.7
    })

    print("Result:")
    print(result["content"][0]["text"])
    print()


async def test_emit_work_output():
    """Test work output emission tool."""
    print("Testing emit_work_output...")

    result = await emit_work_output({
        "output_type": "finding",
        "title": "Test Finding",
        "body": {
            "summary": "This is a test finding",
            "details": "More detailed information here",
            "evidence": ["Source 1", "Source 2"]
        },
        "confidence": 0.85,
        "source_block_ids": [],
        "work_session_id": "test-session-id"
    })

    print("Result:")
    print(result["content"][0]["text"])
    print()


async def main():
    """Run all tests."""
    await test_query_substrate()
    # await test_emit_work_output()  # Requires valid work session
    print("✅ MCP tools tests complete")


if __name__ == "__main__":
    asyncio.run(main())
```

**Run tests:**
```bash
cd work-platform/api
python test_mcp_tools.py
```

---

### 2.3 Phase 2 Completion Checklist

- [ ] `yarnnn_server.py` created with all MCP tools
- [ ] `query_substrate` tool implemented and tested
- [ ] `emit_work_output` tool implemented and tested
- [ ] `get_reference_assets` tool implemented and tested
- [ ] MCP server exported as `yarnnn_mcp_server`
- [ ] Test script passes
- [ ] Tools integrate with existing substrate_client
- [ ] Tools integrate with existing work_output_service

**Acceptance Criteria:**
```python
from src.mcp.yarnnn_server import yarnnn_mcp_server

# Server should be ready to use
assert yarnnn_mcp_server.name == "yarnnn"
assert len(yarnnn_mcp_server.tools) == 3
```

---

## 📋 Phase 3: Skills Definition

### 3.1 Create Skills Directory Structure

**Directory:** `work-platform/api/.claude/skills/`

```
.claude/
├── skills/
│   ├── yarnnn-research/
│   │   ├── SKILL.md
│   │   └── templates/
│   │       ├── finding.json
│   │       ├── insight.json
│   │       └── recommendation.json
│   ├── yarnnn-quality/
│   │   └── SKILL.md
│   └── yarnnn-substrate/
│       └── SKILL.md
```

---

### 3.2 Research Methodology Skill

**File:** `.claude/skills/yarnnn-research/SKILL.md`

```markdown
---
name: yarnnn-research-methodology
description: YARNNN substrate-backed research methodology and quality standards
---

# YARNNN Research Methodology

## Overview
You are conducting research for a YARNNN user. YARNNN integrates substrate context (existing knowledge) with work supervision (user review). Your outputs will be reviewed by the user before being added to the substrate.

## Research Workflow

### 1. Query Existing Knowledge First
Always start by querying the substrate to understand what the user already knows.

```
Use: query_substrate tool
Example: query_substrate(query="AI companion pricing", basket_id="...", limit=10)
```

**Why:** Avoid redundant research. Build on existing knowledge, don't duplicate it.

### 2. Identify Knowledge Gaps
Analyze substrate results to find gaps:
- What's missing?
- What's outdated?
- What needs verification?
- What needs deeper analysis?

### 3. Conduct Targeted Research
Focus research on filling gaps, not rehashing known information.

**Sources in order of reliability:**
1. Primary sources (official websites, documentation, press releases)
2. Verified secondary sources (TechCrunch, The Verge, Hacker News)
3. Social signals (Reddit, Twitter) - use for trends, not facts

### 4. Structure Findings as Work Outputs
Use `emit_work_output` tool for EVERY significant finding.

**Output Types:**
- `finding` - New factual information (competitor pricing, product feature)
- `insight` - Pattern or analysis (market trend, strategic implication)
- `recommendation` - Suggested action (pricing strategy, positioning)

### 5. Track Provenance
Always link to source blocks via `source_block_ids` parameter.

**Example:**
```
emit_work_output(
    output_type="finding",
    title="Mem.ai pricing is $8/month for individuals",
    body={
        "summary": "Mem.ai charges $8/month for individual users with unlimited AI features.",
        "details": "Verified from official pricing page as of 2025-11-18...",
        "evidence": ["https://mem.ai/pricing", "Substrate block: block-uuid"]
    },
    confidence=0.95,
    source_block_ids=["block-uuid-from-substrate"],
    work_session_id="session-id"
)
```

## Quality Standards

### Confidence Scoring
- **0.9-1.0:** Verified from primary sources, multiple confirmations
- **0.7-0.9:** Likely accurate, secondary sources or single primary source
- **0.5-0.7:** Uncertain, requires user verification
- **<0.5:** Speculative, flag for user review

### Evidence Requirements
- **Findings:** Must cite sources (URLs, substrate blocks)
- **Insights:** Must reference supporting findings
- **Recommendations:** Must explain reasoning and link to insights

### Output Quality
Each work output must have:
- **Concise title** (max 200 chars)
- **Clear summary** (1-3 sentences in body.summary)
- **Supporting details** (optional, in body.details)
- **Evidence/sources** (in body.evidence array)
- **Accurate confidence** (0.0-1.0)

## Anti-Patterns

### ❌ Don't Do This:
1. **Duplicate substrate content** - always query first, extend what exists
2. **Vague findings** - "X is popular" → "X has 50k users as of Nov 2025"
3. **Unsourced claims** - every finding needs evidence
4. **Low confidence without caveats** - if uncertain, say so and explain why
5. **Narrative summaries** - emit structured outputs, not prose

### ✅ Do This:
1. **Query substrate → identify gaps → fill gaps**
2. **Specific findings** - dates, numbers, named entities
3. **Cite sources** - URLs, block IDs, evidence
4. **Calibrated confidence** - match confidence to evidence strength
5. **Structured outputs** - use emit_work_output for everything

## Templates

### Finding Template
```json
{
    "output_type": "finding",
    "title": "[Specific factual claim in <200 chars]",
    "body": {
        "summary": "[1-3 sentence overview]",
        "details": "[Optional: deeper explanation]",
        "evidence": ["[Source 1]", "[Source 2]"]
    },
    "confidence": 0.95,
    "source_block_ids": ["[block-uuid]"]
}
```

### Insight Template
```json
{
    "output_type": "insight",
    "title": "[Pattern or analysis identified]",
    "body": {
        "summary": "[What pattern/trend was found]",
        "details": "[Why this matters, implications]",
        "evidence": ["[Finding 1]", "[Finding 2]"],
        "recommendations": ["[Optional: suggested actions]"]
    },
    "confidence": 0.85,
    "source_block_ids": ["[supporting-finding-ids]"]
}
```

### Recommendation Template
```json
{
    "output_type": "recommendation",
    "title": "[Suggested action]",
    "body": {
        "summary": "[What to do]",
        "details": "[Why, how, when]",
        "recommendations": ["[Step 1]", "[Step 2]"],
        "evidence": ["[Supporting insight/finding]"]
    },
    "confidence": 0.80,
    "source_block_ids": ["[insight-ids]"]
}
```

## Completion Checklist

Before marking work complete, verify:
- [ ] Queried substrate for existing knowledge
- [ ] Identified knowledge gaps
- [ ] Filled gaps with targeted research
- [ ] Emitted all findings as structured outputs
- [ ] Cited sources for all claims
- [ ] Assigned appropriate confidence scores
- [ ] Linked to source blocks where applicable
- [ ] No duplicate information (vs substrate)

**Your work will be reviewed by the user. Quality over quantity.**
```

---

### 3.3 Quality Standards Skill

**File:** `.claude/skills/yarnnn-quality/SKILL.md`

```markdown
---
name: yarnnn-quality-standards
description: Output quality standards and validation rules for YARNNN agents
---

# YARNNN Quality Standards

## Purpose
This Skill defines quality standards that all YARNNN agents must follow when producing work outputs.

## Core Principles

### 1. User Supervision is Sacred
Every output you create will be reviewed by the user before affecting the substrate. Respect their time:
- **Concise summaries** - get to the point in 1-3 sentences
- **Clear titles** - user should know what this is without reading details
- **Appropriate confidence** - don't make them second-guess your scoring

### 2. Provenance is Mandatory
Every output must be traceable:
- **Source blocks** - which substrate blocks informed this?
- **Evidence** - what sources support this claim?
- **Reasoning** - why did you draw this conclusion?

### 3. Structure Over Narrative
Users can't approve prose. Emit structured outputs:
- **Findings** - discrete facts
- **Insights** - patterns and analysis
- **Recommendations** - actionable suggestions

### 4. Confidence Calibration
Confidence scores must match evidence quality:
- **High confidence (0.9+):** Multiple primary sources, verified facts
- **Medium confidence (0.7-0.9):** Single primary source or multiple secondary
- **Low confidence (0.5-0.7):** Secondary sources, needs verification
- **Speculative (<0.5):** Hypothesis, explicitly flag uncertainty

## Validation Rules

### Title
- **Max length:** 200 characters
- **Style:** Descriptive, specific
- **Good:** "Mem.ai pricing is $8/month for individuals (Nov 2025)"
- **Bad:** "Pricing information"

### Summary (body.summary)
- **Length:** 1-3 sentences
- **Content:** Answer "what" and "so what"
- **Good:** "Mem.ai charges $8/month for unlimited AI features, undercutting Notion AI's $10/month. This creates pricing pressure in the AI memory market."
- **Bad:** "Pricing information was found."

### Evidence (body.evidence)
- **Required for:** Findings, insights
- **Format:** Array of sources
- **Good:** ["https://mem.ai/pricing", "TechCrunch article 2025-11-15", "Substrate block: adf8536b"]
- **Bad:** ["the internet"]

### Confidence
- **Range:** 0.0 to 1.0
- **Precision:** 0.05 increments (0.85, 0.90, 0.95)
- **Calibration:** If you're unsure between two scores, go lower

## Output Type Guidelines

### Finding
**When to use:** Discovered a fact
**Requirements:**
- Specific, verifiable claim
- At least one source cited
- Confidence ≥ 0.7 (otherwise flag as needing verification)

**Example:**
- Title: "Character.ai has 20M MAUs as of Q3 2025"
- Summary: "Character.ai reported 20 million monthly active users in Q3 2025, making it the largest AI companion platform by user count."
- Evidence: ["Character.ai investor deck", "TechCrunch Nov 2025"]

### Insight
**When to use:** Identified a pattern or analysis
**Requirements:**
- Based on multiple findings
- Explains "so what"
- Links to supporting findings via source_block_ids

**Example:**
- Title: "AI companion market shows pricing convergence around $8-15/month"
- Summary: "Five major platforms (Mem, Notion AI, Character.ai Plus, Replika Pro, Snapchat+) cluster pricing between $8-15/month, suggesting market consensus on value proposition."
- Evidence: [Finding IDs from pricing research]

### Recommendation
**When to use:** Suggesting an action
**Requirements:**
- Based on insights
- Explains rationale
- Actionable (user can act on it)

**Example:**
- Title: "Price Ani Plus tier at $12/month to match market midpoint"
- Summary: "Market analysis shows pricing sweet spot at $10-15/month. Recommend $12/month for Plus tier to position as premium but accessible."
- Recommendations: ["Set Plus tier at $12/month", "Offer $8/month introductory rate", "Include 100 messages/day vs. free tier's 30"]

## Anti-Patterns

### ❌ Avoid These Mistakes

**1. Vague Findings**
- Bad: "Competitors have different pricing"
- Good: "Mem.ai: $8/mo, Notion AI: $10/mo, Character.ai Plus: $10/mo"

**2. Unsourced Claims**
- Bad: "Users prefer emotional AI companions"
- Good: "Survey of 1,000 users (Andreessen Horowitz, Oct 2025) shows 73% prefer emotional connection over utility"

**3. Overfitted Confidence**
- Bad: "confidence": 0.99 for secondary source
- Good: "confidence": 0.80 for single reliable secondary source

**4. Narrative Prose**
- Bad: Free text paragraph about competitors
- Good: Structured findings for each competitor

**5. Duplicate Substrate Content**
- Bad: Emitting findings that already exist in substrate
- Good: Query substrate first, extend with new information

## Quality Checklist

Before emitting each output, verify:
- [ ] Title is descriptive and <200 chars
- [ ] Summary is 1-3 sentences, answers "what" and "so what"
- [ ] Evidence array populated with sources
- [ ] Confidence matches evidence strength
- [ ] Source blocks linked where applicable
- [ ] Output type matches content (finding/insight/recommendation)
- [ ] No duplication of existing substrate content

**High-quality outputs get approved. Low-quality outputs waste user time.**
```

---

### 3.4 Substrate Usage Skill

**File:** `.claude/skills/yarnnn-substrate/SKILL.md`

```markdown
---
name: yarnnn-substrate-patterns
description: How to effectively use YARNNN substrate for context and provenance
---

# YARNNN Substrate Usage Patterns

## Overview
The substrate is YARNNN's knowledge base. It contains blocks (granular facts), documents (compositions), and insights (reflections). Use it effectively to produce better work.

## When to Query Substrate

### Always Query First
Before starting any work:
```
query_substrate(
    query="[your research topic]",
    basket_id="[user's basket]",
    limit=10,
    min_similarity=0.7
)
```

**Why:**
- Understand what user already knows
- Avoid duplicate work
- Find knowledge gaps
- Link new work to existing context

### Query During Work
As you discover new information, re-query to:
- Find related blocks
- Verify consistency
- Build on existing insights

### Don't Query
- For general knowledge (use your training)
- For external facts (use web search)
- Repeatedly for same query (cache results)

## Understanding Query Results

### Block Structure
```json
{
    "id": "block-uuid",
    "content": "The product will offer a free tier with 30 messages/day...",
    "semantic_type": "finding",
    "similarity": 0.92,
    "metadata": {
        "created_at": "2025-11-12",
        "source": "user_input",
        "entities": ["pricing", "free_tier"]
    }
}
```

### Semantic Types
- **finding:** Factual information
- **insight:** Analysis or pattern
- **action:** Suggested next step
- **summary:** Overview of topic
- **classification:** Categorization
- **metric:** Quantitative measurement

### Similarity Scores
- **0.9-1.0:** Highly relevant, exact match
- **0.8-0.9:** Very relevant, strong semantic match
- **0.7-0.8:** Relevant, worth considering
- **<0.7:** Weak match, may not be useful

## Using Block IDs for Provenance

### Link Outputs to Source Blocks
When creating work outputs, always reference substrate blocks used:

```python
emit_work_output(
    output_type="insight",
    title="AI companion users prioritize emotional connection over utility",
    body={
        "summary": "Based on substrate blocks about user preferences...",
        "details": "...",
        "evidence": ["Block cb2ed7de: user patterns", "Block a50e315f: market opportunities"]
    },
    confidence=0.88,
    source_block_ids=[
        "cb2ed7de-a20a-47b1-8ee2-0bd37c2d8e53",  # User patterns block
        "a50e315f-2209-4e22-a8fe-762f3cea358e"   # Market opportunities block
    ],
    work_session_id="session-id"
)
```

**Why This Matters:**
- User can see your reasoning chain
- Approved work updates are traceable
- Quality improves with context awareness

### Provenance Chain Example
```
Substrate Block A (existing)
    → Your Query
    → Your Analysis
    → Your Work Output (new)
    → (If approved) New Substrate Block B
```

Each output should reference its source blocks, creating an audit trail.

## Handling Empty Results

### No Blocks Found
If query returns empty:
```
✅ Good: "No existing substrate content on [topic]. Conducting fresh research..."
❌ Bad: Proceed without noting the gap
```

### Low Similarity Results
If all results <0.7 similarity:
```
✅ Good: "Weak substrate matches. User may not have prior knowledge on [topic]."
❌ Bad: Force-fit irrelevant blocks
```

## Knowledge Gap Identification

### Compare Substrate to Task
1. **What substrate has:** [List key topics from query results]
2. **What task requires:** [List requirements from user's task intent]
3. **Gaps:** [What's missing?]

**Example:**
```
Task: "Research AI companion pricing strategies"

Substrate has:
- User preference for emotional connection (block cb2ed7de)
- Product pricing: $15/month for Plus tier (block 2e0fb108)
- Market opportunities in emotional AI (block a50e315f)

Gaps:
- Competitor pricing (need to research)
- Market pricing trends (need to analyze)
- Price sensitivity data (need to find)

Action: Focus research on gaps, reference existing blocks for context.
```

## Best Practices

### DO:
1. **Query early and often** - understand substrate before starting work
2. **Reference block IDs** - link outputs to source blocks
3. **Extend, don't duplicate** - build on existing knowledge
4. **Note gaps explicitly** - tell user what substrate is missing
5. **Use similarity scores** - prioritize high-relevance blocks

### DON'T:
1. **Skip querying** - never assume substrate is empty
2. **Ignore low similarity** - acknowledge when substrate doesn't match task
3. **Duplicate findings** - check substrate before emitting known facts
4. **Fabricate block IDs** - only reference actual query results
5. **Over-query** - cache results, don't re-query same topic repeatedly

## Substrate Evolution

### Your Role in Growing Substrate
When user approves your work outputs:
- Findings become substrate blocks
- Insights enrich context
- Recommendations guide future work

**Think Long-Term:**
- Will future agents benefit from this output?
- Is this structured for reuse?
- Does this extend substrate coherently?

**Quality Bar:**
User is building institutional memory. Your outputs become the substrate that powers future research. Make them worthy of preservation.

---

**Use substrate wisely. Query first, extend thoughtfully, link provenance.**
```

---

### 3.5 Phase 3 Completion Checklist

- [ ] `.claude/skills/` directory structure created
- [ ] `yarnnn-research-methodology` Skill defined
- [ ] `yarnnn-quality-standards` Skill defined
- [ ] `yarnnn-substrate-patterns` Skill defined
- [ ] All Skills have proper YAML frontmatter
- [ ] Skills follow progressive disclosure pattern (metadata → instructions → resources)
- [ ] Skills reference correct tool names
- [ ] Templates provided for common output types

**Acceptance Criteria:**
Skills should be loadable by Claude Agent SDK and provide procedural knowledge for agents.

---

## 📋 Phase 4: Research Agent Scaffold

### 4.1 Create Agent Configuration

**File:** `work-platform/api/src/agents/research_agent_config.py`

```python
"""
Research Agent Configuration

Defines the Research Agent with specialized subagents for YARNNN.
"""

from claude_agent_sdk import ClaudeAgentOptions
from src.mcp.yarnnn_server import yarnnn_mcp_server


RESEARCH_AGENT_SYSTEM_PROMPT = """You are a YARNNN Research Agent specializing in substrate-backed intelligence gathering.

**Your Mission:**
Conduct thorough research while leveraging the user's existing knowledge substrate. Every output you create will be reviewed by the user before being added to their knowledge base.

**Core Principles:**
1. Query substrate FIRST - understand what user already knows
2. Identify knowledge gaps - focus research on what's missing
3. Emit structured outputs - use emit_work_output for ALL findings
4. Track provenance - link outputs to source blocks
5. Calibrate confidence - match scores to evidence strength

**Available Tools:**
- query_substrate: Search user's knowledge base
- emit_work_output: Create structured outputs for review
- get_reference_assets: Access user-provided files
- Skill: Load relevant Skills (research methodology, quality standards)

**You have access to specialized subagents:**
- market-intelligence: Monitor market trends and signals
- competitor-tracker: Deep analysis of competitors
- social-listener: Track social media and community signals
- analyst: Synthesize findings into insights

**Workflow:**
1. Use query_substrate to understand existing knowledge
2. Delegate specialized tasks to appropriate subagents
3. Synthesize findings from subagents
4. Emit structured work outputs for user review

**Quality Standards:**
- Every finding must cite sources
- Every insight must reference supporting findings
- Every recommendation must explain reasoning
- Confidence scores must match evidence quality

Your outputs will be reviewed. Quality over quantity.
"""


RESEARCH_AGENT_OPTIONS = ClaudeAgentOptions(
    system_prompt=RESEARCH_AGENT_SYSTEM_PROMPT,

    # MCP Servers
    mcp_servers={"yarnnn": yarnnn_mcp_server},

    # Allowed Tools
    allowed_tools=[
        # YARNNN MCP tools
        "mcp__yarnnn__query_substrate",
        "mcp__yarnnn__emit_work_output",
        "mcp__yarnnn__get_reference_assets",

        # Skills
        "Skill",  # Enable Skill loading

        # TODO: Add web search when MCP server ready
        # "mcp__web_search",
    ],

    # Subagents
    agents={
        "market-intelligence": {
            "description": "Monitor market trends, track industry developments, identify emerging patterns in the AI/tech space",
            "prompt": """You are a Market Intelligence specialist.

**Your Focus:**
- Market trends and shifts
- Industry developments
- Emerging patterns and signals
- Competitive landscape changes

**Approach:**
1. Query substrate for existing market knowledge
2. Identify gaps in market understanding
3. Research current trends and developments
4. Emit findings as structured outputs

**Output Types:**
- finding: New market data (user numbers, funding, launches)
- insight: Market patterns and trends
- recommendation: Strategic implications

Use query_substrate and emit_work_output tools.""",
            "tools": [
                "mcp__yarnnn__query_substrate",
                "mcp__yarnnn__emit_work_output",
                "Skill"
            ],
            "model": "sonnet"  # Cost-efficient for monitoring
        },

        "competitor-tracker": {
            "description": "Deep analysis of specific competitors - products, pricing, strategy, positioning",
            "prompt": """You are a Competitive Intelligence analyst.

**Your Focus:**
- Competitor products and features
- Pricing strategies
- Market positioning
- Strategic moves (funding, partnerships, launches)

**Approach:**
1. Query substrate for existing competitor knowledge
2. Identify gaps (missing competitors, outdated info)
3. Conduct deep research on specific competitors
4. Compare and contrast positioning

**Output Types:**
- finding: Competitor facts (pricing, features, metrics)
- insight: Competitive analysis and positioning
- recommendation: Strategic responses

Use query_substrate and emit_work_output tools. Prioritize primary sources (competitor websites, press releases).""",
            "tools": [
                "mcp__yarnnn__query_substrate",
                "mcp__yarnnn__emit_work_output",
                "Skill"
            ],
            "model": "opus"  # More powerful for deep analysis
        },

        "social-listener": {
            "description": "Track social media signals, community sentiment, viral content, and emerging narratives",
            "prompt": """You are a Social Listening specialist.

**Your Focus:**
- Social media mentions and sentiment
- Community discussions (Reddit, HN, forums)
- Viral content and memes
- Emerging narratives

**Approach:**
1. Query substrate for existing social signals
2. Identify gaps in social understanding
3. Track recent discussions and sentiment
4. Flag emerging trends

**Output Types:**
- finding: Social signals (mentions, sentiment shifts)
- insight: Community patterns and narratives
- recommendation: Positioning opportunities

Use query_substrate and emit_work_output tools. Focus on identifying signals, not just noise.""",
            "tools": [
                "mcp__yarnnn__query_substrate",
                "mcp__yarnnn__emit_work_output",
                "Skill"
            ],
            "model": "sonnet"
        },

        "analyst": {
            "description": "Synthesize research findings into actionable insights and strategic recommendations",
            "prompt": """You are a Research Analyst and Synthesizer.

**Your Focus:**
- Synthesize findings from other subagents
- Identify patterns across research
- Generate actionable insights
- Formulate strategic recommendations

**Approach:**
1. Query substrate for all recent findings
2. Look for patterns and connections
3. Identify implications and opportunities
4. Create synthesis outputs

**Output Types:**
- insight: Cross-finding patterns and implications
- recommendation: Strategic actions based on research

Use query_substrate to access findings from other subagents. Reference their work via source_block_ids.""",
            "tools": [
                "mcp__yarnnn__query_substrate",
                "mcp__yarnnn__emit_work_output",
                "Skill"
            ],
            "model": "sonnet"
        }
    },

    # Execution limits
    max_turns=50,  # Prevent infinite loops

    # Session management
    # (Uses Claude Agent SDK's built-in session handling)
)
```

---

### 4.2 Create Agent Executor

**File:** `work-platform/api/src/agents/research_agent_executor.py`

```python
"""
Research Agent Executor

Executes the Research Agent with work session integration.
"""

from claude_agent_sdk import query
from uuid import UUID
from typing import Dict, Any, AsyncIterator
import logging

from src.agents.research_agent_config import RESEARCH_AGENT_OPTIONS
from src.services.work_session_service import WorkSessionService
from src.models.work_session import WorkSessionStatus


logger = logging.getLogger(__name__)
work_session_service = WorkSessionService()


async def execute_research_agent(
    work_session_id: UUID,
    task_intent: str,
    basket_id: UUID,
    workspace_id: UUID,
    user_id: UUID
) -> Dict[str, Any]:
    """
    Execute Research Agent for a work session.

    Args:
        work_session_id: Work session tracking this execution
        task_intent: User's research task
        basket_id: Substrate basket for context
        workspace_id: User's workspace
        user_id: Requesting user

    Returns:
        {
            "status": "completed" | "failed",
            "outputs_created": int,
            "session_metadata": {...}
        }
    """

    logger.info(f"Starting Research Agent for work session {work_session_id}")

    # Update work session status
    await work_session_service.update_status(
        work_session_id,
        WorkSessionStatus.RUNNING
    )

    try:
        # Build research prompt with context
        research_prompt = f"""Research Task: {task_intent}

**Context:**
- Basket ID: {basket_id}
- Work Session ID: {work_session_id}

**Instructions:**
1. Query substrate to understand existing knowledge
2. Identify knowledge gaps
3. Delegate to appropriate subagents if needed
4. Conduct targeted research to fill gaps
5. Emit structured work outputs for ALL significant findings
6. Link outputs to source blocks via source_block_ids

**Remember:**
- Use emit_work_output for EVERY finding, insight, recommendation
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
            if isinstance(message, AssistantMessage):
                final_message = message
                # Count tool calls to emit_work_output
                for block in message.content:
                    if (isinstance(block, ToolUseBlock) and
                        block.name == "mcp__yarnnn__emit_work_output"):
                        outputs_created += 1

            # TODO: Stream progress to user via websocket

        logger.info(f"Research Agent completed. Created {outputs_created} outputs.")

        # Update work session status
        await work_session_service.update_status(
            work_session_id,
            WorkSessionStatus.COMPLETED,
            metadata={"outputs_created": outputs_created}
        )

        return {
            "status": "completed",
            "outputs_created": outputs_created,
            "session_metadata": {
                "final_response": str(final_message) if final_message else None
            }
        }

    except Exception as e:
        logger.error(f"Research Agent failed: {e}", exc_info=True)

        # Update work session status
        await work_session_service.update_status(
            work_session_id,
            WorkSessionStatus.FAILED,
            metadata={"error": str(e)}
        )

        return {
            "status": "failed",
            "error": str(e)
        }
```

---

### 4.3 Integrate with Agent Orchestration Route

**File:** `work-platform/api/src/app/routes/agent_orchestration.py`

Update to use new Research Agent executor:

```python
from src.agents.research_agent_executor import execute_research_agent

@router.post("/agents/run")
async def run_agent(
    request: AgentWorkRequest,
    user_id: str = Depends(verify_jwt)
):
    """Execute agent work session."""

    # ... existing permissions checks ...

    # Create work session
    work_session_id = await _create_work_session(
        basket_id=request.basket_id,
        workspace_id=request.workspace_id,
        user_id=user_id,
        task_intent=request.task_intent,
        task_type=request.task_type,
        project_id=request.project_id
    )

    # Execute with new Claude Agent SDK executor
    if request.agent_type == "research":
        result = await execute_research_agent(
            work_session_id=work_session_id,
            task_intent=request.task_intent,
            basket_id=request.basket_id,
            workspace_id=request.workspace_id,
            user_id=user_id
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unknown agent type: {request.agent_type}")

    return {
        "work_session_id": str(work_session_id),
        "status": result["status"],
        "outputs_created": result.get("outputs_created", 0)
    }
```

---

### 4.4 Phase 4 Completion Checklist

- [ ] `research_agent_config.py` created with system prompt and options
- [ ] All 4 subagents defined (market-intelligence, competitor-tracker, social-listener, analyst)
- [ ] `research_agent_executor.py` created
- [ ] Integration with agent_orchestration.py route
- [ ] Work session status updates working
- [ ] MCP server correctly referenced in options
- [ ] Skills loading enabled
- [ ] Subagent tool restrictions configured

**Acceptance Criteria:**
```python
# This should execute without errors
result = await execute_research_agent(
    work_session_id=test_session_id,
    task_intent="Research AI companion pricing",
    basket_id=ani_project_basket_id,
    workspace_id=test_workspace_id,
    user_id=test_user_id
)

assert result["status"] == "completed"
assert result["outputs_created"] > 0
```

---

## 📋 Phase 5: Integration Testing

### 5.1 Test Against Real Data (ani-project)

**Test Plan:**

1. **Query Substrate Test**
   - Execute query_substrate against ani-project basket
   - Verify existing blocks are returned
   - Check similarity scores
   - Validate block structure

2. **Work Output Emission Test**
   - Create test work session
   - Execute emit_work_output
   - Verify output written to work_outputs table
   - Check provenance (source_block_ids)

3. **Full Research Agent Test**
   - Execute Research Agent with real task: "Analyze competitor pricing strategies"
   - Monitor subagent delegation
   - Verify multiple outputs created
   - Check output quality (titles, summaries, confidence)

4. **Skill Loading Test**
   - Verify Skills are loaded by agent
   - Check that research methodology is followed
   - Validate output quality matches Skill standards

**Test Script:** `work-platform/api/test_full_integration.py`

```python
#!/usr/bin/env python3
"""
Full integration test against ani-project.
"""

import asyncio
from uuid import UUID

from src.agents.research_agent_executor import execute_research_agent


ANI_PROJECT_BASKET_ID = UUID("5004b9e1-67f5-4955-b028-389d45b1f5a4")
TEST_WORKSPACE_ID = UUID("99e6bf7d-513c-45ff-9b96-9362bd914d12")
TEST_USER_ID = UUID("test-user-id")  # Replace with real user


async def test_full_research_workflow():
    """Test complete research workflow."""

    print("🧪 Testing Research Agent Integration\n")

    # Create test work session
    from src.services.work_session_service import WorkSessionService
    work_session_service = WorkSessionService()

    work_session_id = await work_session_service.create(
        basket_id=ANI_PROJECT_BASKET_ID,
        workspace_id=TEST_WORKSPACE_ID,
        user_id=TEST_USER_ID,
        task_intent="Analyze AI companion competitor pricing strategies",
        task_type="research"
    )

    print(f"✅ Created work session: {work_session_id}\n")

    # Execute Research Agent
    print("🤖 Executing Research Agent...\n")

    result = await execute_research_agent(
        work_session_id=work_session_id,
        task_intent="Analyze AI companion competitor pricing strategies focusing on Replika, Character.ai, and Snapchat+",
        basket_id=ANI_PROJECT_BASKET_ID,
        workspace_id=TEST_WORKSPACE_ID,
        user_id=TEST_USER_ID
    )

    print("\n📊 Results:")
    print(f"Status: {result['status']}")
    print(f"Outputs Created: {result['outputs_created']}")

    if result['status'] == 'completed':
        print("\n✅ Research Agent test PASSED")

        # Fetch created outputs
        from src.services.work_output_service import WorkOutputService
        work_output_service = WorkOutputService()

        outputs = await work_output_service.list_by_session(work_session_id)

        print(f"\n📝 Created {len(outputs)} work outputs:\n")
        for i, output in enumerate(outputs):
            print(f"{i+1}. [{output.output_type}] {output.title}")
            print(f"   Confidence: {output.confidence:.0%}")
            print(f"   Sources: {len(output.source_context_ids)} blocks")
            print()

    else:
        print(f"\n❌ Research Agent test FAILED: {result.get('error')}")


if __name__ == "__main__":
    asyncio.run(test_full_research_workflow())
```

---

### 5.2 Quality Evaluation

For each test run, evaluate:

**Output Structure:**
- [ ] All outputs have proper output_type
- [ ] Titles are descriptive and <200 chars
- [ ] Summaries are 1-3 sentences
- [ ] Evidence arrays populated
- [ ] Confidence scores present

**Provenance:**
- [ ] source_block_ids reference actual substrate blocks
- [ ] Provenance chain is traceable
- [ ] Citations are accurate

**Quality:**
- [ ] Findings are specific (not vague)
- [ ] Insights provide analysis (not just facts)
- [ ] Recommendations are actionable
- [ ] No duplicate substrate content

**Skills Adherence:**
- [ ] Research methodology followed (query → gaps → research)
- [ ] Quality standards met (titles, summaries, evidence)
- [ ] Substrate patterns used (query first, link provenance)

---

### 5.3 Phase 5 Completion Checklist

- [ ] Integration test script created
- [ ] Test against ani-project basket passes
- [ ] Multiple work outputs created
- [ ] Output quality meets standards
- [ ] Skills are being used by agent
- [ ] Subagents are being invoked
- [ ] Provenance tracking works
- [ ] No errors in Claude Agent SDK integration

**Acceptance Criteria:**
Research Agent produces 5+ structured outputs for "Analyze competitor pricing" task, all outputs pass quality evaluation.

---

## 📋 Phase 6: Production Deployment

### 6.1 Render Configuration

**Service:** work-platform

**Build Command:**
```bash
# Default Render build
```

**Start Command:**
```bash
uvicorn src.main:app --host 0.0.0.0 --port $PORT
```

**Environment Variables:**
```
ANTHROPIC_API_KEY=<from 1Password>
DATABASE_URL=<Supabase connection>
SUBSTRATE_API_URL=<substrate-api service URL>
CLAUDE_SESSIONS_DIR=/opt/render/project/src/data/claude-sessions
```

**Health Checks:**
- Path: `/health/claude-sdk`
- Expected: `{"status": "healthy"}`

---

### 6.2 Monitoring

**Metrics to Track:**
- Work sessions created per day
- Work outputs per session
- Agent execution time (p50, p95, p99)
- Output approval rate (from work_outputs.supervision_status)
- Tool usage frequency (query_substrate, emit_work_output)
- Subagent invocation patterns

**Logging:**
```python
# Add structured logging
logger.info("research_agent_execution", extra={
    "work_session_id": str(work_session_id),
    "task_intent": task_intent,
    "outputs_created": outputs_created,
    "execution_time_ms": execution_time
})
```

**Alerts:**
- Research Agent failure rate >10%
- Average outputs per session <2
- Execution time >5 minutes (p95)

---

### 6.3 Phase 6 Completion Checklist

- [ ] Deployed to Render successfully
- [ ] Health checks passing
- [ ] Environment variables configured
- [ ] Monitoring dashboards created
- [ ] Error alerting configured
- [ ] First production work session executed
- [ ] Outputs reviewed and approved by user
- [ ] No production errors

---

## 🎯 Success Criteria

### Technical Success
- [ ] Claude Agent SDK integrated and functional
- [ ] MCP tools working (query_substrate, emit_work_output, get_reference_assets)
- [ ] Skills loaded and used by agent
- [ ] Subagents invocable and context-isolated
- [ ] Work sessions create multiple structured outputs
- [ ] Provenance tracking works end-to-end

### Quality Success
- [ ] Outputs follow YARNNN quality standards
- [ ] No duplicate substrate content
- [ ] Confidence scores calibrated appropriately
- [ ] Evidence/sources cited for all claims
- [ ] Output approval rate >70% (user review)

### Architecture Success
- [ ] Clean separation: Claude Agent SDK (execution) + YARNNN (substrate/work)
- [ ] MCP tools integrate with existing substrate_client
- [ ] Work outputs written via existing work_output_service
- [ ] Skills encode organizational context (research methodology)
- [ ] Session management delegated to SDK (not our responsibility)

---

## 📎 References

### Implementation Files Created
- `work-platform/api/Dockerfile` - Updated with Node.js + Claude Code CLI
- `work-platform/api/requirements.txt` - Added claude-agent-sdk
- `work-platform/api/src/mcp/yarnnn_server.py` - MCP tools
- `work-platform/api/.claude/skills/yarnnn-research/SKILL.md` - Research methodology
- `work-platform/api/.claude/skills/yarnnn-quality/SKILL.md` - Quality standards
- `work-platform/api/.claude/skills/yarnnn-substrate/SKILL.md` - Substrate patterns
- `work-platform/api/src/agents/research_agent_config.py` - Agent configuration
- `work-platform/api/src/agents/research_agent_executor.py` - Agent executor
- `work-platform/api/test_full_integration.py` - Integration tests

### Documentation
- [CLAUDE_AGENT_SDK_SELECTION_RATIONALE.md](../canon/CLAUDE_AGENT_SDK_SELECTION_RATIONALE.md) - Why we chose Claude Agent SDK
- [AGENT_SUBSTRATE_ARCHITECTURE.md](../canon/AGENT_SUBSTRATE_ARCHITECTURE.md) - Overall architecture
- [WORK_OUTPUT_LIFECYCLE_IMPLEMENTATION.md](../canon/WORK_OUTPUT_LIFECYCLE_IMPLEMENTATION.md) - Work output flow

---

**This implementation plan can be deleted after completion. Refer to canon docs for permanent architecture.**

**Status:** Ready for implementation
**Next Step:** Phase 1 - Infrastructure Setup
