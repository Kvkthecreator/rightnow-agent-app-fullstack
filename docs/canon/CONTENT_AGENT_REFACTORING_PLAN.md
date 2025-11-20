# ContentAgentSDK & ReportingAgentSDK Refactoring

**Date**: 2025-11-20
**Context**: Post-Phase 2e, post-ThinkingPartner architecture implementation
**Status**: ✅ COMPLETED (Phase 1 + Phase 2)
**Goal**: Align ContentAgent and ReportingAgent with three-agent division of labor and TP gateway architecture

---

## Executive Summary

### Architecture Decision: Text vs Files

After Thinking Partner implementation, the three-agent division of labor became clear:

**ContentAgentSDK** (Creative Text):
- **Input**: Topic, platform, brand voice
- **Output**: TEXT content only (posts, tweets, captions, articles)
- **Storage**: Substrate blocks (text is the asset)
- **Tools**: emit_work_output
- **Files**: ❌ NO

**ReportingAgentSDK** (Business Intelligence):
- **Input**: Data, analysis, findings (from ResearchAgent)
- **Output**: Professional FILES (PDF reports, XLSX dashboards, PPTX decks)
- **Storage**: Supabase Storage (files are assets)
- **Tools**: Skills (PDF, XLSX, PPTX, DOCX), code_execution, emit_work_output
- **Files**: ✅ YES

### Implementation Completed

**ContentAgent Phase 1 + 2** ✅:
1. ✅ Removed Skills (belongs in ReportingAgent)
2. ✅ Fixed broken `execute_with_context()` → `reason()`
3. ✅ Fixed `.model_dump()` → `.to_dict()`
4. ✅ Removed tools from constructor
5. ✅ Added 4 platform specialist subagents (Twitter, LinkedIn, Blog, Instagram)
6. ✅ TEXT-only focus (max_tokens 8000 → 4096)

**ReportingAgent Phase 1 + 2** ✅:
1. ✅ Fixed broken `execute_with_context()` → `reason()`
2. ✅ Fixed `.model_dump()` → `.to_dict()`
3. ✅ Removed tools from constructor
4. ✅ Added Skills integration (PDF, XLSX, PPTX, DOCX)
5. ✅ Added code_execution for data processing
6. ✅ Updated system prompt with Skills instructions

**BaseAgent Enhancement** ✅:
- Extended `reason()` with `container` parameter for Skills support

---

## Architecture Audit

### Current Architecture

```python
ContentAgentSDK
  ├─ Inherits: BaseAgent
  ├─ Memory: SubstrateMemoryAdapter (BFF to substrate-API) ✅
  ├─ Tools: [EMIT_WORK_OUTPUT_TOOL] (passed to __init__) ⚠️
  ├─ Skills: None ❌
  ├─ Server Tools: None (no web_search/web_fetch) ❌
  ├─ Subagents: None ❌
  └─ Main Method: create() → execute_with_context() ❌ BROKEN
```

### Issues with Current Implementation

#### 1. **CRITICAL: `execute_with_context()` Doesn't Exist**

