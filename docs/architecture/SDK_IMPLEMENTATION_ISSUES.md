# Claude Agent SDK Implementation Issues & Fixes

**Date**: 2025-11-20
**Status**: 🚨 Critical issues identified in SDK implementation
**Severity**: HIGH - Affects work output extraction and session persistence

---

## Executive Summary

After auditing our Claude Agent SDK implementation against official documentation, **3 critical issues** were identified that prevent proper functionality:

1. **Work outputs never extracted** (CRITICAL) - Tool results not parsed from SDK responses
2. **Session persistence incomplete** (HIGH) - Session IDs not stored properly
3. **Tool execution unclear** (MEDIUM) - Uncertain if SDK auto-executes tools

**Impact**: Current implementation compiles but doesn't achieve core functionality (structured outputs, session continuity).

---

## Critical Issues

### Issue 1: Work Output Extraction Not Implemented ❌

**Files Affected**:
- `thinking_partner_sdk.py` line 442
- `research_agent_sdk.py` line 296

**Current Code**:
```python
# thinking_partner_sdk.py line 442
work_outputs = []  # TODO: Extract from SDK tool results

# research_agent_sdk.py line 296
work_outputs = parse_work_outputs_from_response(message) if hasattr(message, 'content') else []
```

**Problem**:
- Work outputs are never extracted from SDK responses
- `parse_work_outputs_from_response()` expects AsyncAnthropic message format, not SDK format
- Tool results (from `emit_work_output`) are not captured in `receive_response()` loop

**Impact**:
- Structured outputs never reach supervision workflow
- Users never see agent findings/insights/recommendations
- Core value proposition of agent system broken

**Fix Required**:
```python
# In receive_response() loop:
async for message in client.receive_response():
    if hasattr(message, 'content') and isinstance(message.content, list):
        for block in message.content:
            if hasattr(block, 'type'):
                # Capture text responses
                if block.type == 'text' and hasattr(block, 'text'):
                    response_text += block.text

                # Capture tool use (for logging)
                elif block.type == 'tool_use':
                    tool_name = getattr(block, 'name', 'unknown')
                    actions_taken.append(f"Used tool: {tool_name}")

                # CRITICAL: Capture tool results
                elif block.type == 'tool_result':
                    tool_name = getattr(block, 'tool_name', '')
                    if tool_name == 'emit_work_output':
                        try:
                            # Parse the tool result content
                            result_content = getattr(block, 'content', None)
                            if result_content:
                                # Tool results may be JSON strings
                                import json
                                output_data = json.loads(result_content) if isinstance(result_content, str) else result_content
                                work_outputs.append(output_data)
                        except Exception as e:
                            logger.error(f"Failed to parse work output: {e}")
```

---

### Issue 2: Session ID Retrieval Unclear ⚠️

**Files Affected**:
- `thinking_partner_sdk.py` line 438
- `research_agent_sdk.py` line 286

**Current Code**:
```python
# thinking_partner_sdk.py line 438
new_session_id = getattr(client, 'session_id', None)
```

**Problem**:
- SDK may not expose `session_id` as public attribute
- `getattr(client, 'session_id', None)` may return None even when session exists
- No confirmation this pattern works with official SDK

**Impact**:
- Sessions not persisted correctly
- Conversation continuity lost between requests
- Claude forgets context from previous exchanges

**Investigation Needed**:
1. Check if SDK exposes `client.session_id` after `connect()`
2. Test if `session_id` persists after async context closes
3. Verify session resumption with `client.connect(session_id=existing_id)`

**Alternative Approaches**:
```python
# Option A: Check if session_id is in client state
new_session_id = getattr(client, 'session_id', None)

# Option B: Check private attribute
new_session_id = getattr(client, '_session_id', None)

# Option C: Session ID may be in response metadata
# Need to check SDK source code or documentation
```

---

### Issue 3: Session Persistence Missing in Thinking Partner ⚠️

**File Affected**: `thinking_partner_sdk.py`

**Problem**:
- Research Agent calls `self.current_session.update_claude_session(new_session_id)` (line 310)
- Thinking Partner does NOT store session_id to database
- Inconsistent implementation between agents

**Current Code (Research Agent - CORRECT)**:
```python
# research_agent_sdk.py lines 309-310
if new_session_id:
    self.current_session.update_claude_session(new_session_id)
```

**Missing in Thinking Partner**:
```python
# thinking_partner_sdk.py line 445 - ADD THIS:
if new_session_id and self.current_session:
    self.current_session.update_claude_session(new_session_id)
    logger.info(f"Stored Claude session: {new_session_id}")
```

---

### Issue 4: Web Search Tool Format Uncertain ⚠️

**File Affected**: `research_agent_sdk.py` line 163

**Current Code**:
```python
{"type": "web_search_20250305", "name": "web_search"}  # Server tool
```

**Problem**:
- Unclear if this is correct format for server tools vs custom tools
- May need different syntax for built-in Anthropic tools
- No confirmation this works in production

**Alternatives to Test**:
```python
# Option A: Type-only format
{"type": "web_search_20250305"}

# Option B: Name-only format
{"name": "web_search"}

# Option C: String format
"web_search_20250305"

# Option D: Full tool definition (if server tools need description)
{
    "name": "web_search",
    "description": "Search the web for current information",
    "type": "web_search_20250305"
}
```

---

## Environment Issues

### Local Development Environment

**Problem**:
- Local Python 3.9 has `claude-agent-sdk==0.2.0` (old fork)
- Official SDK requires Python 3.10+
- Cannot test SDK locally without upgrading

