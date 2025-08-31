# YARNNN Frontend-Service Architecture Mapping v1.5.0

**Version**: 1.5.0 (Workspace Governance Hardening)  
**Status**: Canon Extension + Workspace-Scoped Governance  
**Purpose**: Define the comprehensive mapping between frontend logic and the canonical service architecture with workspace-level governance control

---

## 🎯 Core Architectural Principle

**Frontend = Pure View Layer of Canonical Services**

The frontend must be a pure rendering layer that mirrors durable server state, with zero client-side intelligence synthesis. All cognitive processing happens in the canonical agent pipeline (P0→P1→P2→P3).

## 🏗️ Service Architecture Foundation

### The Canonical Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    CANONICAL SERVICE ARCHITECTURE                │
├─────────────────────────────────────────────────────────────────┤
│  P0: Capture    │ P1: Substrate  │ P2: Graph     │ P3: Reflection│
│  Agent          │ Agent          │ Agent         │ Agent         │
│  ============   │ ============   │ ============  │ ============  │
│  • raw_dumps    │ • blocks       │ • context     │ • reflections │
│                 │ • context_items│   _relationships│              │
│                 │                │               │               │
└─────────────────────────────────────────────────────────────────┘
                                    │
                          ┌─────────▼─────────┐
                          │   SUPABASE DB     │
                          │   (Context Graph  │
                          │    Service)       │
                          └─────────┬─────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND VIEW LAYER                      │
├─────────────────────────────────────────────────────────────────┤
│  Timeline View  │ Reflections   │ Blocks View   │ Memory View   │
│  =============  │ View          │ ============  │ ============  │
│  • Event stream │ ============  │ • Block list  │ • Projection  │
│  • Agent traces │ • P3 insights │ • Confidence  │ • Composition │
│                 │ • Metadata    │ • Semantic    │               │
│                 │               │   types       │               │
└─────────────────────────────────────────────────────────────────┘
```

## 🏛️ Governance Integration Architecture

### Workspace-Scoped Governance Layer

The governance layer implements workspace-level control over substrate mutations, following YARNNN Governance Canon v3.0 with Decision Gateway architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER ACTIONS (Frontend)                     │
├─────────────────────────────────────────────────────────────────┤
│  Raw Dumps      │ Manual Edits   │ File Uploads  │ Documents   │
│  =============  │ ============   │ ============  │ =========== │
│  • P0 Capture   │ • Human Intent │ • Bulk Import │ • Authoring │
└─────────────────┬───────────────┬─────────────────┬─────────────┘
                  │               │                 │
                  ▼               ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DECISION GATEWAY (Single Choke-Point)        │
├─────────────────────────────────────────────────────────────────┤
│              ChangeDescriptor → PolicyDecider                  │
│  ┌─────────────────┐              ┌─────────────────┐          │
│  │ Workspace Flags │              │ Risk Assessment │          │
│  │   ============  │              │   ============  │          │
│  │ • per-EP policy │◄────────────►│ • blast_radius  │          │
│  │ • hybrid routing│              │ • operation type│          │
│  └─────────────────┘              └─────────────────┘          │
│                    \              /                            │
│                     ▼            ▼                             │
│              ROUTING DECISION                                   │
│              ├─ 'direct' → Immediate Substrate Commit          │
│              └─ 'proposal' → Governance Review Required        │
└─────────────────────────────────────────────────────────────────┘
                                    │
                          ┌─────────▼─────────┐
                          │   SUBSTRATE DB    │
                          │   (Sacred Truth)  │
                          │   ============    │
                          │ • context_blocks  │
                          │ • context_items   │
                          │ • relationships   │
                          └───────────────────┘
```

### Governance API Endpoints

**Decision Gateway:**
- `POST /api/changes` - Universal change endpoint using ChangeDescriptor abstraction
- Routes via PolicyDecider to either direct commit or proposal creation

**Proposal Management:**
- `POST /api/baskets/[id]/proposals` - Create new proposal with mandatory validation
- `GET /api/baskets/[id]/proposals` - List proposals for review (filtered by status/kind)
- `POST /api/baskets/[id]/proposals/[proposalId]/approve` - Atomic operation execution
- `POST /api/baskets/[id]/proposals/[proposalId]/reject` - Reject with reason

