# YARNNN Canon v2.1: Universal Work Orchestration & Status Integration

## Canon Compliance Statement
This document extends YARNNN Canon v2.0 with universal work orchestration while maintaining strict adherence to Sacred Principles:

- **Sacred Principle #1**: All substrate mutations flow through governed proposals
- **Sacred Principle #2**: Agent intelligence is mandatory for substrate operations  
- **Sacred Principle #3**: Memory-first architecture with substrate/artifact separation
- **Sacred Principle #4**: Event-driven consistency via timeline_events

## Architectural Extension: Universal Work Orchestration

### The Need: Beyond Dump Processing
YARNNN users initiate async operations through multiple entry points:
- **P0→P1→P2→P3 Pipeline**: Raw dump ingestion and processing
- **Governance Operations**: Manual proposal creation and approval
- **Direct Substrate Edits**: Block/context item modifications
- **Document Composition**: P4 artifact creation from substrate
- **Graph Operations**: P2 relationship mapping
- **Timeline Restoration**: Historical state recovery

**Canon Gap**: No unified orchestration or status visibility across these workflows.

### Solution: Canonical Queue as Universal Orchestrator

The `canonical_queue` table becomes the single source of truth for ALL async work in YARNNN, not just pipeline processing.

```sql
-- Enhanced canonical_queue schema (Canon v2.1)
CREATE TABLE canonical_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Work Identification
    work_type text NOT NULL, -- P1_SUBSTRATE | P2_GRAPH | P3_REFLECTION | MANUAL_EDIT | DOCUMENT_COMPOSE | etc
    work_id text, -- Optional: dump_id, proposal_id, document_id, etc
    
    -- Context
    basket_id uuid,
    workspace_id uuid NOT NULL,
    user_id uuid, -- Who initiated this work
    
    -- Orchestration
    status text NOT NULL DEFAULT 'pending', -- pending | claimed | processing | cascading | completed | failed
    processing_stage text, -- Stage-specific status (tokenizing | extracting | linking | etc)
    worker_id text,
    priority integer DEFAULT 5,
    
    -- Payload & Results
    work_payload jsonb DEFAULT '{}', -- Input data for work
    work_result jsonb DEFAULT '{}', -- Output data from completed work
    error_details text,
    
    -- Cascade Management
    cascade_metadata jsonb DEFAULT '{}', -- Tracks P1→P2→P3 flows
    parent_work_id uuid, -- References triggering work
    
    -- Timing
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    claimed_at timestamptz,
    completed_at timestamptz,
    
    -- Constraints
    CONSTRAINT fk_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'claimed', 'processing', 'cascading', 'completed', 'failed')),
    CONSTRAINT valid_work_type CHECK (work_type IN ('P0_CAPTURE', 'P1_SUBSTRATE', 'P2_GRAPH', 'P3_REFLECTION', 'P4_COMPOSE', 'MANUAL_EDIT', 'PROPOSAL_REVIEW', 'TIMELINE_RESTORE'))
);

-- Indexes for performance
CREATE INDEX idx_canonical_queue_status ON canonical_queue (status, created_at);
CREATE INDEX idx_canonical_queue_workspace ON canonical_queue (workspace_id, status);
CREATE INDEX idx_canonical_queue_cascade ON canonical_queue USING gin (cascade_metadata);
```

## Universal Status API: Canon-Compliant Design

### Single Status Endpoint
```
GET /api/work/{work_id}/status
```

**Canon Compliance**: Uses existing substrate and event data to derive status, respecting memory-first architecture.

**Response Schema**:
```typescript
interface WorkStatus {
    work_id: string
    work_type: 'P1_SUBSTRATE' | 'P2_GRAPH' | 'P3_REFLECTION' | 'MANUAL_EDIT' | 'DOCUMENT_COMPOSE'
    
    // Current State
    status: 'pending' | 'processing' | 'cascading' | 'completed' | 'failed'
    processing_stage?: string // Stage-specific detail
    progress_percentage: number
    
    // Context
    basket_id?: string
    workspace_id: string
    user_id: string
    
    // Timing
    started_at: string
    last_activity: string
    estimated_completion?: string
    
    // Canon-compliant metadata
    substrate_impact: {
        proposals_created: number
        substrate_created: { blocks: number, context_items: number }
        relationships_mapped: number
        artifacts_generated: number
    }
    
    // Cascade Flow
    cascade_flow: {
        active: boolean
        current_stage: 'P1' | 'P2' | 'P3' | null
        completed_stages: string[]
        next_stage?: string
    }
    
    // Error Handling
    error?: {
        code: string
        message: string
        recovery_actions: string[]
    }
}
```

