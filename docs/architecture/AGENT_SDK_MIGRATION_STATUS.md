# Claude Agent SDK Migration Status

**Current Phase:** Documentation Complete, Ready for Implementation
**Last Updated:** 2025-11-18
**Status:** ✅ Architecture Validated, 🚧 Implementation Pending

---

## 🎯 What This Document Is

This is the **single source of truth** for the Claude Agent SDK migration status. It summarizes:
- What we learned during the evaluation phase
- Why we chose Claude Agent SDK over alternatives
- What the critical architecture decisions are
- What's been completed and what's next

**Delete this file after migration is complete.**

---

## 📊 Current Status Summary

### ✅ Completed: Research & Documentation Phase

1. **Canon Documentation Created**
   - [CLAUDE_AGENT_SDK_SELECTION_RATIONALE.md](../canon/CLAUDE_AGENT_SDK_SELECTION_RATIONALE.md)
   - Permanent record of WHY we chose Claude Agent SDK
   - Documents Skills vs Tools distinction
   - Documents Subagents vs Handoffs distinction
   - Documents critical Node.js dependency (CLI wrapper architecture)

2. **Implementation Plan Created**
   - [CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md](./CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md)
   - Working document with 6-phase implementation plan
   - Complete code examples for MCP tools, Skills, agent configs
   - ~3-4 week timeline
   - Can be deleted after implementation complete

3. **Current Implementation Audited**
   - Identified critical issues in `work-platform/api/src/yarnnn_agents/`
   - Dead code: subagent tools (web_search, web_fetch) don't exist
   - Wrong pattern: single-shot API calls, no agentic loop
   - Misalignment: using raw Anthropic API instead of Agent SDK

### 🚧 Not Started: Implementation Phase

**Phase 1-6 outlined in implementation plan, not yet started.**

---

## 🔑 Critical Architecture Decisions

### 1. Claude Agent SDK (NOT Raw API)

**Decision:** Use Claude Agent SDK Python wrapper, not raw Anthropic API.

**Why:**
- **Skills** = organizational context at zero token cost (metadata ~100 tokens, full content on-demand)
- **Subagents** = parallel execution with context isolation
- **Session Management** = built-in conversation persistence
- **MCP** = standard protocol for tools

**Trade-off Accepted:**
- ✅ Node.js dependency required (CLI wrapper architecture)
- ✅ Two runtimes (Python + Node.js subprocess)
- ✅ Deployment complexity justified by Skills value

### 2. Node.js is REQUIRED

**Critical Understanding:**

```
Python SDK (your code)
    ↓ subprocess.Popen()
Claude Code CLI (Node.js process)
    ↓ HTTP requests
Claude API (Anthropic)
```

**This is NOT optional.** The Python SDK wraps the Claude Code CLI, which is a Node.js application.

**Deployment Requirements:**
- Python 3.10+ ✅ (already have)
- Node.js 18+ ⚠️ (MUST install)
- Claude Code CLI ⚠️ (MUST install via npm)

### 3. Skills vs Tools Distinction

**Skills:**
- Procedural knowledge / organizational context
- Loaded progressively (metadata always, content when relevant)
- Zero token cost when not invoked
- Examples: research methodology, quality standards, substrate patterns

**Tools:**
- Executable actions
- Return dynamic data
- Loaded into every context
- Examples: query_substrate, emit_work_output, web_search

**Why This Matters:**
Skills encode YARNNN's substrate patterns, research methodology, and quality standards WITHOUT bloating every prompt. This is the moat.

### 4. Subagents vs Handoffs

**Subagents (Claude SDK):**
- Parallel execution
- Context isolation (only parent context visible)
- Multiple subagents can run simultaneously
- Example: market-intelligence + competitor-tracker subagents both query substrate in parallel

**Handoffs (OpenAI SDK):**
- Sequential execution
- Shared conversation history
- One agent at a time
- Not suitable for parallel research tasks

**Why Subagents:** YARNNN research agents need to query substrate from multiple angles simultaneously (market + competitive + social).

---

## 📁 File Changes Summary

