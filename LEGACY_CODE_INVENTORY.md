# Legacy Code Inventory

**Created**: 2025-11-02
**Purpose**: Track legacy code for deletion during v4.0 migration

---

## Deletion Strategy

Given the clean cutover approach (no dual systems), legacy code will be deleted in **two phases**:

### Phase 1: Immediate Deletions (Safe Now)
Files that are truly orphaned or self-declare as deprecated

### Phase 2: Migration Deletions (After v4.0 Wired)
Currently operational v2.1/v3.1 code that will be replaced by v4.0

---

## Phase 1: Immediate Safe Deletions

### 1. Universal Work Tracker (v2.1 Legacy)

**File**: `api/src/services/universal_work_tracker.py`

**Status**:
- Self-declares "Canon v2.1 compliant"
- Contains deprecation notice about context_items table merge

**Dependencies**:
- Used by: `work_status.py` (line 33)
- Import: `from services.universal_work_tracker import universal_work_tracker, WorkContext`

**Decision**: ⚠️ **Cannot delete yet** - work_status.py actively uses it

**Action**: Mark for deletion in Phase 2 (when work_status.py is rewritten for v4.0)

---

### 2. Enhanced Cascade Manager (v3.1 Legacy)

**File**: `api/src/services/enhanced_cascade_manager.py`

**Status**:
- References "Canon v3.1"
- Implements cascade pattern (P1→P2→P3) where P2 is deprecated

**Dependencies**:
- Used by: `governance_processor.py` (line 16)
- Import: `from services.enhanced_cascade_manager import canonical_cascade_manager`

**Decision**: ⚠️ **Cannot delete yet** - governance_processor.py still uses it

**Action**: Mark for deletion in Phase 2 (after governance migrates to unified approval)

---

### 3. Canonical Queue Processor (v2.1/v3.1 Hybrid)

**File**: `api/src/services/canonical_queue_processor.py`

**Status**:
- Processes `agent_processing_queue` table (v2.1 concept)
- Currently the **operational agent orchestration system**

**Dependencies**:
- Used by: `agent_server.py` (line 32)
- Used by: `agent_entrypoints.py`
- Used by: `baskets.py`
- Used by: `agents.py`

**Decision**: ⚠️ **Cannot delete yet** - This IS the working system

**Action**: Mark for deletion in Phase 2 (when work_sessions routes replace it)

---

## Phase 2: Migration Deletions (After v4.0 Wired)

These will be deleted **after** v4.0 work_sessions routes are operational:

### 1. Work Status Routes (Queue-Based)

**File**: `api/src/app/routes/work_status.py`

**Current Function**:
- Provides `/api/work/*` endpoints using `agent_processing_queue`
- Endpoints: `/health`, `/{work_id}/status`, `/`, `/initiate`, `/{work_id}/retry`

**Replacement**: New v4.0 routes in `work_sessions.py`:
```python
# New routes (to be created):
POST /api/work/sessions          # Replaces /api/work/initiate
GET  /api/work/sessions/{id}     # Replaces /api/work/{work_id}/status
GET  /api/work/sessions          # Replaces /api/work/ (list)
```

**Migration Plan**:
1. Create new `work_sessions.py` routes
2. Test v4.0 flow end-to-end
3. Update any clients calling old endpoints
4. Delete `work_status.py`

---

### 2. Agent Processing Queue Table

**Table**: `agent_processing_queue`

**Current Function**:
- Primary work tracking table for v2.1/v3.1 system
- Fields: work_id, work_type, processing_state, workspace_id, basket_id, etc.

**Replacement**: `work_sessions` table (already exists, empty)

**Migration Plan**:
1. Ensure all work flows through `work_sessions` table
2. Verify no active work in `agent_processing_queue`
3. Archive table data (optional historical backup)
4. Drop table in migration

**SQL for deletion** (after migration):
```sql
-- Archive if desired
CREATE TABLE agent_processing_queue_archive AS
  SELECT * FROM agent_processing_queue;

-- Then drop
DROP TABLE agent_processing_queue CASCADE;
```

---

### 3. Legacy Governance Patterns

**File**: `api/src/app/agents/pipeline/governance_processor.py`

**Current Function**:
- Uses `enhanced_cascade_manager` for P1→P2→P3 cascades
- Implements proposal-based governance

