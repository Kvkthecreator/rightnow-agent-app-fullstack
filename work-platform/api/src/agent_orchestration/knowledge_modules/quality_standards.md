# YARNNN Quality Standards

## Confidence Scoring

Confidence scores (0.0-1.0) MUST accurately reflect evidence quality.

### Confidence Scale

| Score Range | Evidence Quality | When to Use |
|-------------|-----------------|-------------|
| **0.9-1.0** | Exceptional | Multiple authoritative sources, verified facts, official data |
| **0.7-0.9** | Strong | Single authoritative source, strong evidence, recent data |
| **0.5-0.7** | Moderate | Reasonable inference, partial evidence, credible sources |
| **0.3-0.5** | Weak | Educated guess, limited evidence, dated information |
| **0.0-0.3** | Very Weak | Speculation, minimal evidence, unverified claims |

### Examples

**0.95 Confidence:**
```
Finding: "Competitor X raised $50M Series B on Nov 15, 2025"
Evidence:
- Official press release on company website
- TechCrunch article with CEO quote
- SEC filing confirmation
```

**0.8 Confidence:**
```
Finding: "Competitor Y has 45% market share in segment Z"
Evidence:
- Gartner report (Q3 2025)
- Single authoritative source
- Recent but not cross-verified
```

**0.6 Confidence:**
```
Insight: "Market is trending toward consolidation"
Evidence:
- 3 recent acquisitions observed
- Analyst commentary (not official data)
- Pattern emerging but not definitive
```

**0.4 Confidence:**
```
Finding: "Competitor may launch product in Q1"
Evidence:
- Job posting hints at new product
- Reddit speculation
- No official confirmation
```

---

## Evidence Requirements

### Every Finding MUST Include:

1. **Source Citation**
   - URL, block_id, or reference
   - Date accessed/created
   - Author/publisher if available

2. **Evidence Summary**
   - What specifically supports this claim?
   - Quote or data excerpt
   - Context around evidence

3. **Confidence Factors**
   - What INCREASES confidence? (authoritative source, recent, verified)
   - What DECREASES confidence? (single source, dated, unverified)

### Example Work Output Structure:

```json
{
  "output_type": "finding",
  "title": "Competitor X pricing: $99/month for Pro plan",
  "body": {
    "summary": "Competitor X charges $99/month for their Pro plan as of Nov 2025",
    "details": "Verified on their official pricing page. Includes 10 users, unlimited storage, priority support. Price increased from $79/month in August 2025.",
    "evidence": [
      "https://competitorx.com/pricing (accessed Nov 18, 2025)",
      "Wayback Machine snapshot from Aug 2025 showing $79/month"
    ],
    "confidence_factors": {
      "increases": [
        "Official pricing page (primary source)",
        "Recent data (current as of today)",
        "Cross-verified with historical data"
      ],
      "decreases": [
        "Price may vary by geography (US pricing only)"
      ]
    }
  },
  "confidence": 0.95,
  "source_block_ids": ["block_123"]  // If substrate had related info
}
```

---

## Output Type Selection

Use the correct output_type for the content:

### finding
**When to use:** Factual discovery, data point, event, quote

**Examples:**
- "Competitor launched new feature on Nov 15"
- "Market size is $2.5B (Gartner 2025)"
- "CEO stated 'We're focusing on enterprise' in interview"

**Characteristics:**
- Objective facts
- Can be verified
- Not interpretation

---

### insight
**When to use:** Pattern identified, trend analysis, synthesis

**Examples:**
- "Pricing trends show 20% increase across industry in 2025"
- "3 major competitors pivoted to enterprise in past 6 months"
- "Market consolidation accelerating (5 acquisitions in Q4)"

**Characteristics:**
- Derived from multiple findings
- Interpretation involved
- Pattern recognition

**MUST include:**
- Supporting findings (what led to this insight?)
- Synthesis reasoning (how did you connect the dots?)

