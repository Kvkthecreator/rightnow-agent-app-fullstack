# YARNNN Substrate Patterns

## Overview: What is Substrate?

**Substrate** is YARNNN's governed knowledge base - a shared context layer that:
- Grows richer with every agent run
- Persists across sessions
- Enables knowledge accumulation (not starting from scratch each time)
- Tracks provenance (where knowledge comes from)

**Substrate Contents:**
- **Context Blocks**: Text knowledge with semantic types
- **Reference Assets**: Files (screenshots, PDFs, brand samples)
- **Work Outputs**: Agent deliverables pending review
- **Agent Configurations**: User preferences and settings

---

## Available Tools

### 1. query_substrate (via memory.query)

**Purpose**: Search substrate for existing knowledge

**When to use:**
- BEFORE conducting new research (always query first!)
- To find related context for current task
- To check if information already exists
- To get provenance for new findings

**Interface:**
```python
contexts = await memory.query(
    query="Search query or topic",
    limit=10  # Max results to return
)
```

**Returns:** List of Context objects
```python
class Context:
    content: str  # The actual content
    metadata: dict  # Additional info
```

**Metadata includes:**
- `block_id`: Unique identifier for provenance
- `semantic_type`: classification, definition, insight, etc.
- `created_at`: When block was created
- `basket_id`: Which basket it belongs to
- `reference_assets`: Associated files (if any)
- `agent_config`: Agent configurations (if injected)

**Example Usage:**
```python
# Query substrate
contexts = await memory.query("competitor pricing", limit=10)

# Extract content
context_str = "\n".join([c.content for c in contexts])

# Extract block IDs for provenance
source_block_ids = [
    c.metadata.get("block_id")
    for c in contexts
    if c.metadata.get("block_id")
]

# Check for reference assets
for context in contexts:
    if 'reference_assets' in context.metadata:
        assets = context.metadata['reference_assets']
        # Use assets for additional context

# Check for agent config
from yarnnn_agents.interfaces import extract_metadata_from_contexts
metadata = extract_metadata_from_contexts(contexts)
config = metadata.get('agent_config', {})
```

---

### 2. emit_work_output

**Purpose**: Create structured deliverables for user review

**When to use:**
- EVERY time you discover a significant finding
- When you identify a pattern (insight)
- When you have a recommendation

**Interface:**
```python
emit_work_output(
    output_type="finding",  # Required: finding|insight|recommendation|etc.
    title="Short summary",   # Required: Max 200 chars
    body={                  # Required: Structured content
        "summary": "1-2 sentence overview",
        "details": "Longer explanation",
        "evidence": ["Source 1", "Source 2"],
        "confidence_factors": {
            "increases": ["Factor 1", "Factor 2"],
            "decreases": ["Factor 3"]
        }
    },
    confidence=0.85,        # Required: 0.0-1.0
    source_block_ids=[...]  # Optional but recommended
)
```

**Output Types:**
| Type | Use For | Example |
|------|---------|---------|
| `finding` | Factual discovery | "Competitor X raised $50M Series B" |
| `insight` | Pattern identified | "Market consolidating - 5 acquisitions in Q4" |
| `recommendation` | Actionable suggestion | "Recommend focusing on enterprise segment" |
| `draft_content` | Content creation | Blog post draft, email template |
| `report_section` | Report/deck content | Analysis section for board deck |
| `data_analysis` | Statistical findings | Market size analysis with charts |

**Body Schema (varies by type):**

**For findings:**
```json
{
  "summary": "Brief overview",
  "details": "Full explanation with context",
  "evidence": ["Source URLs or citations"],
  "confidence_factors": {
    "increases": ["What makes this confident"],
    "decreases": ["What creates uncertainty"]
  }
}
```

**For insights:**
```json
{
  "summary": "Pattern identified",
  "details": "Analysis of pattern",
  "supporting_findings": ["Finding IDs that led to this"],
  "implications": "What does this mean?"
}
```

