# YARNNN Governance Canon v4.0.0

**Substrate/Artifact Model - Pure Substrate Governance**

## Sacred Principles

**Governance Sacred Principle #1**: All pure substrate mutations flow through governed proposals
**Governance Sacred Principle #2**: Proposals target substrates only - artifacts are generated separately
**Governance Sacred Principle #3**: Agent validation is mandatory for substrate proposals only  

## 🏛️ Governance Architecture

### Workspace-Scoped Control
Governance operates at the **workspace level**, providing fine-grained control over substrate mutation policies:

```sql
-- Governance is configured per workspace
workspace_governance_settings {
  workspace_id: uuid PRIMARY KEY,
  governance_enabled: boolean DEFAULT false,
  validator_required: boolean DEFAULT false,
  direct_substrate_writes: boolean DEFAULT true,
  governance_ui_enabled: boolean DEFAULT false,
  
  -- Per-entry-point policies  
  ep_onboarding_dump: 'proposal' | 'direct' | 'hybrid',
  ep_manual_edit: 'proposal' | 'direct' | 'hybrid',
  ep_document_edit: 'proposal' | 'direct' | 'hybrid',
  ep_context_management: 'proposal' | 'direct' | 'hybrid',
  ep_bulk_operations: 'proposal' | 'direct' | 'hybrid',
  
  -- Risk-based routing
  default_blast_radius: 'Local' | 'Scoped' | 'Global',
  hybrid_risk_threshold: 'low' | 'medium' | 'high'
}
```

### Decision Gateway (Single Choke-Point)
All substrate mutations flow through the **Decision Gateway**, which routes changes based on workspace governance settings:

```typescript
// The unified entry point for all substrate changes
await routeChange(supabase: SupabaseClient, cd: ChangeDescriptor): Promise<ChangeResult>
```

**ChangeDescriptor** provides unified abstraction for all mutation intents:
```typescript
interface ChangeDescriptor {
  entry_point: 'onboarding_dump' | 'manual_edit' | 'document_edit' | 'context_management' | 'bulk_operations',
  actor_id: string,
  workspace_id: string,
  basket_id?: string,
  document_id?: string,
  blast_radius?: 'Local' | 'Scoped' | 'Global',
  ops: Operation[],
  provenance: ProvenanceEntry[]
}
```

### PolicyDecider (Routing Logic)
Centralized logic determines whether changes go **direct** to substrate or through **proposals**:

```typescript
function decide(
  flags: WorkspaceFlags,
  cd: ChangeDescriptor, 
  riskHints?: RiskHints
): Decision {
  route: 'direct' | 'proposal',
  require_validator: boolean,
  validator_mode: 'strict' | 'lenient',
  effective_blast_radius: BlastRadius,
  reason: string
}
```

## 🔄 Dual Ingestion Model

### Sacred Capture Path (Preserved)
```
raw_dumps → P1 Agent → ChangeDescriptor → PolicyDecider → [direct | proposal] → Substrate
```

### Manual Curation Path
```  
Human Intent → ChangeDescriptor → PolicyDecider → [direct | proposal] → Agent Validation → Substrate
```

**Key**: Both paths converge at the Decision Gateway, preserving agent intelligence while enabling human curation.

## 📝 The Proposal Model

### Proposal Anatomy
```typescript
interface Proposal {
  // Identity
  id: uuid,
  proposal_kind: 'Extraction' | 'Edit' | 'Merge' | 'Attachment' | 'ScopePromotion' | 'Deprecation',
  
  // Foundation  
  basis: 'HEAD' | snapshot_id,     // What state authored against
  origin: 'agent' | 'human',       // Source of intent
  provenance: ProvenanceEntry[],   // Raw material references
  
  // Operations (atomic changesets)
  ops: Operation[],
  blast_radius: 'Local' | 'Scoped' | 'Global',
  
  // Agent Intelligence (mandatory)
  validator_report: {
    confidence: number,
    dupes: ProposalConflict[],
    ontology_hits: string[],
    suggested_merges: uuid[],
    warnings: string[],
    impact_summary: string
  },
  
  // Governance
  status: ProposalState,
  review: ReviewDecision?,
  effects_preview: CascadePreview
}
```

### Proposal Operations
**Atomic Operations** (can be bundled):
- `CreateBlock { content, semantic_type, confidence }`
- `CreateContextItem { label, synonyms[], confidence }`
- `AttachContextItem { context_item_id, target: Block|Doc|Basket }`
- `MergeContextItems { from_ids[], canonical_id }`
- `EditBlock { block_id, patch }`
- `PromoteScope { block_id, from: LOCAL, to: WORKSPACE }`

## 🔀 Policy-Based Routing

### Entry Point Policies
Each entry point can be configured with one of three policies:

- **proposal**: All changes create proposals requiring human approval
- **direct**: Changes committed directly to substrate (bypasses governance)  
- **hybrid**: Risk-based routing - low risk goes direct, high risk becomes proposals

### Risk-Based Hybrid Routing
When `hybrid` policy is active, the PolicyDecider evaluates:

**Low Risk** (direct commit):
- Single `CreateBlock` operations
- `Local` blast radius changes
- High confidence validator reports

**High Risk** (proposal required):
- `PromoteScope` to `GLOBAL`
- `MergeContextItems` operations
- `Global` blast radius changes
- Low confidence or validation warnings

