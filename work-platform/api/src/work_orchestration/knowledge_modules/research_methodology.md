# YARNNN Research Methodology

## Core Principle: Substrate-First Research

**ALWAYS query substrate before conducting new research.**

Substrate is YARNNN's governed knowledge base. It contains:
- Context blocks (text knowledge with semantic types)
- Reference assets (screenshots, PDFs, brand samples)
- Agent configurations (user preferences and watchlists)
- Past work outputs (approved findings and insights)

## Step-by-Step Research Process

### 1. Query Existing Knowledge

**Before any research, query substrate:**

```
contexts = await memory.query(topic, limit=10)
```

**Extract what we ALREADY know:**
- Read through context blocks
- Note block IDs for provenance tracking
- Identify gaps between task requirements and existing knowledge

**Why this matters:**
- Avoids redundant research (saves time and API costs)
- Builds on existing knowledge (accumulation over time)
- Tracks provenance (where knowledge comes from)

---

### 2. Identify Knowledge Gaps

**Compare task requirements vs existing knowledge:**

Ask yourself:
- What specific questions does the task ask?
- What information do we already have in substrate?
- What's MISSING that we need to find?

**List gaps explicitly:**
```
Gaps to fill:
1. Competitor X's latest pricing (substrate has data from 2 months ago)
2. Market trend analysis (no data in substrate)
3. Strategic implications (need synthesis)
```

**Prioritize gaps by importance:**
- Critical for task completion
- Nice-to-have context
- Future research (defer)

---

### 3. Conduct Targeted Research

**Focus ONLY on filling identified gaps:**

**For each gap:**
1. Use appropriate tools (web_search, web_fetch)
2. Cite sources for ALL findings
3. Note confidence level based on source quality
4. Avoid researching what we already know

**Quality over quantity:**
- 5 high-quality cited findings > 20 unsourced claims
- Prefer authoritative sources (official sites, press releases)
- Cross-reference when possible

---

### 4. Structured Output Creation

**CRITICAL: Use emit_work_output for EVERY finding.**

**Tool-use pattern:**
```
For each significant finding:
  emit_work_output(
    output_type="finding",  # or "insight", "recommendation"
    title="Brief summary (max 200 chars)",
    body={
      "summary": "1-2 sentence overview",
      "details": "Longer explanation with evidence",
      "evidence": ["Source 1", "Source 2"],
      "confidence_factors": {
        "increases": ["Official source", "Recent data"],
        "decreases": ["Single source only"]
      }
    },
    confidence=0.85,  # Based on evidence quality
    source_block_ids=[block_ids_from_substrate]  # Provenance!
  )
```

**Output types:**
- **finding**: Factual discovery (competitor has 45% market share)
- **insight**: Pattern identified (pricing trend across industry)
- **recommendation**: Actionable suggestion (focus on differentiation)

**Why structured outputs matter:**
- User reviews before acceptance (supervision workflow)
- Machine-parseable (can be indexed, queried)
- Provenance tracked (source_block_ids link to origins)
- Quality enforced (confidence scores, evidence required)

---

### 5. Synthesis and Insights

**Connect new findings to existing knowledge:**

After emitting individual findings:
1. Review ALL findings (new + substrate)
2. Identify patterns across findings
3. Assess significance and urgency
4. Generate actionable insights

**Synthesis outputs:**
```
emit_work_output(
  output_type="insight",
  title="Pattern: AI agent market consolidating",
  body={
    "summary": "Analysis of 5 competitor moves shows market consolidation trend",
    "details": "Evidence from [findings 1-5] indicates...",
    "implications": "This means we should...",
    "supporting_findings": [finding_ids]
  },
  confidence=0.9
)
```

**Then recommendations:**
```
emit_work_output(
  output_type="recommendation",
  title="Recommendation: Accelerate differentiation strategy",
  body={
    "summary": "Based on consolidation trend, recommend...",
    "rationale": "Synthesis of insights shows...",
    "action_items": ["1. ...", "2. ...", "3. ..."],
    "priority": "high",
    "timeline": "next 2 weeks"
  },
  confidence=0.85
)
```

---

## Quality Standards

### Accuracy Over Speed
- Verify facts before emitting
- Use authoritative sources
- Cross-reference when uncertain
- Mark low-confidence findings appropriately

### Structured Over Narrative
- Use emit_work_output tool (not free text)
- Follow schema requirements
- Include all required fields
- Provide evidence for claims

### Actionable Over Interesting
- Focus on what user can DO with this information
- Prioritize recommendations by impact
- Include action items with timelines
- Connect insights to decisions

### Forward-Looking Over Historical
- What does this mean for the FUTURE?
- What should we DO about it?
- What's the TREND direction?
- What's the STRATEGIC implication?

---

## Common Mistakes to Avoid

❌ **Don't skip substrate query**
- Always check existing knowledge first
- Avoids duplicate research

❌ **Don't emit unverified information**
- Back every claim with evidence
- Calibrate confidence to source quality

❌ **Don't create duplicate outputs**
- Check if finding already exists in substrate
- If exists, cite existing block_id instead

❌ **Don't use free-form text**
- Always use emit_work_output tool
- Forces structure and quality

❌ **Don't ignore provenance**
- Always include source_block_ids
- Tracks where knowledge comes from

---

## Integration with Agent Config

When agent_config is available in context metadata, use it to focus research:

```python
# Extract config from context
config = extract_metadata_from_contexts(contexts).get('agent_config', {})

# Use watchlist to prioritize
watchlist = config.get('watchlist', {})
topics = watchlist.get('topics', [])
competitors = watchlist.get('competitors', [])

# Focus research on configured items
if competitors:
    # Prioritize these competitors in research
```

**Config tells you WHAT to focus on (user preferences)**
**Methodology tells you HOW to research (quality standards)**

Together they enable personalized, high-quality research.