**Workspace Governance:**
- `GET /api/governance/workspace/settings` - Get workspace-level governance configuration
- `POST /api/governance/workspace/settings` - Update per-entry-point policies
- Workspace flags control governance behavior and routing decisions

## 📡 Service-Frontend Mapping Matrix

### 0. Governance Service → Governance Queue View (NEW)

**Service Layer:**
- **API Route**: `/api/baskets/[id]/proposals`
- **Data Source**: `proposals` table with P1 Validator reports
- **Agent Integration**: P1 Validator Agent mandatory for all proposals
- **Contracts**: `ProposalDTO` with validation metadata

**Frontend Layer:**
- **Component**: `GovernanceQueueClient.tsx`
- **Responsibility**: Display proposals awaiting human review
- **Canon Compliance**:
  - ✅ Shows P1 Validator confidence and warnings
  - ✅ Displays blast radius (Local/Scoped/Global)
  - ✅ Agent validation metadata visible
  - ✅ Atomic execution on approval

```typescript
// P1 Validator-enhanced proposal
interface ProposalDTO {
  id: string;
  proposal_kind: 'Extraction' | 'Edit' | 'Merge' | 'Attachment';
  origin: 'agent' | 'human';
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED';
  ops: OperationDTO[];  // Operations to execute
  validator_report: {
    confidence: number;     // P1 Agent confidence
    dupes: string[];       // Duplicate detection
    suggested_merges: any[]; // P1 suggestions
    warnings: string[];    // Validation warnings
    impact_summary: string; // Agent-computed impact
  };
  blast_radius: 'Local' | 'Scoped' | 'Global';
  is_executed: boolean;
}
```

### 1. Timeline Service → Timeline View

**Service Layer:**
- **API Route**: `/api/baskets/[id]/timeline`
- **Data Source**: `timeline_events` table (append-only log)
- **Agent Integration**: All P0→P1→P2→P3 events with agent attribution
- **Contracts**: `TimelineEventDTO` with agent metadata

**Frontend Layer:**
- **Component**: `UnifiedTimeline.tsx`
- **Responsibility**: Pure event rendering with agent attribution
- **Canon Compliance**: 
  - ✅ Agent-computed descriptions (`event.description`)
  - ✅ Processing agent display (`event.processing_agent`)
  - ✅ Zero client-side intelligence

```typescript
// ❌ CANON VIOLATION (removed in v1.4.0)
function getEventDescription(event: TimelineEventDTO): string {
  switch (event.event_type) {
    case 'block.created':
      return `Block created: ${data.title}`; // Client-side logic
  }
}

// ✅ CANON COMPLIANT (v1.4.0)
function getEventDescription(event: TimelineEventDTO): string {
  return event.description || // Agent-computed description
         `${event.event_type.replace(/[._]/g, ' ')} event`;
}
```

### 2. Reflection Service → Reflections View

**Service Layer:**
- **API Route**: `/api/baskets/[id]/reflections` 
- **Data Source**: Real-time P3 Agent computation via `ReflectionEngine`
- **Agent Integration**: P3 Agent insights with substrate window analysis
- **Contracts**: `ReflectionDTO` with computation metadata

**Frontend Layer:**
- **Component**: `ReflectionsClient.tsx`
- **Responsibility**: Display P3 Agent insights with provenance
- **Canon Compliance**:
  - ✅ Shows agent computation metadata
  - ✅ Displays substrate analysis windows  
  - ✅ No client-side pattern recognition

```typescript
// Service-computed reflection
interface ReflectionDTO {
  reflection_text: string;     // P3 Agent insight
  substrate_window_start: string;  // Analysis timeframe
  computation_timestamp: string;   // When P3 processed
  meta: {
    trace_id: string;         // Agent processing trace
    substrate_count: number;  // Sources analyzed
    token_usage: number;      // Processing cost
  };
}
```

### 3. Substrate Service → Blocks View (Governance-Enhanced)