## 🔄 Proposal Lifecycle

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
- Operations committed to substrate atomically
- Cascade events emitted
- Effects propagated to intelligence layer

## 🤖 Agent Integration

### Mandatory Agent Validation
**All proposals require agent validation** before governance review:

1. **P1 Validator Agent** (mandatory):
   - Normalizes fields and labels
   - Flags duplicates and suggests merges  
   - Computes impact reports
   - Maps to existing ontologies
   - Sets confidence scores

2. **Impact Monitor Agent** (post-commit):
   - Emits cascade events after approval
   - Provides recompute hints for intelligence layer
   - Performs drift analysis for documents

### Agent Intelligence Preservation
Even manual proposals maintain agent intelligence through:
- Mandatory validation phase
- Confidence scoring for human-created content
- Automated duplicate detection
- Impact analysis and warnings

## 🌊 Cascade Policy

### On Proposal Approval
**Immediate Effects**:
1. Operations committed to substrate tables atomically
2. Timeline events emitted with full provenance
3. Substrate relationships updated
4. Context_items state transitions executed

**Intelligence Layer Reactions**:
- **Graph**: Recomputes HEAD immediately
- **Timeline**: Appends governance events (never rewrites)
- **Reflections**: Marked stale when basis changes, offers recompute
- **Documents**: Snapshot-bound docs show drift warnings

### Event Types
**Governance Timeline Events**:
- `proposal.submitted`
- `proposal.approved`  
- `proposal.rejected`
- `substrate.committed`
- `cascade.completed`

## 🔧 Implementation Components

### Database Schema
```sql
-- Core governance table
CREATE TABLE proposals (
  id uuid PRIMARY KEY,
  basket_id uuid,
  workspace_id uuid NOT NULL,
  proposal_kind proposal_kind NOT NULL,
  basis_snapshot_id uuid,
  origin text CHECK (origin IN ('agent', 'human')),
  provenance jsonb DEFAULT '[]',
  ops jsonb NOT NULL,
  blast_radius blast_radius DEFAULT 'Local',
  validator_report jsonb DEFAULT '{}',
  status proposal_state DEFAULT 'PROPOSED',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text
);

-- Execution tracking
CREATE TABLE proposal_executions (
  id uuid PRIMARY KEY,
  proposal_id uuid REFERENCES proposals(id),
  executed_at timestamptz DEFAULT now(),
  operations_count int NOT NULL,
  operations_summary jsonb DEFAULT '{}',
  substrate_ids jsonb DEFAULT '[]'
);

-- Workspace governance settings
CREATE TABLE workspace_governance_settings (
  workspace_id uuid PRIMARY KEY REFERENCES workspaces(id),
  governance_enabled boolean DEFAULT false,
  validator_required boolean DEFAULT false,
  direct_substrate_writes boolean DEFAULT true,
  governance_ui_enabled boolean DEFAULT false,
  ep_onboarding_dump text DEFAULT 'proposal',
  ep_manual_edit text DEFAULT 'proposal',
  ep_document_edit text DEFAULT 'proposal',
  ep_context_management text DEFAULT 'proposal',
  ep_bulk_operations text DEFAULT 'proposal',
  default_blast_radius blast_radius DEFAULT 'Local',
  hybrid_risk_threshold text DEFAULT 'medium'
);
```

### API Endpoints
- **POST /api/baskets/[id]/proposals** - Create proposals with mandatory validation
- **POST /api/baskets/[id]/proposals/[proposalId]/approve** - Execute operations atomically
- **POST /api/baskets/[id]/proposals/[proposalId]/reject** - Reject with reason
- **GET /api/governance/workspace/settings** - Get workspace governance configuration
- **POST /api/changes** - Universal change endpoint using Decision Gateway

### Core Services
- **Decision Gateway** (`/web/lib/governance/decisionGateway.ts`) - Single choke-point for all mutations
- **PolicyDecider** (`/web/lib/governance/policyDecider.ts`) - Centralized routing logic
- **Workspace Flags** (`/web/lib/governance/flagsServer.ts`) - Workspace-scoped governance evaluation
- **Change Descriptor** (`/web/lib/governance/changeDescriptor.ts`) - Unified change abstraction

## 🎯 Backward Compatibility

### Universal Change Service
The new governance system maintains backward compatibility with existing change workflows through:

- **Legacy format support** in `/api/changes` endpoint
- **Automatic descriptor creation** for existing API calls
- **Gradual migration path** via workspace governance settings
- **Feature flag controls** for safe rollout

### Migration Strategy
1. **Phase 1**: Deploy with `governance_enabled: false` (direct writes continue)
2. **Phase 2**: Enable validation (`validator_required: true`)
3. **Phase 3**: Enable governance UI (`governance_ui_enabled: true`)  
4. **Phase 4**: Switch to proposal-first (`direct_substrate_writes: false`)

## 🛡️ Security & Isolation

### Workspace Isolation
- All governance settings scoped by `workspace_id`
- RLS policies enforce workspace membership
- No cross-workspace governance leakage

### Access Control
- Proposal creation: Any workspace member
- Proposal approval: Owner role required
- Governance settings: Owner role required
- Validator configuration: System admin only

---

*Governance ensures substrate quality while preserving the sacred capture → intelligence → make flow that defines YARNNN's value proposition.*