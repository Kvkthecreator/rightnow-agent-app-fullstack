# Phase 2a Status Report

**Date:** 2025-11-18
**Status:** ⚠️ BLOCKED - SDK API Clarification Needed

## What We Implemented ✅

1. **ResearchAgentSDK Structure** ([src/agents_sdk/research_agent.py](src/agents_sdk/research_agent.py))
   - Clean separation from legacy yarnnn_agents
   - 4 subagents with extracted prompts
   - Feature flag integration
   - Drop-in replacement interface

2. **Feature Flag** ([src/app/routes/agent_orchestration.py](src/app/routes/agent_orchestration.py))
   - `USE_AGENT_SDK` environment variable
   - Graceful fallback to legacy
   - Clear logging

3. **Test Infrastructure** ([test_sdk_agent.py](test_sdk_agent.py))
   - Validation test script
   - Environment checks

## Discovery: SDK Package Confusion ⚠️

**Issue Found:**
The package name `claude-agent-sdk` version 0.2.0 currently installed is actually the **legacy YARNNN custom framework** (our own yarnnn_agents), NOT the official Anthropic Claude Code SDK.

**Evidence:**
```python
# Current installed package (claude_agent_sdk v0.2.0):
from claude_agent_sdk import BaseAgent, SubagentDefinition  # ✅ Works
from claude_agent_sdk import query, ClaudeAgentOptions      # ❌ Doesn't exist

# These are the YARNNN custom classes we're trying to REPLACE
```

**What This Means:**
Our implementation in `agents_sdk/research_agent.py` is written for the **official Anthropic Claude Code SDK** which has a different API:
- Official SDK: Uses `query()` function + `ClaudeAgentOptions`
- Current installed: Uses `BaseAgent` class + `SubagentDefinition`

## Two Paths Forward

### Path A: Use Official Claude Code SDK (Original Plan)

**Pros:**
- Official Anthropic support
- Built-in Skills support
- Progressive context loading
- Better long-term

**Cons:**
- Requires Node.js Claude Code CLI
- Different API than we coded
- More complex setup

**What Needs Changing:**
1. Install actual Claude Code SDK (not our custom package)
2. Verify API matches our implementation
3. Set up Node.js CLI integration
4. Test with real API

### Path B: Keep Custom Framework (Pragmatic)

**Pros:**
- Already works in production
- No external dependencies
- We control the code

**Cons:**
- No official Skills support
- Have to build everything ourselves
- Miss SDK benefits

**What This Means:**
Phase 2a implementation is actually migrating **within our own custom framework**, not to official Anthropic SDK.

## Recommendation

**Pause Phase 2a** until we clarify:

1. **Which SDK are we targeting?**
   - Official Anthropic Claude Code SDK?
   - Our custom yarnnn_agents framework (currently called claude_agent_sdk)?

2. **If Official SDK:**
   - Get access to actual package
   - Verify API documentation
   - Update implementation to match real API

3. **If Custom Framework:**
   - Rename our package to avoid confusion (yarnnn_agents → yarnnn_sdk?)
   - Keep current implementation patterns
   - Skip "SDK migration" and focus on internal refactoring

## Current State

**What Works:**
- ✅ Code structure is clean and well-organized
- ✅ Feature flag integration complete
- ✅ Legacy code preserved
- ✅ Prompts extracted to module level

**What's Blocked:**
- ❌ Can't test without clarifying which SDK we're using
- ❌ API calls don't match installed package
- ❌ Skills implementation depends on SDK choice

## Next Steps (Pending Decision)

**Option 1: Proceed with Official SDK**
1. Get official Claude Code SDK package name
2. Install and verify API
3. Update research_agent.py to match real API
4. Test execution
5. Extract Skills (Phase 2b)

**Option 2: Stay with Custom Framework**
1. Rename phase to "Agent Refactoring" (not SDK migration)
2. Use existing BaseAgent/SubagentDefinition pattern
3. Skip Skills (implement as substrate blocks instead)
4. Focus on cleaning up agent architecture

**Option 3: Hybrid Approach**
1. Keep custom framework for now
2. Add Skills-like functionality using filesystem
3. Plan future migration to official SDK when stable

## Files Created (Phase 2a)

- `src/agents_sdk/research_agent.py` - SDK-based implementation (needs API update)
- `src/agents_sdk/__init__.py` - Module exports
- `test_sdk_agent.py` - Validation test
- `PHASE_2A_STATUS.md` - This document

**Commit:** 29fbb603 "Implement Phase 2a: ResearchAgent SDK migration with feature flag"

---

**Recommendation:** Let's discuss which path makes sense for YARNNN before proceeding further.