**Evidence**:
```python
>>> import claude_agent_sdk
>>> claude_agent_sdk.__version__
'0.2.0'
>>> dir(claude_agent_sdk)
['AgentSession', 'BaseAgent', 'SubagentDefinition', ...]  # OLD SDK
# Missing: ClaudeSDKClient, ClaudeAgentOptions  # Official SDK
```

**Production Environment**:
- Docker uses `python:3.10-slim` ✅
- Will have `claude-agent-sdk>=0.1.8` (official) ✅
- SDK implementation will work in production (once issues fixed)

**Recommendation**:
- Fix critical issues in code
- Deploy to Render for testing (production environment)
- Monitor logs for SDK behavior
- Cannot validate locally without Python 3.10 upgrade

---

## Recommended Fix Priority

### P0 (Critical - Must Fix Before Next Deploy):

1. **Implement work output extraction** in both agents
   - Update `receive_response()` loop to capture `tool_result` blocks
   - Parse `emit_work_output` tool results correctly
   - Test in production with logging to validate

2. **Add session persistence** to Thinking Partner
   - Call `update_claude_session()` after chat completes
   - Match Research Agent pattern

### P1 (High - Fix Soon):

3. **Verify session_id retrieval** works
   - Add detailed logging for session_id in production
   - Test session resumption end-to-end
   - Document correct pattern once confirmed

4. **Test web_search tool format**
   - Add logging to confirm web search executes
   - Try alternative formats if current doesn't work
   - Document working format

### P2 (Medium - Can Defer):

5. **Add comprehensive SDK logging**
   - Log all message types received
   - Log tool_use and tool_result details
   - Help debug future issues

6. **Write integration tests**
   - Test work output extraction
   - Test session resumption
   - Test tool execution

---

## Testing Strategy

Since local testing isn't possible (Python 3.9 vs 3.10):

### Phase 1: Deploy with Enhanced Logging
```python
# Add to receive_response() loop:
logger.debug(f"SDK message type: {type(message).__name__}")
if hasattr(message, 'content'):
    for block in message.content:
        logger.debug(f"Block type: {getattr(block, 'type', 'unknown')}")
        if hasattr(block, 'type') and block.type == 'tool_result':
            logger.info(f"Tool result: {getattr(block, 'content', 'no content')}")
```

### Phase 2: Monitor Production
- Deploy to Render
- Make test TP chat request
- Check logs for:
  - Session ID retrieval success/failure
  - Tool result blocks appearing
  - Work outputs being extracted

### Phase 3: Iterate Based on Logs
- Fix issues found in production logs
- Test again
- Repeat until working

---

## Code Changes Required

### File: `thinking_partner_sdk.py`

**Change 1**: Fix work output extraction (lines 415-445)
```python
# REPLACE THIS SECTION:
async for message in client.receive_response():
    # ... existing code ...

    if hasattr(block, 'type') and block.type == 'tool_use':
        tool_name = getattr(block, 'name', 'unknown')
        actions_taken.append(f"Used tool: {tool_name}")

# ... later ...
work_outputs = []  # TODO: Extract from SDK tool results

# WITH THIS:
async for message in client.receive_response():
    if hasattr(message, 'content') and isinstance(message.content, list):
        for block in message.content:
            # Text responses
            if hasattr(block, 'type') and block.type == 'text':
                if hasattr(block, 'text'):
                    response_text += block.text

            # Tool use (for tracking)
            elif hasattr(block, 'type') and block.type == 'tool_use':
                tool_name = getattr(block, 'name', 'unknown')
                actions_taken.append(f"Used tool: {tool_name}")
                logger.debug(f"Tool used: {tool_name}")

            # Tool results (CRITICAL)
            elif hasattr(block, 'type') and block.type == 'tool_result':
                tool_name = getattr(block, 'tool_name', '')
                logger.debug(f"Tool result from: {tool_name}")

                if tool_name == 'emit_work_output':
                    try:
                        result_content = getattr(block, 'content', None)
                        if result_content:
                            import json
                            output_data = json.loads(result_content) if isinstance(result_content, str) else result_content
                            work_outputs.append(output_data)
                            logger.info(f"Captured work output: {output_data.get('title', 'untitled')}")
                    except Exception as e:
                        logger.error(f"Failed to parse work output: {e}", exc_info=True)
```

**Change 2**: Add session persistence (after line 445)
```python
# After work_outputs extraction, ADD:
if new_session_id and self.current_session:
    self.current_session.update_claude_session(new_session_id)
    logger.info(f"Stored Claude session: {new_session_id}")
```

### File: `research_agent_sdk.py`

**Change 1**: Fix work output extraction (lines 270-296)
```python
# Use same pattern as Thinking Partner above
# Replace parse_work_outputs_from_response(message)
# with proper tool_result parsing
```

**Change 2**: Add logging for web_search (line 163)
```python
# ADD after tools list:
logger.info(f"Research Agent tools: {[t.get('name') or t.get('type') for t in tools]}")
```

---

## Next Steps

1. **Apply fixes** to both SDK agent files
2. **Add debug logging** for production monitoring
3. **Commit changes** with clear description
4. **Deploy to Render** for testing
5. **Monitor logs** for SDK behavior
6. **Iterate** based on findings

---

## References

- **Official SDK Docs**: https://platform.claude.com/docs/en/agent-sdk/python
- **SDK Tools Docs**: https://platform.claude.com/docs/en/agent-sdk/custom-tools
- **SDK Subagents**: https://platform.claude.com/docs/en/agent-sdk/subagents
- **SDK Skills**: https://platform.claude.com/docs/en/agent-sdk/skills

---

**Status**: Issues documented, fixes designed, ready to implement.

**Next**: Apply code changes and deploy for validation.