**Service Layer (Updated):**
- **API Route**: `/api/baskets/[id]/blocks`
- **Data Source**: `blocks` table (canonical substrate via governance approval)
- **Agent Integration**: P1 Substrate + Validator Agent with governance metadata
- **Contracts**: `BlockDTO` with governance provenance

**Frontend Layer (Updated):**
- **Component**: `CanonicalBlocksClient.tsx`
- **Responsibility**: Display governance-approved substrate with full provenance
- **Canon Compliance**:
  - ✅ Shows P1 Agent confidence scores
  - ✅ Displays semantic types from agent analysis
  - ✅ Substrate equality (no hierarchy in visual treatment)
  - 🆕 Shows governance approval metadata
  - 🆕 Displays proposal origin (agent vs human)

```typescript
// Governance-enhanced substrate
interface BlockDTO {
  semantic_type: string;      // P1 Agent classification
  confidence_score: number;  // P1 Agent confidence
  processing_agent: string;  // Which agent created this
  created_at: string;        // When P1 processed
  // NEW: Governance metadata
  governance_state: 'committed' | 'pending_approval' | 'draft';
  proposal_id?: string;      // Source proposal if governance-created
  commit_id?: string;        // Governance execution ID
  approval_metadata?: {
    approved_by: string;     // Human who approved
    approved_at: string;     // Approval timestamp
    blast_radius: 'Local' | 'Scoped' | 'Global';
  };
}
```

### 4. Memory Service → Memory View

**Service Layer:**
- **API Route**: `/api/baskets/[id]/projection`
- **Data Source**: Cross-substrate projection from all canonical data
- **Agent Integration**: Unified view of P0→P1→P2→P3 processing
- **Contracts**: `ProjectionDTO` with comprehensive substrate

**Frontend Layer:**
- **Component**: `MemoryClient.tsx` 
- **Responsibility**: Display unified memory projection
- **Canon Compliance**:
  - ✅ Shows canonical agent processing indicator
  - ✅ All data from server-side projection
  - ✅ No client-side memory synthesis

## 🔒 Security & Workspace Isolation

### Service Layer Security

**Workspace-Scoped RLS (Row Level Security)**:
```sql
-- Every API route enforces workspace isolation
CREATE POLICY "baskets_workspace_isolation" ON baskets
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships 
      WHERE user_id = auth.uid()
    )
  );
```

**API Route Pattern**:
```typescript
// Standard security pattern for all routes
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { userId } = await getAuthenticatedUser(supabase);
  const workspace = await ensureWorkspaceForUser(userId, supabase);
  
  // Verify basket belongs to user's workspace
  const { data: basket } = await supabase
    .from('baskets')
    .select('workspace_id')
    .eq('id', params.id)
    .eq('workspace_id', workspace.id) // ✅ Workspace isolation
    .single();
    
  if (!basket) return new Response('Not Found', { status: 404 });
  // ... proceed with workspace-scoped data access
}
```

### Frontend Security Boundaries

**No Client-Side Synthesis**:
- ❌ Never compute insights client-side
- ❌ Never synthesize data from multiple sources
- ❌ Never apply business logic in components
- ✅ Always mirror server-computed state

**Request Authentication**:
```typescript
// All API calls use authenticated Supabase client
export async function fetchWithToken(url: string) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  return fetch(url, {
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    }
  });
}
```

## 🔄 Data Flow Patterns

### 1. Write Paths (Governance-Enhanced Sacred Flows)

**Primary Sacred Write Path (Enhanced)**: 
```
User Input → POST /api/dumps/new → P0 Capture → Governance Processor → Proposal → Human Review → Substrate
```

**Manual Edit Path (NEW)**:
```
User Intent → POST /api/proposals → P1 Validator → Human Review → Atomic Execution → Substrate
```

**Dual Ingestion Convergence**:
```
┌─ Raw Dumps (Agent Origin) ────┐
│                               ▼
│  User Input → P0 → P1       PROPOSALS TABLE (Unified)
│                               ▲              │
└─ Manual Edits (Human Origin) ─┘              ▼
                                        Human Review → Substrate
```