### Created Files

1. **docs/canon/CLAUDE_AGENT_SDK_SELECTION_RATIONALE.md** (459 lines)
   - Permanent canonical reference
   - Why Claude SDK vs alternatives
   - Key concepts with documentation URLs
   - Critical Node.js architecture clarification

2. **docs/architecture/CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md** (887 lines)
   - Working implementation guide
   - 6 phases with detailed steps
   - Complete code examples
   - Can be deleted after completion

3. **docs/architecture/AGENT_SDK_MIGRATION_STATUS.md** (this file)
   - Single source of truth for migration status
   - Summary of decisions and next steps
   - Delete after migration complete

### Files to be Modified (Phase 1-6)

**Phase 1: Infrastructure**
- `work-platform/api/Dockerfile` - Add Node.js + Claude Code CLI
- `work-platform/api/requirements.txt` - Add `claude-agent-sdk`
- Render web service config - Environment variables

**Phase 2: MCP Tools**
- New file: `work-platform/api/src/yarnnn_mcp/yarnnn_server.py`
- MCP tools: query_substrate, emit_work_output, get_reference_assets

**Phase 3: Skills**
- New directory: `work-platform/api/.claude/skills/`
- 3 Skills: research_methodology, quality_standards, substrate_patterns

**Phase 4: Agent Scaffold**
- New file: `work-platform/api/src/yarnnn_agents_v2/research_agent.py`
- Config file: `work-platform/api/.claude/research_agent_config.yml`
- 4 Subagents: market-intelligence, competitor-tracker, social-listener, analyst

**Phase 5: Testing**
- Test against ani-project (basket_id: known)
- Compare quality vs current implementation

**Phase 6: Deployment**
- Push to Render
- Monitor logs for Claude Code CLI errors
- Verify subprocess communication works in production

### Files to be DEPRECATED

After migration complete:
- `work-platform/api/src/yarnnn_agents/` - Old implementation (raw API)
- `work-platform/api/test_research_agent.py` - Old test script

**Do NOT delete immediately** - keep for reference during testing, archive after validation.

---

## 🧭 Next Steps (When Ready to Implement)

### Step 1: Review Documentation

**Before starting implementation, review:**
1. [CLAUDE_AGENT_SDK_SELECTION_RATIONALE.md](../canon/CLAUDE_AGENT_SDK_SELECTION_RATIONALE.md) - Understand WHY
2. [CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md](./CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md) - Understand HOW (Sequential Phases)
3. This file (AGENT_SDK_MIGRATION_STATUS.md) - Understand STATUS

**Critical checks:**
- ✅ Do you understand Skills vs Tools?
- ✅ Do you understand Subagents vs Handoffs?
- ✅ Do you understand the Node.js dependency?
- ✅ Do you understand the CLI wrapper architecture?

### Step 2: Start Phase 0 (Prove SDK Works - Isolated)

**Goal:** Verify Claude Agent SDK works in isolation, NO YARNNN integration yet

**First task:** Update Dockerfile

```bash
cd work-platform/api
# Edit Dockerfile to add Node.js + Claude Code CLI
# (See implementation plan Phase 0 for exact code)
```

**Test locally:**
```bash
docker build -t yarnnn-work-platform .
docker run yarnnn-work-platform claude-code --version
# Should output: Claude Code v2.x.x
```

**Create minimal test agent:**
```bash
# Create test_agent_sdk.py (hello world level)
# Run simple agent to verify subprocess communication works
python test_agent_sdk.py
```

**Exit Gate:** Do NOT proceed to Phase 1 until Phase 0 success criteria pass.

### Step 3: Proceed Through Phases Sequentially

**Sequential Approach (5-6 weeks):**
- **Phase 0:** Prove SDK works (2-3 days)
- **Phase 1:** MCP tools for substrate (3-4 days)
- **Phase 2:** Base Skills (2-3 days)
- **Phase 3:** Simple research agent (4-5 days)
- **Phase 4:** Subagents (3-4 days)
- **Phase 5:** Dynamic project context (3-4 days)
- **Phase 6:** Production hardening (5-7 days)

