# YARNNN Governance Canon v2.0.0

## Sacred Principles

**Governance Sacred Principle #1**: All substrate mutations flow through governed proposals  
**Governance Sacred Principle #2**: Proposals are intent, not truth - truth changes only on approval  
**Governance Sacred Principle #3**: Agent validation is mandatory for all proposals regardless of origin  

## The Proposal Model

### What is a Proposal?

A **proposal** is a governed suggestion to change the substrate, packaged with provenance and agent validation. It's the atomic unit that moves through review.

```
Proposal = Changeset + Validation + Governance State
```

### Proposal Anatomy

```typescript
interface Proposal {
  // Identity
  id: uuid
  proposal_kind: 'Extraction' | 'Edit' | 'Merge' | 'Attachment' | 'ScopePromotion' | 'Deprecation'
  
  // Foundation  
  basis: 'HEAD' | snapshot_id     // What state authored against
  origin: 'agent' | 'human'       // Source of intent
  provenance: dump_ids[]          // Raw material references
  
  // Operations (atomic changesets)
  ops: Operation[]
  
  // Agent Intelligence (mandatory)
  validator_report: {
    confidence: number
    dupes: ProposalConflict[]
    ontology_hits: string[]
    suggested_merges: uuid[]
    warnings: string[]
    impact_summary: string
  }
  
  // Governance
  status: ProposalState
  review: ReviewDecision?
  effects_preview: CascadePreview  // Read-only impact analysis
}
```

### Proposal Operations

**Atomic Operations** (can be bundled):
- `CreateBlock { text, semantic_type, confidence }`
- `CreateContextItem { label, synonyms[], confidence }`
- `AttachContextItem { context_item_id, target: Block|Doc|Basket }`
- `MergeContextItems { from_ids[], canonical_id }`
- `EditBlock { block_id, patch }`
- `PromoteScope { block_id, from: LOCAL, to: WORKSPACE }`

## Dual Ingestion → Unified Governance

### Sacred Write Path (Preserved)
```
raw_dumps → P1 Agent → Proposal(Extraction) → Governance → Substrate
```

### Manual Path (New)
```
Human Intent → Draft → Agent Validation → Proposal(Manual) → Governance → Substrate  
```

**Both paths converge at governance** - preserving agent intelligence while enabling human curation.

## Proposal Types

### Single-Item Proposals (Fast Track)
- One operation on one substrate element
- Lightweight governance
- Ideal for daily workflow
- Example: "Create context_item 'Customer Feedback'"

### Changeset Proposals (Bundle Track)  
- Multiple semantically-linked operations
- Reviewed atomically (with split option)
- Ideal for complex extractions
- Example: "Extract strategy themes from Q4 planning dump"

## Proposal Lifecycle

### States
```
DRAFT → PROPOSED → UNDER_REVIEW → [APPROVED | REJECTED]
                                     ↓
                                 COMMITTED
```

**Additional Terminal States**:
- `SUPERSEDED` - Replaced by newer proposal
- `MERGED` - Combined with other proposals

### State Transitions

**DRAFT** (Human-originated only):
- User crafts intent in UI
- Not yet validated
- Can be edited freely

**PROPOSED** (Entry point for agent-originated):
- Agent validation complete
- Ready for human review
- Agent proposals skip DRAFT

**UNDER_REVIEW**:
- Human reviewer assigned
- Impact analysis displayed
- Can be approved, rejected, or split

**APPROVED**:
- Operations committed to substrate
- Cascade events emitted
- Effects propagated to intelligence layer

## Agent Touchpoints

### Mandatory Agent Validation
**All proposals require agent validation before governance**:

1. **Extraction/Proposal Agent** (P1):
   - Creates initial substrate proposals from raw_dumps
   - Sets semantic types and confidence scores
   - Establishes provenance chains

2. **Validator/Enricher Agent** (P1):
   - Normalizes fields and labels
   - Flags duplicates and suggests merges
   - Computes impact reports
   - Maps to existing ontologies

3. **Impact Monitor Agent** (P2):
   - Emits cascade events post-commit
   - Provides recompute hints for intelligence layer
   - Performs drift analysis for documents

### Agent Intelligence Preservation

Even manual proposals maintain agent intelligence through:
- Mandatory validation phase
- Confidence scoring for human-created content
- Automated duplicate detection
- Impact analysis and warnings

## Cascade Policy

### On Proposal Approval

**Immediate Effects**:
1. Operations committed to substrate tables
2. Timeline events emitted with full provenance
3. Substrate relationships updated

**Intelligence Layer Reactions**:
- **Graph**: Recomputes HEAD immediately
- **Timeline**: Appends governance events (never rewrites)
- **Reflections**: Marked stale when basis changes, offers recompute
- **Documents**: Snapshot-bound docs show drift warnings

### Event Types

**New Timeline Event Categories**:
- `proposal.submitted`
- `proposal.approved`  
- `proposal.rejected`
- `substrate.committed`
- `cascade.completed`

## Schema Evolution Requirements

### New Tables

**Proposals Table**:
```sql
CREATE TYPE proposal_state AS ENUM (
  'DRAFT', 'PROPOSED', 'UNDER_REVIEW', 
  'APPROVED', 'REJECTED', 'SUPERSEDED', 'MERGED'
);

CREATE TYPE proposal_kind AS ENUM (
  'Extraction', 'Edit', 'Merge', 'Attachment', 
  'ScopePromotion', 'Deprecation'
);

CREATE TABLE proposals (
  id uuid PRIMARY KEY,
  basket_id uuid NOT NULL,
  proposal_kind proposal_kind NOT NULL,
  basis_snapshot_id uuid,
  origin text CHECK (origin IN ('agent', 'human')),
  provenance jsonb DEFAULT '[]',
  ops jsonb NOT NULL,
  validator_report jsonb DEFAULT '{}',
  status proposal_state DEFAULT 'PROPOSED',
  created_at timestamptz DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text
);
```

### Context_Items Evolution

**Status Migration**:
```sql
CREATE TYPE context_item_state AS ENUM (
  'PROVISIONAL', 'PROPOSED', 'UNDER_REVIEW',
  'ACTIVE', 'DEPRECATED', 'MERGED', 'REJECTED'  
);

-- Migration strategy preserves existing data
ALTER TABLE context_items 
  ADD COLUMN state context_item_state DEFAULT 'ACTIVE';
  
UPDATE context_items 
  SET state = CASE 
    WHEN status = 'active' THEN 'ACTIVE'::context_item_state
    WHEN status = 'archived' THEN 'DEPRECATED'::context_item_state
  END;
```

## Implementation Phases

### Phase 1: Foundation
- Create proposals table and supporting types
- Extend context_items with governance states  
- Build basic proposal submission APIs

### Phase 2: Validation Pipeline
- Implement agent validator/enricher
- Add impact analysis system
- Create duplicate detection engine

### Phase 3: Review Interface
- Build unified governance queue UI
- Add cascade policy enforcement
- Implement effects preview system

### Phase 4: Advanced Features
- Changeset bundling
- Scope promotion workflows
- Cross-basket governance

---

*Governance ensures substrate quality while preserving the sacred capture → intelligence → make flow that defines YARNNN's value proposition.*