**Frontend Write Responsibilities (Updated)**:
- ✅ File upload to dump API (P0 Capture preserved)
- ✅ Form submission for basket creation
- 🆕 Manual proposal creation via governance UI
- 🆕 Proposal approval/rejection actions
- ❌ Never write substrate directly (governance enforced)
- ❌ Never write relationships or reflections
- ❌ Never bypass governance layer (except when disabled)

### 2. Read Paths (Governance-Enhanced)

**Governance-Aware Data Flow**:
```
Canonical DB → Governance Filter → API Route → Server-side Processing → Frontend Display
                     ↑
              Feature Flags Control
```

**Data Freshness Patterns (Updated):**
- **Timeline**: Real-time stream with governance events
- **Reflections**: On-demand computation with governance context
- **Blocks**: Eventually consistent after governance approval
- **Memory**: Composite projection including governance state
- 🆕 **Proposals**: Real-time governance queue for human review

**Governance State Visibility**:
```typescript
// Frontend shows governance states throughout UI
interface GovernanceAwareComponent {
  // Show what's committed substrate
  committed_blocks: BlockDTO[];
  
  // Show what's pending human review
  pending_proposals: ProposalDTO[];
  
  // Show governance deployment status
  governance_status: 'disabled' | 'testing' | 'partial' | 'full';
}
```

### 3. Agent Processing Flow

**Async Intelligence Pattern**:
```
User Action → Immediate UI Response → Background Agent Processing → UI Update
```

**Frontend Handling**:
```typescript
// Show processing state while agents work
const [processingState, setProcessingState] = useState<'pending' | 'processing' | 'complete'>('pending');

// Display immediate confirmation
const handleUpload = async (file: File) => {
  setProcessingState('pending');
  
  // Sacred write path
  await fetch('/api/dumps/new', {
    method: 'POST',
    body: createFormData(file)
  });
  
  // User gets immediate feedback
  toast.success('Memory captured - processing begins now');
  
  // Agent processing happens asynchronously
  // UI updates when agents complete via real-time subscriptions
};
```

## ⚡ Performance & Optimization

### Service Layer Performance

**Database Optimization**:
- Materialized views for complex substrate projections
- Strategic indexes on workspace_id, basket_id, created_at
- Connection pooling via Supabase
- Query optimization with selective field loading

**Agent Processing Optimization**:
- Queue-based processing prevents user blocking
- Horizontal scaling of agent workers
- Processing state visibility for user experience
- Retry mechanisms for failed processing

### Frontend Performance

**Component Optimization**:
- Server-side data fetching for initial page loads
- Client-side caching for repeated API calls
- Optimistic updates for write operations
- Loading states during async operations

**Bundle Optimization**:
- Dynamic imports for large components (`Next.js dynamic()`)
- Tree-shaking to eliminate unused code
- Route-based code splitting
- Efficient asset loading

## 📊 Monitoring & Observability

### Service Metrics

**Agent Processing Health**:
- Queue depth per workspace
- Processing latency (P0→P1→P2→P3 times)
- Agent success/failure rates
- Substrate creation velocity

**API Performance**:
- Response times per route
- Error rates by endpoint
- Database query performance
- Authentication success rates

### Frontend Metrics

**User Experience**:
- Time to first meaningful paint
- Client-side error rates
- API response times from frontend
- User interaction success rates

**Data Consistency**:
- Client/server state synchronization
- Cache hit/miss rates
- Real-time update delivery
- Stale data detection

## 🚨 Anti-Patterns & Violations

### ❌ Client-Side Intelligence (Major Violation)

```typescript
// ❌ NEVER DO THIS - client-side intelligence
function computeInsights(blocks: Block[]): Insight[] {
  return blocks
    .filter(b => b.confidence > 0.8)
    .map(b => ({
      type: 'pattern',
      text: analyzePattern(b.content) // Client-side analysis
    }));
}

// ✅ CORRECT - server provides insights
function displayInsights(insights: Insight[]) {
  return insights.map(insight => (
    <div key={insight.id}>
      {insight.text} {/* P3 Agent computed */}
      <small>by {insight.processing_agent}</small>
    </div>
  ));
}
```