**Each phase has:**
- Clear deliverables
- Success criteria
- Exit gate (must pass before next phase)
- Testing steps

**Key Principle:** Test each phase independently before moving forward.

---

## ⚠️ Common Pitfalls to Avoid

### 1. Confusing API with SDK

**Wrong:** "I'll use Anthropic Python SDK to call Claude API"
**Right:** "I'll use Claude Agent SDK (which wraps Claude Code CLI)"

### 2. Thinking Node.js is Optional

**Wrong:** "Python SDK, so no Node.js needed"
**Right:** "Python SDK wraps Node.js CLI, Node.js REQUIRED"

### 3. Using Tools for Organizational Context

**Wrong:** Creating `get_research_methodology` tool
**Right:** Creating `research_methodology` Skill

**Why:** Skills load progressively (metadata always, content when relevant), tools load every time.

### 4. Treating Subagents Like Function Calls

**Wrong:** Expecting subagents to return structured output like tool calls
**Right:** Subagents are autonomous agents that produce work artifacts

### 5. Rushing Implementation Without Documentation Review

**Wrong:** "I read the README, let's start coding"
**Right:** "I've reviewed rationale + plan + status, I understand the architecture, now I'll implement"

---

## 📊 Success Criteria

### Phase 1 Success
- ✅ Docker build succeeds with Node.js + Claude Code CLI
- ✅ `claude-code --version` works in container
- ✅ Can import `claude_agent_sdk` in Python

### Phase 2 Success
- ✅ MCP server runs without errors
- ✅ `query_substrate` tool can fetch blocks from substrate-API
- ✅ `emit_work_output` tool can create work outputs

### Phase 3 Success
- ✅ 3 Skills defined in `.claude/skills/`
- ✅ Skills markdown validated (frontmatter + content)
- ✅ Skills load without errors

### Phase 4 Success
- ✅ Research agent config loads
- ✅ 4 Subagents defined correctly
- ✅ Agent can spawn subagents

### Phase 5 Success
- ✅ Research agent completes ani-project research task
- ✅ Work outputs created in substrate-API
- ✅ Quality comparable or better than current implementation

### Phase 6 Success
- ✅ Deployed to Render
- ✅ Claude Code CLI runs in production
- ✅ No subprocess communication errors
- ✅ Work sessions complete end-to-end

---

## 📞 Questions to Ask Before Starting

1. **Do I understand why Skills matter for YARNNN?**
   - If no: Re-read rationale doc section "Why Skills = Moat"

2. **Do I understand the Node.js dependency?**
   - If no: Re-read rationale doc section "Critical Architecture Understanding"

3. **Do I understand how subagents enable parallel research?**
   - If no: Re-read rationale doc section "Subagents vs Handoffs"

4. **Do I have 3-4 weeks allocated for this migration?**
   - If no: Discuss timeline adjustment

5. **Am I ready to deprecate the current raw API implementation?**
   - If no: Clarify what concerns remain

---

## 🎯 The Goal

**Replace the current raw Anthropic API implementation with Claude Agent SDK, enabling:**
1. Skills for organizational context (substrate patterns, research methodology)
2. Subagents for parallel research execution
3. Session management for conversation persistence
4. MCP tools for substrate/work integration

**The result:** A battle-tested agentic infrastructure that aligns with YARNNN's thesis (Context + Work = Superior AI outcomes).

---

## 📎 See Also

- [CLAUDE_AGENT_SDK_SELECTION_RATIONALE.md](../canon/CLAUDE_AGENT_SDK_SELECTION_RATIONALE.md) - WHY
- [CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md](./CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md) - HOW
- [AGENT_SUBSTRATE_ARCHITECTURE.md](../canon/AGENT_SUBSTRATE_ARCHITECTURE.md) - YARNNN architecture phases
- [TERMINOLOGY_GLOSSARY.md](../canon/TERMINOLOGY_GLOSSARY.md) - Terminology reference

---

**Status:** Documentation phase complete. Ready for Phase 1 implementation when approved.

**Last Updated:** 2025-11-18