---

### recommendation
**When to use:** Actionable suggestion, strategic advice

**Examples:**
- "Recommend accelerating enterprise features"
- "Suggest monitoring Competitor X's pricing changes weekly"
- "Propose differentiation strategy around support quality"

**Characteristics:**
- Forward-looking
- Action-oriented
- Strategic implications

**MUST include:**
- Rationale (why this recommendation?)
- Action items (what specifically to do?)
- Priority (high/medium/low)
- Timeline (when to act?)

---

### draft_content
**When to use:** Content creation (blog posts, emails, social posts)

**Characteristics:**
- Creative output
- User will edit/refine
- Requires brand voice consistency

---

### report_section
**When to use:** Analysis sections for reports, decks

**Characteristics:**
- Structured analysis
- Data visualization suggestions
- Executive summary style

---

### data_analysis
**When to use:** Statistical findings, quantitative analysis

**Characteristics:**
- Numerical data
- Statistical methods used
- Visualization-ready format

---

## Quality Checklist

Before emitting ANY work output, verify:

### ✅ Evidence
- [ ] All claims backed by sources
- [ ] Sources cited with URLs/block_ids
- [ ] Evidence summarized in body.evidence

### ✅ Confidence
- [ ] Score matches evidence quality (use table above)
- [ ] Confidence factors explained
- [ ] Uncertainties acknowledged

### ✅ Completeness
- [ ] All required fields filled
- [ ] Title is clear and concise (<200 chars)
- [ ] Summary is 1-2 sentences
- [ ] Details provide context

### ✅ Provenance
- [ ] source_block_ids included (if applicable)
- [ ] Links new finding to existing knowledge
- [ ] Tracks knowledge lineage

### ✅ Accuracy
- [ ] Facts verified
- [ ] No speculation presented as fact
- [ ] Uncertainties marked with low confidence

### ✅ Actionability
- [ ] User can DO something with this
- [ ] Next steps clear (for recommendations)
- [ ] Priority and timeline specified (for recommendations)

---

## Anti-Patterns to Avoid

### ❌ Overconfident Claims
**Bad:**
```
confidence: 0.95
evidence: ["Someone on Reddit said..."]
```

**Good:**
```
confidence: 0.3
evidence: ["Unverified Reddit comment - speculation only"]
confidence_factors: {decreases: ["Unverified source", "Speculation"]}
```

---

### ❌ Unsourced Findings
**Bad:**
```
body: {
  summary: "Competitor has 10,000 users"
}
// No evidence field
```

**Good:**
```
body: {
  summary: "Competitor has 10,000 users",
  evidence: [
    "CEO mentioned in TechCrunch interview (Nov 2025)",
    "https://techcrunch.com/..."
  ]
}
```

---

### ❌ Wrong Output Type
**Bad:**
```
output_type: "finding"
title: "We should focus on enterprise"  // This is a recommendation!
```

**Good:**
```
output_type: "recommendation"
title: "Recommend focusing on enterprise segment"
body: {
  rationale: "3 competitors successful with enterprise pivot",
  action_items: ["1. ...", "2. ..."]
}
```

---

### ❌ Missing Provenance
**Bad:**
```
// New finding, but no link to substrate knowledge
source_block_ids: []
```

**Good:**
```
// Links to substrate blocks that provided context
source_block_ids: ["block_123", "block_456"]
// Tracks: "I found this BECAUSE of existing knowledge in blocks 123, 456"
```

---

## Relationship to Research Methodology

**Quality Standards** define WHAT quality means.
**Research Methodology** defines HOW to achieve quality.

Together they ensure:
- Accurate findings (methodology: verify sources)
- Appropriate confidence (standards: calibrate to evidence)
- Structured outputs (methodology: use tools)
- Provenance tracking (standards: include block_ids)

Use BOTH to produce high-quality, trustworthy work outputs.