### ❌ Substrate Hierarchy (Canon Violation)

```typescript
// ❌ NEVER DO THIS - implies substrate hierarchy
const priorityOrder = ['insight', 'task', 'reference']; // Implies ranking

function sortSubstrate(items: SubstrateItem[]) {
  return items.sort((a, b) => 
    priorityOrder.indexOf(a.type) - priorityOrder.indexOf(b.type)
  );
}

// ✅ CORRECT - substrate equality
function displaySubstrate(items: SubstrateItem[]) {
  // All substrate types get equal visual treatment
  return items.map(item => (
    <SubstrateCard 
      key={item.id} 
      type={item.type}
      className="substrate-peer-card" // Same styling for all
    />
  ));
}
```

### ❌ Direct Database Access (Architecture Violation)

```typescript
// ❌ NEVER DO THIS - bypass service layer
const { data } = await supabase
  .from('blocks')
  .select('*')
  .eq('basket_id', basketId); // Direct DB access

// ✅ CORRECT - use service APIs
const response = await fetch(`/api/baskets/${basketId}/blocks`);
const { data } = await response.json(); // Canonical API
```

### ❌ Governance Bypass (Canon Violation) 🆕

```typescript
// ❌ NEVER DO THIS - bypass governance layer
async function createBlockDirectly(content: string) {
  return await supabase
    .from('blocks')
    .insert({ content, semantic_type: 'goal' }); // Direct substrate write
}

// ✅ CORRECT - use governance workflow
async function createBlockViaGovernance(content: string) {
  // Create proposal for human review
  return await fetch('/api/baskets/[id]/proposals', {
    method: 'POST',
    body: JSON.stringify({
      proposal_kind: 'Edit',
      origin: 'human',
      ops: [{
        type: 'CreateBlock',
        data: { content, semantic_type: 'goal' }
      }]
    })
  });
}
```

### ❌ Feature Flag Ignorance (Deployment Risk) 🆕

```typescript
// ❌ NEVER DO THIS - ignore feature flags
function submitUserEdit(content: string) {
  // Always assume governance is enabled
  return createProposal(content);
}

// ✅ CORRECT - respect governance status
function submitUserEdit(content: string) {
  const { shouldUseGovernance } = getGovernanceFlags();
  
  if (shouldUseGovernance()) {
    return createProposal(content);  // Governance path
  } else {
    return createSubstrate(content); // Legacy path
  }
}
```

## 🎯 Success Criteria

### Canon v1.4.0 + Governance Compliance Checklist

**Agent Intelligence Mandatory** (Preserved + Enhanced):
- [ ] All descriptions come from agents (`event.description`)
- [ ] Agent attribution visible (`processing_agent`)
- [ ] No client-side intelligence synthesis
- [ ] Agent confidence scores displayed
- 🆕 P1 Validator reports visible in governance UI
- 🆕 Agent validation mandatory for all proposals

**Substrate Equality** (Preserved):
- [ ] All substrate types get equal UI treatment
- [ ] No visual hierarchy between types
- [ ] Consistent interaction patterns
- [ ] Equal prominence in displays

**Memory-First Architecture** (Enhanced):
- [ ] Frontend mirrors server state only
- [ ] No client-side data synthesis
- [ ] Real-time updates from canonical sources
- [ ] Server-computed projections only
- 🆕 Governance state reflected in UI components
- 🆕 Proposal metadata from server-side validation

**Workspace Isolation** (Preserved + Enhanced):
- [ ] All API calls workspace-scoped
- [ ] RLS policies enforced
- [ ] No cross-workspace data leakage
- [ ] User-specific data boundaries
- 🆕 Proposals workspace-scoped via RLS
- 🆕 Governance actions isolated per workspace

**Governance Workflow Integrity** (NEW):
- [ ] All substrate writes flow through proposals
- [ ] No direct substrate writes when governance enabled
- [ ] Atomic operation execution on approval
- [ ] Complete audit trail in timeline events
- [ ] Feature flag compliance in all components
- [ ] Dual ingestion paths converge at governance
- [ ] Sacred Principles preserved through governance layer

### Development Quality Gates

