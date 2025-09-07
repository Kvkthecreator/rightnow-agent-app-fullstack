# Streamlined Execution Plan: YARNNN Canon v2.1

## Execution Overview
This plan implements YARNNN Canon v2.1 Universal Work Orchestration with surgical precision, removing legacy code and ensuring streamlined consistency.

## Pre-Execution Schema Verification

### Current Schema Analysis
```sql
-- Verify current canonical_queue structure
\d canonical_queue

-- Expected columns from audit:
-- id, dump_id, basket_id, workspace_id, work_type, status, priority, 
-- created_at, updated_at, worker_id, error_details
```

### Required Schema Extensions (No Breaking Changes)
```sql
-- Phase 1 migration: Add universal orchestration columns
ALTER TABLE canonical_queue 
ADD COLUMN IF NOT EXISTS processing_stage text,
ADD COLUMN IF NOT EXISTS work_payload jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS work_result jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cascade_metadata jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS parent_work_id uuid,
ADD COLUMN IF NOT EXISTS user_id uuid,
ADD COLUMN IF NOT EXISTS work_id text;

-- Update constraints (non-breaking)
ALTER TABLE canonical_queue 
DROP CONSTRAINT IF EXISTS valid_work_type;

ALTER TABLE canonical_queue 
ADD CONSTRAINT valid_work_type_v21 CHECK (work_type IN (
    'P0_CAPTURE', 'P1_SUBSTRATE', 'P2_GRAPH', 'P3_REFLECTION', 'P4_COMPOSE',
    'MANUAL_EDIT', 'PROPOSAL_REVIEW', 'TIMELINE_RESTORE'
));

-- Performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_canonical_queue_work_id ON canonical_queue (work_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_canonical_queue_user_workspace ON canonical_queue (user_id, workspace_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_canonical_queue_cascade ON canonical_queue USING gin (cascade_metadata);
```

## Legacy Code Removal Plan

### Files to Delete
```bash
# Remove legacy/duplicate status systems
rm -f docs/PIPELINE_STATUS_INTEGRATION.md  # Superseded by canon v2.1
rm -f api/src/services/cascade_integration_points.md  # Integrated into execution

# Remove old pipeline integration docs (superseded)
rm -f docs/PIPELINE_INTEGRATION_DEVELOPMENT_SEQUENCE.md

# Clean up test scripts (will be replaced with canonical tests)
rm -f scripts/test_auto_approval.js  # Replaced with universal testing
rm -f scripts/test_evolution_comprehensive.js  # Replaced with canonical tests
```

### Code Patterns to Remove
1. **Direct substrate creation bypassing governance**
2. **Duplicate queue management systems** 
3. **Non-canonical work orchestration**
4. **Multiple status derivation approaches**

## Execution Phases

### Phase 1: Schema & Foundation (Days 1-2)
**Goal**: Establish universal work orchestration foundation

#### Day 1: Schema Migration
```bash
# 1. Apply schema changes
psql -f migrations/001_canonical_queue_v21.sql

# 2. Verify migration
npm run test:schema

# 3. Create universal work tracker
touch api/src/services/universal_work_tracker.py
```

#### Day 2: Foundation Classes
**Files to create**:
- `api/src/services/universal_work_tracker.py`
- `api/src/schemas/work_status.py`
- `api/src/routes/work_status.py`

**Integration points**:
- Modify `canonical_queue_processor.py` to use universal tracker
- Update imports across pipeline agents

### Phase 2: Cascade Integration (Days 3-4)
**Goal**: Connect cascade framework with universal orchestration

#### Day 3: Enhanced Cascade Manager
```python
# Replace existing cascade_manager.py with canon v2.1 version
# Key changes:
# - Use universal_work_tracker for all work creation
# - Add cascade metadata to queue entries
# - Emit canon-compliant timeline events
```

#### Day 4: Pipeline Agent Integration
**Files to modify**:
- `governance_processor.py`: Add universal work tracking
- `graph_agent.py`: Add cascade triggers via work tracker
- `reflection_agent.py`: Add work completion tracking

**Integration pattern**:
```python
# Replace all instances of direct queue entry creation with:
work_id = await universal_work_tracker.initiate_work(
    work_type=work_type,
    payload=payload,
    context=work_context
)
```

### Phase 3: Status API & Frontend (Days 5-6)
**Goal**: User-facing status with real-time updates

#### Day 5: Status API
**Create**:
- `api/src/routes/work_status.py` - Universal status endpoint
- `api/src/services/status_derivation.py` - Canon-compliant status logic