**Location**: [content_agent.py:295](work-platform/api/src/agents_sdk/content_agent.py#L295)

```python
# Current (BROKEN):
response = await self.execute_with_context(user_prompt)
```

**Problem**: BaseAgent has `reason()`, NOT `execute_with_context()`. This will throw `AttributeError` at runtime.

**Evidence**: Checked [base.py:260-343](work-platform/api/src/yarnnn_agents/base.py#L260-L343) - only `reason()` method exists.

**Fix Required**: Replace with `self.reason()` and manual memory context injection (like ResearchAgent does).

---

#### 2. **CRITICAL: Wrong Work Output Serialization**

**Location**: [content_agent.py:306](work-platform/api/src/agents_sdk/content_agent.py#L306)

```python
# Current (WRONG):
"work_outputs": [wo.model_dump() for wo in work_outputs]

# Should be (CORRECT):
"work_outputs": [wo.to_dict() for wo in work_outputs]
```

**Problem**: WorkOutput is a `@dataclass`, not a Pydantic model. It has `.to_dict()`, not `.model_dump()`.

**Evidence**: [work_output_tools.py:73-102](work-platform/api/src/yarnnn_agents/tools/work_output_tools.py#L73-L102) - `to_dict()` method defined.

---

#### 3. **Missing Server Tools (Web Search/Fetch)**

**Problem**: Content creation needs current trends, competitor analysis, trending topics.

**Current**: No server tools enabled.

**Should Have**:
```python
tools = [
    EMIT_WORK_OUTPUT_TOOL,
    {"type": "web_search_20250305", "name": "web_search"},
    {"type": "web_fetch_20250305", "name": "web_fetch"}
]
```

**Use Cases**:
- Twitter content: Search trending topics, competitor tweets
- LinkedIn content: Research industry news, thought leadership
- Blog content: Fetch references, validate facts
- Instagram content: Research visual trends, hashtag performance

---

#### 4. **No Skills Integration**

**Problem**: Content deliverables should use Skills for professional outputs.

**Missing Capabilities**:
- **DOCX**: Blog drafts, long-form content documents
- **PPTX**: Social media content calendars, presentation decks
- **PDF**: Content strategy reports, brand guidelines
- **XLSX**: Content calendars, performance tracking spreadsheets

**Current**: Only text outputs via `emit_work_output`.

**Should Enable**:
```python
from yarnnn_agents.utils.skills_helper import (
    create_skills_enabled_client,
    get_skills_for_formats,
    process_skills_response_to_work_outputs
)

# In create() method:
tools = [
    EMIT_WORK_OUTPUT_TOOL,
    {"type": "web_search_20250305", "name": "web_search"},
    {"type": "code_execution_20250825", "name": "code_execution"}
]

response = await self.reason(
    task=user_prompt,
    context=context,
    tools=tools,
    container={"skills": get_skills_for_formats(["docx", "pptx", "pdf", "xlsx"])},
    max_tokens=8000
)
```

---

#### 5. **Tools Passed to Constructor (Anti-Pattern)**

**Location**: [content_agent.py:203](work-platform/api/src/agents_sdk/content_agent.py#L203)

```python
# Current (ANTI-PATTERN):
super().__init__(
    agent_type="content",
    tools=[EMIT_WORK_OUTPUT_TOOL],  # ← Should NOT be here
    ...
)
```

**Problem**: Tools should be method-specific, not agent-wide. Different methods may need different tools.

**Correct Pattern** (from ResearchAgent):
```python
# Constructor: NO tools parameter
super().__init__(
    agent_type="content",
    # NO tools parameter
)

# Method: tools passed per-call
async def create(self, ...):
    tools = [EMIT_WORK_OUTPUT_TOOL, web_search, ...]
    response = await self.reason(task, context, tools=tools)
```

**Rationale**:
- `create()` needs: emit_work_output, web_search, code_execution (Skills)
- Future `repurpose()` might need: different tools
- Future `schedule()` might need: calendar tools

---

#### 6. **No Subagents (Opportunity for Quality)**

**Current**: Monolithic agent handles all platforms.

**Opportunity**: Platform specialists could improve quality.

**Proposed Subagents**:

1. **twitter_specialist**:
   - System prompt: Twitter best practices, character limits, thread structure
   - Focus: Punchy hooks, engagement tactics, hashtag strategy

2. **linkedin_specialist**:
   - System prompt: Professional tone, thought leadership, industry insights
   - Focus: Credibility signals, data-driven posts, engagement

3. **blog_specialist**:
   - System prompt: SEO, long-form structure, narrative flow
   - Focus: Headers, internal links, reader retention

4. **instagram_specialist**:
   - System prompt: Visual storytelling, caption hooks, CTAs
   - Focus: Emojis, line breaks, story arcs

**Implementation**:
```python
def _register_subagents(self):
    self.subagents.register(
        SubagentDefinition(
            name="twitter_specialist",
            description="Create engaging Twitter content optimized for engagement",
            system_prompt=TWITTER_SPECIALIST_PROMPT
        )
    )
    # ... register other specialists
```

**Decision**: Start without subagents (YAGNI), but architecture supports adding later.

---

## Refactoring Plan

### Phase 1: Critical Fixes (MUST DO)

**Priority**: P0 - Blocking bugs

1. **Fix `execute_with_context()` → `reason()`**:
   - Replace broken method call
   - Add manual memory context injection (like ResearchAgent)
   - Test with simple content creation task

2. **Fix work output serialization**:
   - Change `.model_dump()` → `.to_dict()`
   - Verify outputs serialize correctly

3. **Remove tools from constructor**:
   - Delete `tools=[EMIT_WORK_OUTPUT_TOOL]` from `super().__init__()`
   - Pass tools to `reason()` method instead

**Estimated Impact**: Fixes runtime crashes, makes agent functional

---

### Phase 2: Server Tools Integration (HIGH PRIORITY)

**Priority**: P1 - Critical for quality content

1. **Enable web_search and web_fetch**:
   - Add to `create()` method tools array
   - Update system prompt to guide tool usage
   - Test with trending topic content request

2. **Update prompts to leverage web tools**:
   - Add instructions for researching trending topics
   - Guide Claude to validate facts via web fetch
   - Encourage competitive analysis via search

**Prompts to Add**:
```python
CONTENT_AGENT_SYSTEM_PROMPT += """

**Web Research Capabilities**:
- Use web_search to find trending topics, competitor content, industry news
- Use web_fetch to validate facts, gather references, analyze competitor posts
- Always cite sources when using web research in content

**When to Research**:
- Twitter: Check trending hashtags, competitor tweets
- LinkedIn: Research industry news, thought leadership topics
- Blog: Validate facts, gather supporting evidence
- Instagram: Check visual trends, popular content themes
"""
```

**Expected Outcome**: Content is more current, data-driven, competitive

---

### Phase 3: Skills Integration (HIGH VALUE)

**Priority**: P1 - Enables professional deliverables

1. **Enable code_execution for Skills**:
   - Add to tools array: `{"type": "code_execution_20250825", "name": "code_execution"}`
   - Add container parameter: `{"skills": get_skills_for_formats(["docx", "pptx", "pdf", "xlsx"])}`

2. **Add file output handling**:
   - After `reason()` call, check for file_ids in response
   - Use `process_skills_response_to_work_outputs()` helper
   - Download files from Claude Files API
   - Upload to Supabase Storage (yarnnn-assets bucket)

3. **Update prompts for file generation**:
```python
CONTENT_AGENT_SYSTEM_PROMPT += """

**File Generation Capabilities (Skills)**:
You can generate professional files using Claude Skills:
- **DOCX**: Blog drafts, long-form content, brand guidelines
- **PPTX**: Content calendars, presentation decks, strategy slides
- **PDF**: Content strategy reports, brand style guides
- **XLSX**: Editorial calendars, content performance trackers

When user requests a deliverable file:
1. Choose appropriate skill based on format
2. Generate structured, professional content
3. Emit work_output with file_id, file_format, generation_method="skill"
"""
```

4. **Create helper method for file outputs**:
```python
async def _handle_file_outputs(
    self,
    response: Any,
    basket_id: str,
    work_ticket_id: str
) -> List[WorkOutput]:
    """Process file outputs from Skills and upload to storage."""
    from yarnnn_agents.utils.skills_helper import process_skills_response_to_work_outputs

    # Extract file_ids, download, upload to Supabase
    file_outputs = process_skills_response_to_work_outputs(
        response=response,
        client=self.claude,
        basket_id=basket_id,
        work_ticket_id=work_ticket_id,
        supabase_client=None  # TODO: inject Supabase client
    )

    return file_outputs
```

**Expected Outcome**: Agent can generate professional DOCX blogs, PPTX calendars, PDF reports

---

### Phase 4: Quality Improvements (OPTIONAL)

**Priority**: P2 - Nice to have

1. **Add platform validation**:
   - Validate platform names against enabled_platforms
   - Provide helpful error messages

2. **Add content type validation**:
   - Validate content_type values (post, thread, article, etc.)
   - Suggest alternatives if invalid

3. **Improve task parsing in `execute()`**:
   - Use regex for more robust parsing
   - Extract platform, content_type, topic more reliably

4. **Add brand voice examples to context**:
   - Query substrate for brand voice samples
   - Inject into context for tone matching

**Expected Outcome**: Better UX, fewer errors, higher quality output

---

### Phase 5: Subagents (DEFERRED)

**Priority**: P3 - Future enhancement

**Decision**: Defer subagents until we have evidence they improve quality.

**Rationale**:
- Current prompts already have platform-specific guidelines
- Skills already specialized (docx skill knows documents)
- YAGNI - don't add complexity without proven need

**If we add later**:
- Create platform specialist subagents
- Test quality improvement vs monolithic
- Measure engagement metrics before/after

---

## Implementation Order

### Step 1: Critical Fixes (30 min)
1. Fix `execute_with_context()` → `reason()`
2. Fix `.model_dump()` → `.to_dict()`
3. Move tools from constructor to method
4. Test basic content creation

### Step 2: Server Tools (1 hour)
1. Add web_search and web_fetch to tools array
2. Update system prompt with web research guidance
3. Test with trending topic request
4. Verify web citations appear in outputs

### Step 3: Skills Integration (2 hours)
1. Enable code_execution + Skills container
2. Add file output handling helper
3. Update prompts for file generation
4. Test DOCX blog generation
5. Test PPTX calendar generation
6. Verify files download and upload to Supabase

### Step 4: Integration Test (1 hour)
1. Create test_content_agent_complete.py
2. Test text outputs (Twitter, LinkedIn posts)
3. Test file outputs (DOCX blog, PPTX deck)
4. Test web research integration
5. Validate work_outputs structure

### Step 5: Documentation (30 min)
1. Update SKILLS_IMPLEMENTATION_GUIDE.md
2. Add ContentAgentSDK examples
3. Document file output workflow
4. Update YARNNN_PLATFORM_CANON_V4.md

**Total Estimated Time**: ~5 hours

---

## Code Changes Required

### File: `content_agent.py`

#### Change 1: Fix create() method

```python
# BEFORE (BROKEN):
async def create(self, platform, topic, content_type, requirements):
    # ... build user_prompt ...

    response = await self.execute_with_context(user_prompt)  # ❌ BROKEN
    work_outputs = parse_work_outputs_from_response(response)

    return {
        "content": response.content[0].text if response.content else "",
        "work_outputs": [wo.model_dump() for wo in work_outputs],  # ❌ WRONG
        ...
    }

# AFTER (FIXED):
async def create(self, platform, topic, content_type, requirements):
    # ... build user_prompt ...

    # Query memory for brand voice context
    context = None
    source_block_ids = []
    if self.memory:
        memory_results = await self.memory.query(
            f"brand voice examples for {platform}",
            limit=5
        )
        context = "\n".join([r.content for r in memory_results])
        source_block_ids = [
            str(r.metadata.get("block_id", r.metadata.get("id", "")))
            for r in memory_results
            if hasattr(r, "metadata") and r.metadata
        ]
        source_block_ids = [bid for bid in source_block_ids if bid]

    # Build tools array
    tools = [
        EMIT_WORK_OUTPUT_TOOL,
        {"type": "web_search_20250305", "name": "web_search"},
        {"type": "web_fetch_20250305", "name": "web_fetch"},
        {"type": "code_execution_20250825", "name": "code_execution"}
    ]

    # Call Claude with Skills enabled
    from yarnnn_agents.utils.skills_helper import get_skills_for_formats

    response = await self.reason(
        task=user_prompt,
        context=context,
        tools=tools,
        container={"skills": get_skills_for_formats(["docx", "pptx", "pdf", "xlsx"])},
        max_tokens=8000
    )

    # Parse text outputs
    work_outputs = parse_work_outputs_from_response(response)

    # Parse file outputs (if any)
    from yarnnn_agents.utils.skills_helper import extract_file_ids_from_response
    file_ids = extract_file_ids_from_response(response)
    # TODO: Download files and create file work_outputs

    return {
        "content": response.content[0].text if response.content else "",
        "work_outputs": [wo.to_dict() for wo in work_outputs],  # ✅ FIXED
        "platform": platform,
        "topic": topic,
        "content_type": content_type,
        "source_block_ids": source_block_ids,
    }
```

#### Change 2: Remove tools from constructor

```python
# BEFORE:
super().__init__(
    agent_type="content",
    tools=[EMIT_WORK_OUTPUT_TOOL],  # ❌ Remove this
    ...
)

# AFTER:
super().__init__(
    agent_type="content",
    # NO tools parameter
    ...
)
```

#### Change 3: Update system prompt

```python
CONTENT_AGENT_SYSTEM_PROMPT = """You are a professional content creator specializing in multi-platform content.

Your core capabilities:
- Create platform-optimized content (Twitter, LinkedIn, Blog, Instagram)
- Research trending topics and competitor content via web search
- Generate professional deliverables (DOCX, PPTX, PDF, XLSX) via Skills
- Maintain consistent brand voice across all platforms
- Adapt tone and format for each platform's best practices

**Web Research Tools**:
- web_search: Find trending topics, competitor content, industry news
- web_fetch: Validate facts, gather references, analyze specific URLs

**File Generation Skills**:
- DOCX: Blog drafts, long-form content documents
- PPTX: Content calendars, presentation decks
- PDF: Strategy reports, brand guidelines
- XLSX: Editorial calendars, performance trackers

**Platform Guidelines**:
- **Twitter**: Concise (280 chars), punchy, conversational, research trending hashtags
- **LinkedIn**: Professional tone, insights-driven, research industry news
- **Blog**: Long-form (800-2000 words), SEO-friendly, validate facts via web_fetch
- **Instagram**: Visual-first, caption storytelling, research visual trends

**Quality Standards**:
- Research current trends before creating content
- Cite sources when using web research
- Generate file outputs when user requests deliverables
- Use emit_work_output for all content (text or file)

You have access to the substrate (brand voice examples, content history) via memory.
Use emit_work_output to save created content for approval.
"""
```

---

## Testing Plan

### Test 1: Basic Text Content (Twitter)

```python
@pytest.mark.asyncio
async def test_content_agent_twitter_post(content_agent):
    result = await content_agent.create(
        platform="twitter",
        topic="AI agent trends",
        content_type="post"
    )

    assert "work_outputs" in result
    assert len(result["work_outputs"]) > 0
    assert result["platform"] == "twitter"
```

### Test 2: Web Research Integration

```python
@pytest.mark.asyncio
async def test_content_agent_with_web_research(content_agent):
    result = await content_agent.create(
        platform="linkedin",
        topic="Latest AI agent frameworks November 2025",
        content_type="post"
    )

    # Should have web citations
    has_web_citation = False
    for output in result["work_outputs"]:
        if any(indicator in output.get("body", "") for indicator in ["http", "https", "www."]):
            has_web_citation = True
            break

    assert has_web_citation, "No web citations - web_search may not have been used"
```

### Test 3: File Output (DOCX Blog)

```python
@pytest.mark.asyncio
async def test_content_agent_docx_blog(content_agent):
    result = await content_agent.create(
        platform="blog",
        topic="AI Agent Architecture Best Practices",
        content_type="article",
        requirements="Generate as DOCX file with professional formatting"
    )

    # Should have file outputs
    file_outputs = [wo for wo in result["work_outputs"] if wo.get("file_id")]
    assert len(file_outputs) > 0, "No file outputs generated"

    # Check file metadata
    docx_output = file_outputs[0]
    assert docx_output["file_format"] == "docx"
    assert docx_output["generation_method"] == "skill"
```

### Test 4: Content Calendar (PPTX)

```python
@pytest.mark.asyncio
async def test_content_agent_pptx_calendar(content_agent):
    result = await content_agent.create(
        platform="linkedin",
        topic="Q1 2026 Content Calendar",
        content_type="calendar",
        requirements="Generate as PPTX presentation with 4 slides"
    )

    file_outputs = [wo for wo in result["work_outputs"] if wo.get("file_id")]
    assert len(file_outputs) > 0

    pptx_output = file_outputs[0]
    assert pptx_output["file_format"] == "pptx"
```

---

## Alignment with Platform Architecture

### BFF Pattern ✅
- SubstrateMemoryAdapter for substrate-API access
- SUBSTRATE_SERVICE_SECRET authentication
- No direct database access

### Work Orchestration ✅
- emit_work_output for all deliverables
- work_outputs supervision workflow
- Provenance tracking via source_block_ids

### Skills Integration ✅ (After refactor)
- code_execution tool enabled
- Skills container with formats
- File download and Supabase upload
- File work_outputs with metadata

### Tool Use Patterns ✅ (After refactor)
- Custom tools: emit_work_output
- Server tools: web_search, web_fetch
- Method-level tools (not constructor)
- Proper tool result handling

---

## Migration Strategy

**Approach**: In-place refactoring (no new files)

**Rationale**:
- ContentAgentSDK is not in production yet
- No existing integrations to migrate
- Simpler to fix in place than create new version

**Steps**:
1. Create feature branch: `fix/content-agent-refactor`
2. Apply changes to content_agent.py
3. Create integration tests
4. Run tests and verify outputs
5. Update documentation
6. Commit with descriptive message
7. Push and verify CI passes

**Backward Compatibility**: Not required (no production usage)

---

## Success Criteria

### Must Have:
- ✅ Agent executes without crashes
- ✅ Text content outputs working (Twitter, LinkedIn, Blog)
- ✅ Web search integration working (citations in outputs)
- ✅ Skills file generation working (DOCX, PPTX)
- ✅ Work outputs serialize correctly (.to_dict())
- ✅ Integration tests passing (4/4)

### Nice to Have:
- ✅ All 4 Skills working (PDF, XLSX, DOCX, PPTX)
- ✅ File upload to Supabase Storage
- ✅ Provenance tracking (source_block_ids)
- ✅ Brand voice context injection

---

## Risk Assessment

### Low Risk:
- Critical fixes (execute_with_context, .model_dump)
- Tool array changes
- Prompt updates

### Medium Risk:
- Skills integration (new functionality, file handling)
- Web tools integration (network dependencies)

### Mitigation:
- Comprehensive integration tests
- Test with real API calls (not mocks)
- Validate file downloads work
- Verify Supabase uploads succeed

---

## Next Steps

1. **Review this plan** with user for approval
2. **Create feature branch** for refactoring
3. **Apply Phase 1 fixes** (critical bugs)
4. **Test Phase 1** (basic functionality)
5. **Apply Phase 2** (server tools)
6. **Apply Phase 3** (Skills)
7. **Create integration tests**
8. **Documentation updates**
9. **Commit and push**

**Estimated Total Time**: 5-6 hours for complete implementation and testing.

---

## ✅ IMPLEMENTATION COMPLETED

### ContentAgent Phase 1: Critical Fixes

**File**: [work-platform/api/src/agents_sdk/content_agent.py](../../work-platform/api/src/agents_sdk/content_agent.py)

**Changes Made**:

1. **Removed Skills from ContentAgent** (Lines 200-228):
   - Deleted Skills integration code
   - Removed `get_skills_for_formats` import
   - Removed `container` parameter from `reason()` call
   - ContentAgent is now TEXT ONLY

2. **Updated System Prompt** (Lines 33-75):
```python
CONTENT_AGENT_SYSTEM_PROMPT = """You are a professional content creator specializing in creative text generation for social and marketing platforms.

Your core capabilities:
- Create platform-optimized TEXT content (Twitter, LinkedIn, Blog, Instagram)
- Maintain consistent brand voice across all platforms
- Adapt tone and format for each platform's best practices
- Generate engaging, actionable content

**IMPORTANT**: You create TEXT CONTENT ONLY. You do NOT generate files (PDF, DOCX, PPTX). File generation is handled by the ReportingAgent.
```

3. **Fixed create() Method** (Lines 294-348):
```python
# Query memory for brand voice context
context = None
source_block_ids = []
if self.memory:
    memory_results = await self.memory.query(
        f"brand voice examples for {platform}",
        limit=5
    )
    context = "\n".join([r.content for r in memory_results])
    source_block_ids = [
        str(r.metadata.get("block_id", r.metadata.get("id", "")))
        for r in memory_results
        if hasattr(r, "metadata") and r.metadata
    ]
    source_block_ids = [bid for bid in source_block_ids if bid]

# Build tools (text content only)
tools = [EMIT_WORK_OUTPUT_TOOL]

# Call Claude with platform-specific specialist prompt
response = await self.reason(
    task=user_prompt,
    context=context,
    system_prompt=specialist_prompt,
    tools=tools,
    max_tokens=4096  # Reduced from 8000 (text only)
)

# Parse work outputs
work_outputs = parse_work_outputs_from_response(response)

return {
    "content": response.content[0].text if response.content else "",
    "work_outputs": [wo.to_dict() for wo in work_outputs],  # Fixed from .model_dump()
    "source_block_ids": source_block_ids,
    "platform": platform,
    "topic": topic,
    "content_type": content_type,
    "specialist_used": specialist_name,
}
```

4. **Removed Tools from Constructor** (Lines 200-228):
```python
# BEFORE (BROKEN):
super().__init__(
    tools=[EMIT_WORK_OUTPUT_TOOL],  # Anti-pattern
    ...
)

# AFTER (FIXED):
super().__init__(
    # NO tools parameter
    ...
)
```

---

### ContentAgent Phase 2: Platform Subagents

**File**: [work-platform/api/src/agents_sdk/content_agent.py](../../work-platform/api/src/agents_sdk/content_agent.py)

**Changes Made**:

1. **Created 4 Platform Specialist Prompts** (Lines 81-276):

**Twitter Specialist** (Lines 81-120):
```python
TWITTER_SPECIALIST_PROMPT = """You are a Twitter/X content specialist with deep expertise in the platform's unique dynamics.

**Platform Expertise**:
- 280-character limit mastery (concise, punchy language)
- Thread structure and narrative flow across multiple tweets
- Viral mechanics: hooks, engagement patterns, timing
- Hashtag strategy (1-2 max, highly relevant)
- Conversational tone that drives replies and engagement

**Content Patterns**:
1. Hook (first 50 chars) - grab attention immediately
2. Value delivery (core insight, tip, story)
3. CTA or conversation starter (ask question, encourage action)

**Thread Best Practices**:
- Start with the punchline (hook with payoff)
- Use numbered structure for clarity (1/7, 2/7...)
- Each tweet should standalone but build narrative
- End with summary or CTA
```

**LinkedIn Specialist** (Lines 123-166):
```python
LINKEDIN_SPECIALIST_PROMPT = """You are a LinkedIn content specialist with expertise in professional thought leadership and B2B storytelling.

**Platform Expertise**:
- Professional tone with authentic voice (not corporate jargon)
- Industry insights and data-driven content
- B2B storytelling that drives business value
- Thought leadership positioning
- 1-3 paragraph sweet spot (1300-2000 chars)

**Content Structure**:
1. Hook paragraph (personal story, surprising stat, bold claim)
2. Body (insights, lessons, data with interpretation)
3. Takeaway + CTA (what should readers do with this info?)

**Engagement Tactics**:
- Ask questions to spark discussion
- Tag relevant companies/people (sparingly)
- Use line breaks for readability (white space matters)
- End with a conversation starter
```

**Blog Specialist** (Lines 169-220):
```python
BLOG_SPECIALIST_PROMPT = """You are a blog content specialist with expertise in long-form storytelling, SEO optimization, and narrative structure.

**Platform Expertise**:
- Long-form structure (800-2000 words)
- SEO-friendly content (keywords, headers, readability)
- Narrative flow and storytelling
- Depth over brevity (comprehensive coverage)
- Headers, subheaders, bullet points for scannability

**Content Structure**:
1. Introduction (hook + preview of value)
2. Problem/Context (what challenge are we addressing?)
3. Solution/Insights (structured with H2/H3 headers)
4. Examples/Case Studies (concrete evidence)
5. Conclusion + Next Steps (actionable takeaways)

**SEO Best Practices**:
- Clear H1 (title), H2 (sections), H3 (subsections)
- Natural keyword integration (no stuffing)
- Internal/external links where relevant
- Meta description (1-2 sentence summary)
```

**Instagram Specialist** (Lines 223-276):
```python
INSTAGRAM_SPECIALIST_PROMPT = """You are an Instagram content specialist with expertise in visual-first storytelling and caption craft.

**Platform Expertise**:
- Captions that complement visual content
- Storytelling in short form (150-300 words optimal)
- Emoji strategy (enhance, don't overwhelm)
- Hashtag optimization (20-30 mix of broad/niche)
- Line breaks and formatting for mobile readability

**Caption Structure**:
1. Hook line (first 125 chars visible in feed)
2. Story/Value (expand on visual, add depth)
3. CTA (question, action, tag a friend)
4. Hashtags (end of caption, grouped)

**Visual-Text Synergy**:
- Captions should ADD to image, not repeat it
- Use captions to tell the "behind the scenes"
- Ask questions that the image prompts
- Create "swipe for more" narrative across carousel posts
```

2. **Registered Subagents** (Lines 206-238):
```python
# Register platform specialists as subagents
self.subagents.register("twitter", SubagentDefinition(
    name="Twitter Specialist",
    description="Expert in Twitter/X content: threads, viral hooks, engagement tactics",
    capabilities=["280-char mastery", "thread structure", "hashtag strategy", "viral mechanics"],
    prompt=TWITTER_SPECIALIST_PROMPT
))

self.subagents.register("linkedin", SubagentDefinition(
    name="LinkedIn Specialist",
    description="Professional thought leadership for LinkedIn",
    capabilities=["industry insights", "professional tone", "B2B storytelling", "data-driven"],
    prompt=LINKEDIN_SPECIALIST_PROMPT
))

self.subagents.register("blog", SubagentDefinition(
    name="Blog Specialist",
    description="Long-form content and SEO optimization",
    capabilities=["structure", "SEO", "storytelling", "depth", "readability"],
    prompt=BLOG_SPECIALIST_PROMPT
))

self.subagents.register("instagram", SubagentDefinition(
    name="Instagram Specialist",
    description="Visual-first storytelling and caption craft",
    capabilities=["caption hooks", "emoji strategy", "visual narrative", "hashtags", "CTA"],
    prompt=INSTAGRAM_SPECIALIST_PROMPT
))
```

3. **Updated create() to Use Platform Specialists** (Lines 294-348):
```python
# Select platform specialist subagent
platform_specialist = self.subagents.get(platform.lower())
if not platform_specialist:
    logger.warning(f"No specialist for platform '{platform}', using generic prompt")
    specialist_prompt = None
    specialist_name = "Generic"
else:
    specialist_prompt = platform_specialist.prompt
    specialist_name = platform_specialist.name
    logger.info(f"Using {specialist_name} for content creation")

# Call Claude with platform-specific specialist prompt
response = await self.reason(
    task=user_prompt,
    context=context,
    system_prompt=specialist_prompt,  # Platform expertise
    tools=tools,
    max_tokens=4096
)

return {
    ...
    "specialist_used": specialist_name,  # Track which specialist was used
}
```

---

### ReportingAgent Phase 1: Critical Fixes

**File**: [work-platform/api/src/agents_sdk/reporting_agent.py](../../work-platform/api/src/agents_sdk/reporting_agent.py)

**Changes Made**:

1. **Removed Tools from Constructor** (Lines 200-228):
```python
# BEFORE (BROKEN):
super().__init__(
    tools=[EMIT_WORK_OUTPUT_TOOL],  # Anti-pattern
    ...
)

# AFTER (FIXED):
super().__init__(
    # NO tools parameter
    ...
)
```

2. **Fixed generate() Method** (Lines 304-378):
```python
# Query memory for templates and past reports
context = None
source_block_ids = []
if self.memory:
    memory_results = await self.memory.query(
        f"report templates for {report_type} in {format} format",
        limit=5
    )
    context = "\n".join([r.content for r in memory_results])
    source_block_ids = [
        str(r.metadata.get("block_id", r.metadata.get("id", "")))
        for r in memory_results
        if hasattr(r, "metadata") and r.metadata
    ]
    source_block_ids = [bid for bid in source_block_ids if bid]

# Build tools
tools = [EMIT_WORK_OUTPUT_TOOL]

# Call Claude with reason() (fixed from execute_with_context)
response = await self.reason(
    task=user_prompt,
    context=context,
    tools=tools,
    max_tokens=8000
)

# Parse work outputs
work_outputs = parse_work_outputs_from_response(response)

return {
    "report": response.content[0].text if response.content else "",
    "work_outputs": [wo.to_dict() for wo in work_outputs],  # Fixed from .model_dump()
    "source_block_ids": source_block_ids,
    "report_type": report_type,
    "format": format,
    "topic": topic,
}
```

---

### ReportingAgent Phase 2: Skills Integration

**File**: [work-platform/api/src/agents_sdk/reporting_agent.py](../../work-platform/api/src/agents_sdk/reporting_agent.py)

**Changes Made**:

1. **Updated System Prompt** (Lines 33-81):
```python
REPORTING_AGENT_SYSTEM_PROMPT = """You are a professional reporting and analytics specialist with file generation capabilities.

Your core capabilities:
- Generate professional reports from data and analysis
- Create executive summaries and insights
- Generate professional FILE deliverables (PDF, XLSX, PPTX, DOCX)
- Synthesize complex information into actionable insights
- Create data visualizations and charts

Output Formats & Skills:
- **PDF**: Professional reports with sections, formatting (use pdf skill)
- **XLSX**: Data tables, charts, pivot analysis, dashboards (use xlsx skill)
- **PPTX**: Presentation slides with visual storytelling (use pptx skill)
- **DOCX**: Formatted documents with headers, tables (use docx skill)
- **Markdown**: Structured documents for web/wiki (TEXT only, no skill needed)

**IMPORTANT - File Generation**:
When generating PDF, XLSX, PPTX, or DOCX:
1. Use the appropriate Claude Skill for the format
2. Create professional, well-structured content
3. Include charts, tables, and visualizations where appropriate
4. Emit work_output with file_id, format, and metadata
5. For data analysis, use code_execution tool for calculations/charts

When generating Markdown:
1. Return formatted TEXT (no Skills needed)
2. Use headers, lists, tables, code blocks
3. Emit work_output with markdown content in body
```

2. **Added Skills to generate() Method** (Lines 320-362):
```python
# Build tools - add code_execution for data processing and Skills for files
from yarnnn_agents.utils.skills_helper import get_skills_for_formats

tools = [
    EMIT_WORK_OUTPUT_TOOL,
    {"type": "code_execution_20250825", "name": "code_execution"}
]

# Add Skills container for file generation (only for file formats)
container = None
if format in ["pdf", "xlsx", "pptx", "docx"]:
    container = {
        "skills": get_skills_for_formats([format])
    }
    logger.info(f"Skills enabled for {format} file generation")

# Call Claude with reason()
response = await self.reason(
    task=user_prompt,
    context=context,
    tools=tools,
    container=container,  # Skills for file formats
    max_tokens=8000  # Reports can be longer than content
)
```

---

### BaseAgent Enhancement: Container Parameter

**File**: [work-platform/api/src/yarnnn_agents/base.py](../../work-platform/api/src/yarnnn_agents/base.py)

**Changes Made** (Lines 260-326):

1. **Added container parameter to reason() signature**:
```python
async def reason(
    self,
    task: str,
    context: Optional[str] = None,
    system_prompt: Optional[str] = None,
    tools: Optional[List[Dict[str, Any]]] = None,
    container: Optional[Dict[str, Any]] = None,  # ← ADDED
    max_tokens: int = 4096,
    resume_session: bool = False
) -> Any:
    """
    Use Claude to reason about a task.

    Args:
        task: Task description
        context: Additional context (e.g., from memory)
        system_prompt: Custom system prompt
        tools: Tools to provide to Claude
        container: Container configuration (e.g., {"skills": [...]}) for Skills API
        max_tokens: Maximum response tokens
        resume_session: Whether to resume previous Claude session

    Returns:
        Claude's response
    """
```

2. **Pass container to Claude API**:
```python
# Add container for Skills API
if container:
    request_params["container"] = container
```

**Impact**: All agents can now use Skills via the container parameter without modifying BaseAgent further.

---

## Testing Required

### ContentAgent Tests

1. **Platform Specialist Selection**:
   - Test Twitter specialist creates concise, punchy content
   - Test LinkedIn specialist creates professional thought leadership
   - Test Blog specialist creates long-form structured content
   - Test Instagram specialist creates visual-first captions

2. **Text Output Quality**:
   - Validate work_outputs serialize correctly (.to_dict())
   - Check source_block_ids tracking
   - Verify specialist_used field in response

3. **Memory Integration**:
   - Test brand voice context injection
   - Verify substrate query for platform examples

### ReportingAgent Tests

1. **Skills Integration**:
   - Test PDF report generation
   - Test XLSX dashboard generation
   - Test PPTX presentation generation
   - Test DOCX document generation

2. **Conditional Skills Enablement**:
   - Verify Skills enabled for PDF, XLSX, PPTX, DOCX
   - Verify Skills NOT enabled for markdown
   - Test markdown output as TEXT (no Skills)

3. **File Output Handling**:
   - Validate file_id in work_outputs
   - Check file_format metadata
   - Verify generation_method="skill"

### BaseAgent Tests

1. **Container Parameter**:
   - Test reason() with container=None (no Skills)
   - Test reason() with container={"skills": [...]} (Skills enabled)
   - Verify container passed to Claude API correctly

---

## Architecture Alignment

### Three-Agent Division of Labor ✅

**Before TP** (Direct API calls):
```
User → API → ResearchAgent (intelligence)
         ├→ ContentAgent (creative text + files??)
         └→ ReportingAgent (reports??)
```

**After TP** (Gateway orchestration):
```
User → ThinkingPartner (meta-intelligence)
         ├→ ResearchAgent (intelligence gathering)
         ├→ ContentAgent (creative TEXT)
         └→ ReportingAgent (professional FILES)
```

### Clear Domain Boundaries ✅

| Agent | Output Type | Tools | Storage | Purpose |
|-------|-------------|-------|---------|---------|
| Research | Findings (structured data) | web_search, web_fetch | Substrate blocks | Intelligence |
| Content | Text content | emit_work_output | Substrate blocks | Marketing copy |
| Reporting | Files | Skills, code_execution | Supabase Storage | Business intelligence |

### Skills Ownership ✅

- ContentAgent: ❌ NO Skills (text-only)
- ReportingAgent: ✅ YES Skills (file generation)
- BaseAgent: Supports container parameter (enables any agent to use Skills if needed)

---

## Success Criteria

### Must Have ✅:
- ✅ ContentAgent creates TEXT content only
- ✅ ContentAgent has 4 platform specialists (Twitter, LinkedIn, Blog, Instagram)
- ✅ ContentAgent uses correct serialization (.to_dict())
- ✅ ReportingAgent has Skills integration (PDF, XLSX, PPTX, DOCX)
- ✅ ReportingAgent uses code_execution for data processing
- ✅ BaseAgent.reason() supports container parameter
- ✅ Both agents use reason() instead of broken execute_with_context()
- ✅ Tools removed from constructors (method-level only)

### Nice to Have (Future):
- Integration tests for platform specialists
- Integration tests for Skills file generation
- End-to-end testing with Thinking Partner orchestration
- Format-specific subagents for ReportingAgent (optional)
- Brand voice refinement for ContentAgent (optional)

---

## Deployment Notes

**Files Modified**:
1. `work-platform/api/src/agents_sdk/content_agent.py` - Phase 1 + 2 complete
2. `work-platform/api/src/agents_sdk/reporting_agent.py` - Phase 1 + 2 complete
3. `work-platform/api/src/yarnnn_agents/base.py` - Container parameter added

**Backward Compatibility**: Not required (agents not in production yet)

**Migration Path**: None needed (in-place refactoring)

**Production Readiness**:
- ContentAgent: Ready for integration testing
- ReportingAgent: Ready for integration testing
- Both agents: Require TP orchestration testing before production