**Pre-Deployment Checks**:
1. Canon compliance audit passes
2. No client-side intelligence detected
3. All API routes workspace-scoped
4. Agent attribution present
5. Build verification successful

**Runtime Health Checks**:
1. Agent processing queue healthy
2. API response times acceptable
3. Real-time updates functioning
4. Error rates within tolerance
5. User experience metrics positive

---

## 🎬 Implementation Guidelines

### For New Features (Governance-Aware)

1. **Service-First Design**: Start with canonical API design
2. **Governance Integration**: Design proposal workflows for substrate mutations
3. **Agent Integration**: Ensure P1 Validator involvement for proposals
4. **Feature Flag Support**: Handle all governance deployment states
5. **Frontend Rendering**: Build pure view layer with governance state visibility
6. **Canon Compliance**: Verify against all principles + governance requirements
7. **Security Verification**: Confirm workspace isolation + governance boundaries

### For Refactoring (Governance Migration)

1. **Audit Direct Substrate Writes**: Identify legacy direct writes
2. **Design Governance Flow**: Plan proposal workflow for each write
3. **Update to Proposal Pattern**: Replace direct writes with proposals
4. **Add Feature Flag Support**: Handle legacy/governance mode switching
5. **Enhance Agent Integration**: Ensure P1 Validator involvement
6. **Update Contracts**: Add governance metadata fields
7. **Verify Sacred Principles**: Ensure governance preserves canon
8. **Test Governance Workflows**: Validate proposal → approval → substrate

### For Debugging (Governance-Aware)

1. **Governance Status First**: Check feature flag configuration
2. **Service Layer Analysis**: Check API responses and agent processing
3. **Proposal Workflow**: Verify governance flow from creation to execution
4. **Frontend Rendering**: Verify view layer mirrors server + governance state
5. **Canon Compliance**: Review against architectural + governance principles
6. **Performance Impact**: Monitor governance overhead and agent latency
7. **Audit Trail**: Verify complete timeline event emission
8. **User Experience**: Ensure seamless governance feedback

## 🚀 Governance Deployment Strategy

### Feature Flag Phases

**Phase 1: Disabled (Legacy Mode)**
```typescript
// All governance flags false - existing behavior preserved
const flags = {
  governance_enabled: false,
  validator_required: false, 
  direct_substrate_writes: true,
  governance_ui_enabled: false
};
```

**Phase 2: Testing (Parallel Mode)**
```typescript
// Governance runs alongside legacy - no user impact
const flags = {
  governance_enabled: true,
  validator_required: false,
  direct_substrate_writes: true,    // Legacy still works
  governance_ui_enabled: false      // UI hidden
};
```

**Phase 3: Partial (UI Enabled)**
```typescript
// Governance UI visible, some flows governed
const flags = {
  governance_enabled: true,
  validator_required: false,
  direct_substrate_writes: true,    // Some legacy flows
  governance_ui_enabled: true       // UI shows proposals
};
```

**Phase 4: Full (Complete Governance)**
```typescript
// All substrate writes governed
const flags = {
  governance_enabled: true,
  validator_required: true,         // Validation mandatory
  direct_substrate_writes: false,   // All through governance
  governance_ui_enabled: true
};
```

### Frontend Feature Flag Integration

```typescript
// Component adapts to governance status
function SubstrateEditButton({ onEdit }: { onEdit: (content: string) => void }) {
  const governanceStatus = useGovernanceStatus();
  
  const handleEdit = (content: string) => {
    switch (governanceStatus.status) {
      case 'disabled':
        return submitDirectEdit(content);     // Legacy path
      case 'testing':
        return submitBothPaths(content);      // Parallel testing
      case 'partial':
      case 'full':
        return submitProposal(content);       // Governance path
    }
  };
  
  return (
    <button onClick={() => handleEdit(content)}>
      {governanceStatus.status === 'full' ? 'Propose Edit' : 'Edit'}
    </button>
  );
}
```

---

**This mapping ensures sustainable development aligned with Canon v1.4.0 + Governance principles, where frontend serves as a pure view layer of the canonical agent-processed service architecture with governance workflow integration.**