# Frontend-Service Architecture Mapping v1.4.0

**Version**: 1.4.0  
**Status**: Canon Extension  
**Purpose**: Define the comprehensive mapping between frontend logic and the canonical service architecture for sustainable development

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

## 📡 Service-Frontend Mapping Matrix

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

### 3. Substrate Service → Blocks View

**Service Layer:**
- **API Route**: `/api/baskets/[id]/blocks`
- **Data Source**: `blocks` table (canonical substrate from P1 Agent)
- **Agent Integration**: P1 Substrate Agent created content with confidence
- **Contracts**: `BlockDTO` with agent processing metadata

**Frontend Layer:**
- **Component**: `CanonicalBlocksClient.tsx`
- **Responsibility**: Display agent-created substrate with attribution  
- **Canon Compliance**:
  - ✅ Shows P1 Agent confidence scores
  - ✅ Displays semantic types from agent analysis
  - ✅ Substrate equality (no hierarchy in visual treatment)

```typescript
// P1 Agent-created substrate
interface BlockDTO {
  semantic_type: string;      // P1 Agent classification
  confidence_score: number;  // P1 Agent confidence
  processing_agent: string;  // Which agent created this
  created_at: string;        // When P1 processed
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

### 1. Write Paths (Sacred & Rare)

**Primary Sacred Write Path**: 
```
User Input → POST /api/dumps/new → P0 Capture → Queue → P1→P2→P3 Processing
```

**Onboarding Write Path**:
```
User Upload → POST /api/baskets/ingest → Atomic (Basket + Dumps) → Queue Processing
```

**Frontend Write Responsibilities**:
- ✅ File upload to dump API
- ✅ Form submission for basket creation
- ❌ Never write substrate directly
- ❌ Never write relationships or reflections

### 2. Read Paths (Primary Frontend Function)

**Real-time Data Flow**:
```
Canonical DB → API Route → Server-side Processing → Frontend Display
```

**Data Freshness Patterns**:
- **Timeline**: Real-time append-only stream
- **Reflections**: On-demand computation with caching
- **Blocks**: Eventually consistent after P1 processing
- **Memory**: Composite projection updated on substrate change

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

## 🎯 Success Criteria

### Canon v1.4.0 Compliance Checklist

**Agent Intelligence Mandatory**:
- [ ] All descriptions come from agents (`event.description`)
- [ ] Agent attribution visible (`processing_agent`)
- [ ] No client-side intelligence synthesis
- [ ] Agent confidence scores displayed

**Substrate Equality**:
- [ ] All substrate types get equal UI treatment
- [ ] No visual hierarchy between types
- [ ] Consistent interaction patterns
- [ ] Equal prominence in displays

**Memory-First Architecture**:
- [ ] Frontend mirrors server state only
- [ ] No client-side data synthesis
- [ ] Real-time updates from canonical sources
- [ ] Server-computed projections only

**Workspace Isolation**:
- [ ] All API calls workspace-scoped
- [ ] RLS policies enforced
- [ ] No cross-workspace data leakage
- [ ] User-specific data boundaries

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

### For New Features

1. **Service-First Design**: Start with canonical API design
2. **Agent Integration**: Ensure agent processing where appropriate
3. **Frontend Rendering**: Build pure view layer
4. **Canon Compliance**: Verify against all principles
5. **Security Verification**: Confirm workspace isolation

### For Refactoring

1. **Identify Client Intelligence**: Scan for computation logic
2. **Extract to Services**: Move logic to appropriate agent pipeline
3. **Update Contracts**: Ensure agent attribution fields
4. **Verify Substrate Equality**: Check for hierarchy implications
5. **Test Workspace Isolation**: Confirm security boundaries

### For Debugging

1. **Service Layer First**: Check API responses and agent processing
2. **Frontend Rendering**: Verify view layer only mirrors server state
3. **Canon Compliance**: Review against architectural principles
4. **Performance Impact**: Monitor agent processing and API latency
5. **User Experience**: Ensure seamless agent processing feedback

---

**This mapping ensures sustainable development aligned with Canon v1.4.0 principles, where frontend serves as a pure view layer of the canonical agent-processed service architecture.**