**Test**:
```bash
# Verify status derivation for all work types
curl /api/work/{work_id}/status
```

#### Day 6: Frontend Integration
**Create**:
- `web/components/work/UniversalWorkStatus.tsx`
- `web/hooks/useWorkStatus.ts`

**Replace**:
- All dump-specific status components with universal component
- Legacy polling mechanisms with unified approach

### Phase 4: Testing & Legacy Cleanup (Days 7-8)
**Goal**: End-to-end validation and legacy removal

#### Day 7: Canonical Testing
**Create comprehensive test**:
```javascript
// scripts/test_canonical_orchestration.js
// Tests all work types: dumps, manual edits, cascades, document composition
```

#### Day 8: Legacy Cleanup
```bash
# Remove legacy files
git rm docs/PIPELINE_STATUS_INTEGRATION.md
git rm docs/PIPELINE_INTEGRATION_DEVELOPMENT_SEQUENCE.md
git rm api/src/services/cascade_integration_points.md

# Remove legacy code patterns
# - Direct queue entry creation (use universal_work_tracker)
# - Duplicate status derivation (use work_status API)
# - Non-canonical cascade triggers (use enhanced cascade_manager)
```

## Implementation Standards

### File Creation Standards
1. **All new files must**:
   - Include YARNNN Canon v2.1 compliance statement
   - Use universal_work_tracker for work orchestration
   - Emit timeline events for state changes
   - Respect workspace isolation via RLS

2. **No dual approaches**:
   - Single work orchestration system (universal_work_tracker)
   - Single status API (/api/work/{work_id}/status)
   - Single cascade system (enhanced cascade_manager)
   - Single frontend status component (UniversalWorkStatus)

### Integration Standards
```python
# Standard pattern for all async work
async def initiate_async_operation(operation_type, payload, user_context):
    # 1. Create work entry
    work_id = await universal_work_tracker.initiate_work(
        work_type=operation_type,
        payload=payload,
        context=user_context
    )
    
    # 2. Return work_id for status tracking
    return {"work_id": work_id, "status_url": f"/api/work/{work_id}/status"}

# Standard pattern for work completion
async def complete_work(work_id, result):
    # 1. Mark work complete
    await universal_work_tracker.complete_work(work_id, result)
    
    # 2. Trigger cascades if applicable
    await cascade_manager.process_completion(work_id, result)
```

## Validation Checkpoints

### Phase 1 Validation
- [ ] Schema migration successful
- [ ] Universal work tracker can create entries
- [ ] No existing functionality broken

### Phase 2 Validation  
- [ ] Cascade triggers create proper work entries
- [ ] Cascade metadata propagates correctly
- [ ] Timeline events emitted for all state changes

### Phase 3 Validation
- [ ] Status API returns consistent data across all work types
- [ ] Frontend component shows real-time updates
- [ ] User experience smooth for all workflows

### Phase 4 Validation
- [ ] End-to-end test passes for all work types
- [ ] No legacy code patterns remain
- [ ] Canon compliance verified across all components

## Risk Mitigation

### Feature Flags
```python
# Environment-based rollout
ENABLE_UNIVERSAL_ORCHESTRATION = os.getenv("ENABLE_UNIVERSAL_ORCHESTRATION", "false")
ENABLE_ENHANCED_CASCADES = os.getenv("ENABLE_ENHANCED_CASCADES", "false")
ENABLE_STATUS_API = os.getenv("ENABLE_STATUS_API", "true")
```

### Rollback Plan
Each phase is additive and can be disabled independently:
1. Database changes are non-breaking (added columns only)
2. New code paths can be disabled via feature flags
3. Legacy code remains until Phase 4 (safe rollback)

## Success Criteria

### Functional
- [ ] All async work visible to users within 2s
- [ ] P0→P1→P2→P3 cascade completion rate > 99%
- [ ] End-to-end pipeline < 90s
- [ ] Status updates in real-time

### Canon Compliance
- [ ] All substrate mutations via governance
- [ ] Agent intelligence preserved in all operations  
- [ ] Timeline events for every work state change
- [ ] Workspace isolation maintained

### Code Quality
- [ ] No duplicate work orchestration systems
- [ ] Single source of truth for all async work
- [ ] Consistent error handling across all work types
- [ ] No legacy code patterns remain

---

This streamlined execution plan ensures canon purity while implementing universal work orchestration with surgical precision.