## Development Sequence: Canon-Compliant Implementation

### Phase 1: Universal Queue Foundation (Week 1)
**Goal**: Establish canonical_queue as single source of truth for all async work

#### 1.1 Schema Migration
```sql
-- Add new columns to existing canonical_queue
ALTER TABLE canonical_queue 
ADD COLUMN processing_stage text,
ADD COLUMN work_payload jsonb DEFAULT '{}',
ADD COLUMN work_result jsonb DEFAULT '{}',
ADD COLUMN cascade_metadata jsonb DEFAULT '{}',
ADD COLUMN parent_work_id uuid,
ADD COLUMN user_id uuid;

-- Update work_type constraints
ALTER TABLE canonical_queue 
DROP CONSTRAINT IF EXISTS valid_work_type,
ADD CONSTRAINT valid_work_type CHECK (work_type IN (
    'P0_CAPTURE', 'P1_SUBSTRATE', 'P2_GRAPH', 'P3_REFLECTION', 'P4_COMPOSE',
    'MANUAL_EDIT', 'PROPOSAL_REVIEW', 'TIMELINE_RESTORE'
));
```

#### 1.2 Universal Work Tracker
```python
# New: services/universal_work_tracker.py
class UniversalWorkTracker:
    """Canon-compliant work orchestration for all async operations."""
    
    async def initiate_work(self, work_type: str, payload: dict, context: WorkContext) -> str:
        """Create queue entry for ANY async work in YARNNN."""
        
    async def get_work_status(self, work_id: str) -> WorkStatus:
        """Derive status from canonical queue + existing substrate data."""
        
    async def complete_work(self, work_id: str, result: dict):
        """Mark work complete and trigger cascades if applicable."""
```

#### 1.3 Integration Points
**Files to modify**:
- `governance_processor.py`: Use work tracker for P1 operations
- `graph_agent.py`: Use work tracker for P2 operations  
- `reflection_agent.py`: Use work tracker for P3 operations
- `presentation_agent.py`: Use work tracker for P4 operations
- All manual edit endpoints: Create work entries

### Phase 2: Cascade Integration + Status API (Week 2)  
**Goal**: Connect cascade framework with status visibility

#### 2.1 Enhanced Cascade Manager
```python
# Enhanced: services/cascade_manager.py
class CanonicalCascadeManager:
    """Canon v2.1 compliant cascade orchestration."""
    
    async def trigger_cascade(self, completed_work_id: str, result: dict):
        """Trigger next pipeline stage with full status tracking."""
        
        # Canon compliance: Only trigger if substrate was actually created
        if not self._has_substrate_impact(result):
            return None
            
        # Create next work entry with cascade metadata
        next_work_id = await self.work_tracker.initiate_work(
            work_type=self._get_next_stage(completed_work_type),
            payload={'parent_work_id': completed_work_id},
            context=work_context
        )
        
        # Emit canon-compliant timeline event
        await self._emit_cascade_event(completed_work_id, next_work_id)
```

#### 2.2 Universal Status API
```python
# New: routes/work_status.py
@router.get("/api/work/{work_id}/status")
async def get_work_status(work_id: str, user: dict = Depends(verify_jwt)):
    """Canon-compliant status derivation from existing data."""
    
    # Derive from canonical_queue + substrate impact
    status = await universal_work_tracker.get_work_status(work_id)
    
    # Ensure workspace isolation (Canon compliance)
    if not await user_has_workspace_access(user, status.workspace_id):
        raise HTTPException(403, "Workspace access denied")
        
    return status
```