**For recommendations:**
```json
{
  "summary": "Recommendation in 1-2 sentences",
  "rationale": "Why this recommendation?",
  "action_items": ["1. Specific action", "2. Another action"],
  "priority": "high",
  "timeline": "next 2 weeks"
}
```

---

### 3. get_reference_assets (via memory context metadata)

**Purpose**: Access reference files for context

**When to use:**
- When brand voice consistency needed (style guides)
- When visual context helps (competitor screenshots)
- When analyzing documents (PDFs, reports)

**How it works:**
Reference assets are injected into context metadata automatically when available.

**Access Pattern:**
```python
contexts = await memory.query("brand voice", limit=5)

for context in contexts:
    # Check if this context has associated assets
    if 'reference_assets' in context.metadata:
        assets = context.metadata['reference_assets']

        for asset in assets:
            asset_type = asset.get('asset_type')
            signed_url = asset.get('signed_url')
            filename = asset.get('filename')

            if asset_type == 'brand_guide':
                # Use brand guide for tone consistency
                pass
            elif asset_type == 'screenshot':
                # Reference visual for competitive analysis
                pass
            elif asset_type == 'document':
                # Analyze PDF/doc content
                pass
```

**Asset Types:**
- `brand_guide`: Style guides, brand books
- `screenshot`: Visual references, UI examples
- `document`: PDFs, reports, research papers
- `template`: Content templates, email templates
- `media`: Images, videos

---

## Best Practices

### Provenance Tracking

**ALWAYS include source_block_ids in work outputs.**

```python
# Query substrate
contexts = await memory.query(topic)

# Extract block IDs
source_block_ids = [
    c.metadata.get('block_id')
    for c in contexts
    if c.metadata.get('block_id')
]

# Use in work output
emit_work_output(
    output_type="finding",
    title="...",
    body={...},
    source_block_ids=source_block_ids  # ← Tracks lineage!
)
```

**Why this matters:**
- Tracks where knowledge comes from
- Enables "how did we learn this?" queries
- Supports knowledge graph construction
- Facilitates governance (what if source was wrong?)

---

### Enhanced Context Usage

Memory queries return metadata with:
1. **reference_assets**: Files to reference
2. **agent_config**: User-specific preferences

**Use both for personalized, context-rich research:**

```python
# Query substrate
contexts = await memory.query("market research")

# Extract config
from yarnnn_agents.interfaces import extract_metadata_from_contexts
metadata = extract_metadata_from_contexts(contexts)
config = metadata.get('agent_config', {})

# Use config to focus research
if config:
    watchlist = config.get('watchlist', {})
    topics = watchlist.get('topics', [])
    competitors = watchlist.get('competitors', [])

    # Prioritize user's watchlist items
    if competitors:
        for competitor in competitors:
            # Focus on these specific competitors
            pass

# Check for reference assets
for context in contexts:
    if 'reference_assets' in context.metadata:
        # Use assets for richer context
        pass
```

---

### Query Patterns

**Broad initial query:**
```python
# Get overview of topic
contexts = await memory.query("AI agents market", limit=10)
```

**Specific follow-up queries:**
```python
# Drill into specifics
pricing_contexts = await memory.query("AI agent pricing models", limit=5)
feature_contexts = await memory.query("AI agent key features", limit=5)
```

**Check for duplicates:**
```python
# Before emitting finding, check if it exists
existing = await memory.query("Competitor X pricing $99", limit=3)

if existing and any("$99" in c.content for c in existing):
    # Already in substrate - cite existing block instead
    existing_block_id = existing[0].metadata.get('block_id')
    # Reference existing knowledge rather than duplicate
else:
    # New information - emit as finding
    emit_work_output(...)
```

---

## Substrate Lifecycle

### Where Work Outputs Go

```
Agent emits work_output
    ↓
work_outputs table (substrate-API)
    ↓
User reviews (supervision workflow)
    ↓
    ├─ Approved → May become blocks (future)
    ├─ Rejected → Archived
    └─ Revision requested → Agent updates
```

**Current State (Phase 4):**
- Work outputs stored in `work_outputs` table
- User reviews via supervision workflow
- Approved outputs do NOT automatically become blocks yet
- Substrate absorption intentionally deferred