**Replacement**: `unified_approval.py` (already implemented, just needs wiring)

**Migration Plan**:
1. Rewrite governance_processor to use `UnifiedApprovalOrchestrator`
2. Test with P1 agent extraction flow
3. Delete cascade manager dependency

---

### 4. Legacy Service Files

**Files to Delete**:
- `api/src/services/universal_work_tracker.py`
- `api/src/services/enhanced_cascade_manager.py`
- `api/src/services/canonical_queue_processor.py`

**When**: After all routes migrated to v4.0 work_sessions

---

## Files That Stay (Not Legacy)

These are **current and correct**, even for v4.0:

### Keep: Core Substrate
- All block-related routes and services
- Document composition (P4)
- Timeline events
- Semantic layer services

### Keep: Agent Pipeline (with modifications)
- `ImprovedP1SubstrateAgent` - Keep, will feed into work_sessions
- P3 reflection agents - Keep, will create work_artifacts
- P4 composition - Keep, will create work_artifacts

### Keep: Supporting Services
- `status_derivation_service.py` - Might need updates for work_sessions
- `semantic_primitives.py` - Core functionality
- All embedding and vector services

---

## Deprecation Markers to Add

Before deleting operational code, let's add deprecation notices:

### 1. Mark work_status.py for deprecation

Add to top of file:
```python
"""
DEPRECATION NOTICE (v4.0 Migration):
This route will be replaced by api/src/app/routes/work_sessions.py
Current status: Operational (will be removed after v4.0 work_sessions wired)
See: LEGACY_CODE_INVENTORY.md
"""
```

### 2. Mark canonical_queue_processor.py for deprecation

Add to top of file:
```python
"""
DEPRECATION NOTICE (v4.0 Migration):
Queue-based orchestration will be replaced by work_sessions model
Current status: Operational (will be removed after v4.0 work_sessions wired)
See: LEGACY_CODE_INVENTORY.md
"""
```

### 3. Mark universal_work_tracker.py for deprecation

Already has v3.0 deprecation notice, update to:
```python
"""
DEPRECATION NOTICE (v4.0 Migration):
Universal Work Tracker (v2.1) will be replaced by work_sessions table
Current status: Used by work_status.py (will be removed in v4.0)
See: LEGACY_CODE_INVENTORY.md
"""
```

---

## Deletion Checklist (For Phase 2)

When v4.0 work_sessions routes are operational, follow this checklist:

### Pre-Deletion Verification
- [ ] All v4.0 work_sessions routes created and tested
- [ ] UnifiedApprovalOrchestrator wired to governance endpoint
- [ ] Agents create work_sessions instead of queue entries
- [ ] No active work items in agent_processing_queue table
- [ ] Frontend updated to call new endpoints

### Safe Deletion Order
1. [ ] Delete `work_status.py` (old work routes)
2. [ ] Delete `universal_work_tracker.py` (v2.1 tracker)
3. [ ] Delete `canonical_queue_processor.py` (queue processor)
4. [ ] Update `governance_processor.py` (remove cascade manager dependency)
5. [ ] Delete `enhanced_cascade_manager.py` (v3.1 cascade)
6. [ ] Archive and drop `agent_processing_queue` table

### Post-Deletion Verification
- [ ] All routes in `/api/work/*` use work_sessions
- [ ] Governance flows through UnifiedApprovalOrchestrator
- [ ] No imports of deleted files remain
- [ ] Tests updated to use new system
- [ ] Documentation updated

---

## Estimated Timeline

**Phase 1 (Immediate)**:
- Add deprecation notices to legacy files
- Document inventory (this file)
- **Time**: 1 hour

**Phase 2 (After v4.0 Wired)**:
- Delete legacy files following checklist
- Archive agent_processing_queue data
- Clean up imports
- **Time**: 2-3 hours (straightforward after v4.0 complete)

---

## Summary

**Total Legacy Code to Delete** (Phase 2):
- 3 service files (~1500 lines)
- 1 route file (~475 lines)
- 1 database table (agent_processing_queue)
- Various imports and references

**Current Status**: All marked files are **operational** and cannot be deleted until v4.0 work_sessions system is wired and tested.

**Next Action**: Add deprecation notices, proceed with v4.0 implementation, delete in migration phase.
