# Agent Work Output Quality Optimization Framework

**Date**: 2025-11-17
**Status**: Active Testing Phase
**Purpose**: Guide iterative optimization of agent work outputs for maximum user value

---

## Core Hypothesis

Agent work output quality depends on three interdependent layers:

1. **Configuration Quality** - How well the agent's parameters match user intent
2. **Context Quality** - How relevant the substrate blocks and reference assets are
3. **Execution Quality** - How effectively the agent synthesizes config + context into insights

**Testing Goal**: Validate and optimize each layer to produce genuinely valuable work outputs (not just technically correct ones).

---

## Quality Optimization Process

### Phase 1: Configuration Design

**What to optimize:**
- Parameter specificity (vague "ai_agents" vs specific "Claude Code competitive positioning")
- Source reliability weighting (Gartner > random blog)
- Output format expectations (bullet points vs narrative vs structured data)

**Questions to answer:**
- What config parameters actually improve output relevance?
- How granular should topic/competitor specifications be?
- What's the right balance between specificity and flexibility?

### Phase 2: Context Injection

**What to optimize:**
- Which substrate blocks provide useful context? (semantic_type filtering)
- How much context is too much? (context window utilization)
- Do reference assets (PDFs, docs) improve output quality?

**Questions to answer:**
- Does more context = better outputs, or is there diminishing returns?
- Which block states matter? (ACCEPTED vs LOCKED vs PROPOSED)
- How does project history affect current research quality?

### Phase 3: Agent Execution Logic

**What to optimize:**
- Prompt engineering for research synthesis
- Web search strategy (when to search, what to search)
- Confidence assessment methodology
- Source attribution and verification

**Questions to answer:**
- How should the agent prioritize multiple topics/competitors?
- What makes a "finding" vs just "information"?
- How to avoid hallucination while encouraging insight generation?

### Phase 4: Output Presentation

**What to optimize:**
- Structured vs freeform findings
- Metadata richness (sources, confidence, domain, timestamps)
- Actionability of insights

**Questions to answer:**
- What output format is most useful for user review?
- How much metadata aids vs clutters the review process?
- Should outputs be immediately actionable or require user interpretation?

---

## Research Agent Specific Considerations

### Configuration Parameters

```json
{
  "research": {
    "monitoring_domains": ["ai_agents", "market_trends"],
    "monitoring_frequency": "daily",
    "signal_threshold": 0.7,
    "synthesis_mode": "insights",

    // Quality-critical parameters
    "topics": [
      "AI agent market trends Q4 2024",
      "Claude Code competitive positioning",
      "Autonomous agent safety concerns"
    ],
    "competitors": [
      {
        "name": "AgentForce",
        "focus": "enterprise CRM automation",
        "priority": "high"
      },
      {
        "name": "AutoGPT",
        "focus": "open-source autonomous agents",
        "priority": "medium"
      }
    ],
    "data_sources": {
      "high_reliability": ["gartner.com", "mckinsey.com", "anthropic.com"],
      "medium_reliability": ["techcrunch.com", "venturebeat.com"],
      "monitor_only": ["twitter.com", "reddit.com/r/MachineLearning"]
    },
    "output_preferences": {
      "finding_type": "insight",  // vs "fact" or "observation"
      "include_actionable_recommendations": true,
      "max_findings_per_run": 10,
      "min_confidence_to_include": 0.6
    }
  }
}
```

### Expected Output Structure

```json
{
  "output_type": "research_finding",
  "content": {
    "text": "Salesforce's AgentForce is targeting mid-market CRM automation, leaving enterprise segment underserved. This represents opportunity for differentiated positioning.",
    "sources": [
      {
        "url": "https://techcrunch.com/...",
        "reliability": "medium",
        "accessed_at": "2025-11-17T10:00:00Z"
      }
    ],
    "finding_type": "market_opportunity",
    "is_actionable": true,
    "recommended_actions": [
      "Research enterprise CRM pain points",
      "Compare AgentForce pricing for mid-market"
    ]
  },
  "agent_confidence": 0.82,
  "agent_reasoning": "Single source (TechCrunch) but aligns with previous competitor analysis. Confidence reduced from 0.9 due to lack of primary source verification.",
  "status": "pending"
}
```

---

## Quality Metrics

### Quantitative
- **Relevance Score**: % of findings marked "useful" by user
- **Actionability Rate**: % of findings with clear next steps
- **Source Verification**: % of findings with verifiable sources
- **False Positive Rate**: % of findings rejected as inaccurate/irrelevant

### Qualitative
- Does the insight tell user something they didn't know?
- Would user have found this through manual research?
- Does the finding change user's understanding or decision-making?
- Is the confidence assessment accurate (not over/under confident)?

---

## Iteration Cycle

```
1. Configure agent parameters
   ↓
2. Execute work session
   ↓
3. Review work_outputs in frontend
   ↓
4. Assess: What's valuable? What's noise?
   ↓
5. Adjust: Config? Context selection? Prompt engineering?
   ↓
6. Re-execute and compare
   ↓
7. Document learnings
```

---

## Anti-Patterns to Avoid

1. **Over-optimization of infrastructure** without testing actual output quality
2. **Confidence inflation** - assigning high confidence to weak findings
3. **Source count as proxy for quality** - 5 bad sources ≠ 1 good source
4. **Generic outputs** - findings that could apply to any project
5. **Information without insight** - reporting facts without synthesis

---

## Success Criteria for This Testing Phase

### Minimum Viable Quality
- [ ] Agent uses actual config parameters (topics, competitors, sources)
- [ ] Agent calls Claude API to synthesize research
- [ ] Agent returns structured findings with real sources
- [ ] User can review outputs in frontend
- [ ] At least 1 finding per run is genuinely useful

### Target Quality
- [ ] 60%+ of findings marked useful by user
- [ ] Findings include actionable recommendations
- [ ] Confidence scores correlate with actual finding quality
- [ ] Agent distinguishes between high/low reliability sources
- [ ] Context from substrate improves output relevance

### Stretch Quality
- [ ] Agent identifies novel insights user hadn't considered
- [ ] Cross-references multiple sources for verification
- [ ] Adapts synthesis style based on output_preferences
- [ ] Provides competitive intelligence not available through simple search

---

## Documentation Requirements

After each test iteration, document:

1. **Configuration used** (full JSON)
2. **Substrate context provided** (block count, semantic types)
3. **Raw agent output** (before any formatting)
4. **User assessment** (what was useful, what was noise)
5. **Hypothesis for improvement** (what to change and why)

This creates a reusable playbook for optimizing future agent types (content, reporting).

---

## Substrate Recursion (Intentionally Deferred)

**NOT in scope for current testing:**
- work_outputs → raw_dump → P0-P4 processing
- Auto-populating substrate from agent findings
- Governance implications of agent-generated blocks

**Why deferred:** Must validate output quality BEFORE allowing agents to mutate substrate. Low-quality outputs contaminating the substrate would compound errors.

**Future consideration:** Once output quality is validated, define clear bridge criteria:
- Only approved outputs can become proposals
- Human review required for substrate mutations
- Separate governance track for agent-generated content

---

## Next Steps

1. **Populate research agent config** with realistic parameters for your project
2. **Implement Claude API integration** in ResearchAgent.execute()
3. **Add web search capability** (if available in Claude)
4. **Build frontend viewer** for work_outputs assessment
5. **Execute first real test** and document findings
6. **Iterate based on quality assessment**

---

**End of Quality Optimization Framework**