**Why separation matters:**
- User maintains control (reviews before absorption)
- Quality gate (prevents bad data in substrate)
- Governance preserved (substrate stays clean)

---

## Common Patterns

### Pattern 1: Research + Synthesis

```python
# 1. Query existing knowledge
contexts = await memory.query(topic)
context_str = "\n".join([c.content for c in contexts])
source_block_ids = [c.metadata.get('block_id') for c in contexts if c.metadata.get('block_id')]

# 2. Identify gaps
# (what's missing from contexts vs task requirements?)

# 3. Research gaps
# (use web_search, web_fetch)

# 4. Emit findings
for finding in new_findings:
    emit_work_output(
        output_type="finding",
        title=finding.title,
        body=finding.body,
        confidence=finding.confidence,
        source_block_ids=source_block_ids  # Links to substrate context
    )

# 5. Synthesize insights
emit_work_output(
    output_type="insight",
    title="Pattern: ...",
    body={
        "summary": "Synthesis of findings reveals...",
        "supporting_findings": [finding_ids]
    },
    confidence=0.9
)
```

---

### Pattern 2: Config-Driven Focus

```python
# Extract config from context
metadata = extract_metadata_from_contexts(contexts)
config = metadata.get('agent_config', {})

# Use config to prioritize
watchlist = config.get('watchlist', {})
competitors = watchlist.get('competitors', [])
alert_threshold = config.get('alert_rules', {}).get('confidence_threshold', 0.7)

# Focus research on configured items
for competitor in competitors:
    # Research THIS competitor specifically
    findings = research_competitor(competitor)

    # Emit findings above user's threshold
    for finding in findings:
        if finding.confidence >= alert_threshold:
            emit_work_output(...)
```

---

### Pattern 3: Asset-Enhanced Context

```python
# Query for contexts
contexts = await memory.query("brand voice")

# Check for brand assets
brand_assets = []
for context in contexts:
    if 'reference_assets' in context.metadata:
        assets = context.metadata['reference_assets']
        brand_assets.extend([a for a in assets if a.get('asset_type') == 'brand_guide'])

# Use assets to guide content creation
if brand_assets:
    # Reference brand guide when creating content
    emit_work_output(
        output_type="draft_content",
        title="Blog post: ...",
        body={
            "content": "...",  # Following brand voice from assets
            "tone": "Based on brand guide: [asset filename]"
        },
        source_block_ids=source_block_ids  # Provenance to brand context
    )
```

---

## Anti-Patterns to Avoid

### ❌ Not Querying Substrate First
```python
# Bad: Research immediately
findings = web_search(topic)
```

```python
# Good: Query substrate first
contexts = await memory.query(topic)
# Then identify gaps
# Then research only gaps
```

---

### ❌ Ignoring Provenance
```python
# Bad: No source tracking
emit_work_output(
    output_type="finding",
    title="...",
    body={...},
    source_block_ids=[]  # ❌ Lost provenance
)
```

```python
# Good: Track sources
emit_work_output(
    output_type="finding",
    title="...",
    body={...},
    source_block_ids=source_block_ids  # ✅ Tracks lineage
)
```

---

### ❌ Ignoring Agent Config
```python
# Bad: Generic research
contexts = await memory.query(topic)
# Do research on everything
```

```python
# Good: Config-driven focus
contexts = await memory.query(topic)
config = extract_metadata_from_contexts(contexts).get('agent_config', {})
competitors = config.get('watchlist', {}).get('competitors', [])
# Focus on user's watchlist
```

---

## Summary

**Substrate Tools Enable:**
- Knowledge accumulation (not starting from scratch)
- Provenance tracking (where did we learn this?)
- Context-rich research (reference assets + config)
- Quality control (supervision before absorption)

**Use These Patterns:**
1. Always query substrate first
2. Track provenance via source_block_ids
3. Use config to personalize research
4. Leverage reference assets for richer context
5. Emit structured outputs for everything significant

**Substrate + Methodology + Quality Standards = High-Quality, Traceable, Personalized Research**