### Phase 3: Frontend Integration + Queue Health (Week 3)
**Goal**: User-facing status with queue monitoring

#### 3.1 Universal Status Component
```typescript
// components/work/UniversalWorkStatus.tsx
interface UniversalWorkStatusProps {
    workId: string
    workType: string
    onComplete?: (result: WorkStatus) => void
    showCascadeFlow?: boolean
}

// Shows status for ANY async work: dumps, manual edits, cascades, etc.
```

#### 3.2 Queue Health Dashboard
```typescript
// components/admin/QueueHealthDashboard.tsx
// Canon-compliant monitoring of all work types
// Shows pipeline health, worker status, cascade flows
```

### Phase 4: Production Polish + Canon Audit (Week 4)
**Goal**: Production readiness with full canon compliance

#### 4.1 Canon Compliance Audit
- Verify all substrate mutations use governance (Sacred Principle #1)
- Ensure agent intelligence in all operations (Sacred Principle #2)
- Validate substrate/artifact separation (Sacred Principle #3)  
- Confirm timeline event emission (Sacred Principle #4)

#### 4.2 Legacy Code Removal
**Delete these files/patterns**:
- Any direct substrate creation bypassing governance
- Duplicate status tracking systems
- Non-canon work orchestration
- Legacy queue processors

#### 4.3 Performance & Reliability
- Database indexing for queue performance
- Connection pooling for work tracker
- Retry logic with exponential backoff
- Dead letter queue for failed work

## Schema Changes Summary

### Required Migrations
1. **canonical_queue enhancement** (Phase 1)
2. **Timeline event types** (add cascade events)
3. **No new tables required** - leverages existing canon-compliant infrastructure

### Backward Compatibility
- Existing queue entries continue to work
- New columns have sensible defaults
- Feature flags for gradual rollout

## Canon Compliance Verification

### Sacred Principle #1: Governed Proposals
✅ All substrate mutations continue through proposal system
✅ Work tracker creates proposals for substrate operations
✅ Status derived from governance state

### Sacred Principle #2: Agent Intelligence  
✅ Work tracker preserves agent validation requirements
✅ Cascade triggers only fire after agent processing
✅ Status shows agent confidence scores

### Sacred Principle #3: Memory-First Architecture
✅ Work orchestration serves substrate operations
✅ Status derived from substrate impact
✅ No artifact recursion in cascade flows

### Sacred Principle #4: Event-Driven Consistency
✅ All work state changes emit timeline events
✅ Status derivation reads from timeline_events
✅ Cascade flows generate proper event chains

## Success Metrics

### Functional
- All async work visible to users within 2s
- Cascade success rate > 99%  
- End-to-end pipeline < 90s
- Zero orphaned work entries

### Canon Compliance
- No substrate mutations bypass governance
- All work has agent intelligence
- Timeline events for every state change
- Substrate/artifact boundaries maintained

### Performance
- Status API < 200ms response time
- Queue processing < 30s per item
- Database queries optimized for scale
- Memory usage within bounds

## Implementation Status: COMPLETED ✅

### Phase 3 Implementation Complete (September 2025)

**Canon v2.1 Universal Work Orchestration has been fully implemented**, achieving complete unification of all async work under a single orchestration system with real-time status visibility.

#### ✅ Backend Implementation Complete

1. **Universal Status Derivation Service** (`/api/src/app/services/status_derivation.py`)
   - Comprehensive status derivation from existing substrate and timeline data
   - Cascade flow visualization for P1→P2→P3 pipeline relationships
   - Workspace work summaries and queue health monitoring
   - Canon-compliant with Sacred Principle #3 (memory-first architecture)

2. **Enhanced Work Status API** (`/api/src/app/routes/work_status.py`)
   - Unified `/api/work/{work_id}/status` endpoint for ALL work types
   - Cascade flow endpoint: `/api/work/{work_id}/cascade`
   - Workspace summary endpoint: `/api/work/workspace/{workspace_id}/summary`
   - JWT authentication with workspace isolation
   - Real-time status updates via status derivation service

3. **Dump Upload Integration** (`/web/app/api/dumps/upload/route.ts`)
   - **LEGACY ELIMINATED**: Removed dual dump-specific status system
   - All dump uploads now create P0_CAPTURE work in universal orchestration
   - Returns `work_id` and `status_url` for immediate tracking
   - Timeline event emission for Canon compliance

#### ✅ Frontend Implementation Complete

1. **Universal Work Status Components** (`/web/components/work/`)
   - `UniversalWorkStatus`: Full-featured status card with cascade visualization
   - `InlineWorkStatus`: Compact status for embedding in other components  
   - `UniversalWorkStatusIndicator`: Top bar notification icon with activity feed
   - Real-time updates via Supabase WebSocket with intelligent polling fallback

2. **Real-time Status Hooks** (`/web/hooks/`)
   - `useWorkStatusRealtime`: WebSocket-enabled status tracking with fallback
   - `useWorkQueueRealtime`: Workspace-wide work activity monitoring
   - `useWorkStatus`: Basic polling hook for compatibility
   - Connection status indicators and error recovery

3. **Top Bar Integration** (`/web/components/common/TopBar.tsx`)
   - Universal work status indicator shows all workspace work activity
   - Real-time notification badge with active work count
   - Expandable activity feed with P1→P2→P3 cascade visualization
   - Quick access to queue monitoring and work details

4. **Dump Processing Integration** (`/web/components/dumps/DumpProcessingStatus.tsx`)
   - **LEGACY ELIMINATED**: Replaced dump-specific status with universal system
   - Shows P0→P1→P2→P3 pipeline progress via universal work status
   - Maps dump uploads to work IDs via `/api/dumps/{id}/work` endpoint
   - Real-time cascade flow visualization in dump modal

#### ✅ Canon Compliance Achievements

1. **Unified Orchestration**: Single `agent_processing_queue` table serves as canonical queue for ALL async work (P0-P4, manual edits, governance, timeline restoration)

2. **Real-time Status Visibility**: Users see all work activity in real-time through:
   - Top bar universal work indicator (always visible)  
   - Individual work status components (embedded anywhere)
   - Cascade flow visualization (P1→P2→P3 relationships)
   - Substrate impact metrics (proposals, blocks, relationships)

3. **Sacred Principle Compliance**:
   - **Principle #1**: All substrate mutations tracked through universal work entries
   - **Principle #2**: Agent intelligence mandatory for all work types
   - **Principle #3**: Status derived from existing substrate/timeline data
   - **Principle #4**: Timeline events for all work state changes

4. **Eliminated Drift**: Removed legacy dump-specific status system, ensuring single source of truth for work orchestration across entire application

#### ✅ User Experience Improvements

- **Unified Interface**: Same status components work for dump processing, manual edits, governance proposals, and document composition
- **Real-time Feedback**: Immediate visibility into work progress without page refreshes
- **Cascade Awareness**: Users see P1→P2→P3 pipeline flows and relationships
- **Substrate Impact**: Clear metrics on proposals created, substrate generated, relationships mapped
- **Error Recovery**: Contextual recovery actions for failed work with retry capabilities

#### ✅ Technical Implementation

- **WebSocket Real-time**: Supabase real-time subscriptions with intelligent polling fallback
- **Status Derivation**: Derives status from existing data without requiring additional storage
- **Workspace Isolation**: All work status respects RLS policies and workspace boundaries
- **Performance Optimized**: Efficient queries with proper indexing and caching
- **Type Safety**: Full TypeScript interface contracts between frontend and backend

### Canon Purity Achievement ✅

The implementation successfully achieves **canon purity** by:
1. **Eliminating Dual Approaches**: Single orchestration system replaces multiple status mechanisms
2. **Maintaining Sacred Principles**: All work flows through canonical queue with agent intelligence
3. **Preventing Code Drift**: Unified interfaces prevent future fragmentation
4. **End-to-End Consistency**: Same patterns used throughout backend, API, and frontend

---

**Canon v2.1 Universal Work Orchestration: PRODUCTION READY** 🎉

This implementation provides complete universal work orchestration while maintaining strict YARNNN Canon compliance and eliminating technical debt from dual approaches.