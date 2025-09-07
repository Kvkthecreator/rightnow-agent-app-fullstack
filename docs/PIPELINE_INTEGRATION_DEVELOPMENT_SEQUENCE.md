# Pipeline Integration Development Sequence

## Overview
This document outlines the development sequence to complete the P0→P1→P2→P3→P4 pipeline integration, focusing on operational deployment and cascade triggering between pipeline stages.

## Current State Assessment
- ✅ All pipeline agents (P0-P4) are fully implemented
- ✅ P1 Evolution Agent with governance and auto-approval complete
- ❌ Queue processor deployment issues (no automatic processing)
- ❌ No cascade triggering between pipeline stages
- ❌ End-to-end pipeline testing not possible without orchestration

## Development Sequence

### Phase 1: Queue Processor Deployment & Diagnostics
**Goal**: Get canonical queue processor running and processing work automatically

#### 1.1 Database Trigger Investigation
```sql
-- Check if triggers exist for auto-queue creation
-- Expected: raw_dumps insert → canonical_queue entry
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table IN ('raw_dumps', 'canonical_queue');
```

**Tasks**:
- [ ] Verify database triggers exist for queue creation
- [ ] If missing, create trigger: `raw_dump_insert → canonical_queue_entry`
- [ ] Test trigger with manual raw_dump insertion

#### 1.2 Queue Processor Health Check
```python
# Add health endpoint to canonical_queue_processor.py
@router.get("/health/queue-processor")
async def queue_processor_health():
    return {
        "running": processor.running,
        "worker_id": processor.worker_id,
        "pending_items": await get_pending_count(),
        "processed_today": await get_processed_count()
    }
```

**Tasks**:
- [ ] Add queue processor health endpoint
- [ ] Add queue metrics (pending, processing, completed counts)
- [ ] Deploy and verify endpoint accessibility

#### 1.3 Queue Worker Startup
```python
# Ensure queue processor starts with server
# In agent_server.py startup event
async def startup_event():
    await start_canonical_queue_processor()
    logger.info("Canonical queue processor started")
```

**Tasks**:
- [ ] Verify queue processor initialization in server startup
- [ ] Add startup logging to confirm worker creation
- [ ] Test with server restart

### Phase 2: Cascade Triggering Implementation
**Goal**: Ensure each pipeline stage triggers the next upon completion

#### 2.1 P1→P2 Cascade Trigger
```python
# In governance approval/auto-execution after substrate creation
async def trigger_p2_cascade(proposal_id: str, basket_id: str, workspace_id: str):
    """Queue P2 graph processing after P1 substrate creation"""
    
    # Get created substrate IDs from proposal execution
    created_substrate = extract_created_ids(proposal.execution_log)
    
    # Queue P2 work
    p2_entry = {
        'basket_id': basket_id,
        'workspace_id': workspace_id,
        'work_type': 'P2_GRAPH',
        'status': 'pending',
        'metadata': {
            'trigger': 'P1_completion',
            'source_proposal': proposal_id,
            'substrate_ids': created_substrate
        }
    }
    
    await supabase.table('canonical_queue').insert(p2_entry).execute()
```

**Implementation locations**:
- [ ] Add to `governance_processor.py` after auto-execution
- [ ] Add to approval route after manual approval
- [ ] Include substrate IDs for targeted P2 processing

#### 2.2 P2→P3 Cascade Trigger
```python
# In P2 graph agent completion
async def trigger_p3_cascade(basket_id: str, workspace_id: str, relationships_created: int):
    """Queue P3 reflection after P2 relationship mapping"""
    
    if relationships_created > 0:
        p3_entry = {
            'basket_id': basket_id,
            'workspace_id': workspace_id,
            'work_type': 'P3_REFLECTION',
            'status': 'pending',
            'metadata': {
                'trigger': 'P2_completion',
                'new_relationships': relationships_created
            }
        }
        
        await supabase.table('canonical_queue').insert(p3_entry).execute()
```

**Tasks**:
- [ ] Modify P2GraphAgent to trigger P3 on completion
- [ ] Only trigger if new relationships were created
- [ ] Add completion metrics

#### 2.3 Cascade Configuration
```python
# Add cascade configuration to control flow
CASCADE_CONFIG = {
    'P1_SUBSTRATE': {
        'triggers_next': 'P2_GRAPH',
        'condition': lambda result: result.get('proposals_created', 0) > 0,
        'delay_seconds': 5  # Allow governance operations to complete
    },
    'P2_GRAPH': {
        'triggers_next': 'P3_REFLECTION',
        'condition': lambda result: result.get('relationships_created', 0) > 0,
        'delay_seconds': 0
    },
    'P3_REFLECTION': {
        'triggers_next': None,  # P4 is on-demand only
        'condition': None
    }
}
```

**Tasks**:
- [ ] Implement cascade configuration system
- [ ] Add conditional triggering based on results
- [ ] Support configurable delays between stages

### Phase 3: Queue Processing Enhancements
**Goal**: Improve reliability and observability of queue processing

#### 3.1 Queue Entry State Machine
```python
# Enhance queue entry states for better tracking
QUEUE_STATES = {
    'pending': 'Waiting for worker',
    'claimed': 'Worker assigned',
    'processing': 'Agent executing',
    'cascading': 'Triggering next stage',
    'completed': 'Successfully processed',
    'failed': 'Processing failed',
    'retrying': 'Retry scheduled'
}
```

**Tasks**:
- [ ] Add 'cascading' state for cascade operations
- [ ] Implement retry logic with backoff
- [ ] Add failure categorization

#### 3.2 Queue Monitoring Dashboard
```typescript
// Frontend component to monitor queue health
interface QueueMonitor {
  pendingByType: Record<WorkType, number>
  processingByWorker: Record<string, QueueEntry>
  recentFailures: FailedEntry[]
  cascadeFlow: CascadeVisualization
}
```

**Tasks**:
- [ ] Create API endpoint for queue statistics
- [ ] Build monitoring UI component
- [ ] Add cascade flow visualization

### Phase 4: End-to-End Testing Framework
**Goal**: Comprehensive testing of full pipeline flow

#### 4.1 Pipeline Test Harness
```javascript
// Test script for full pipeline execution
async function testFullPipeline() {
  // 1. Create test dump
  const dump = await createTestDump(basketId, "Test content for full pipeline");
  
  // 2. Monitor queue for P1 processing
  const p1Result = await waitForQueueWork(dump.id, 'P1_SUBSTRATE', timeout: 30);
  assert(p1Result.status === 'completed');
  
  // 3. Verify P1→P2 cascade
  const p2Entry = await waitForQueueEntry(basketId, 'P2_GRAPH', timeout: 10);
  assert(p2Entry.metadata.trigger === 'P1_completion');
  
  // 4. Monitor P2 completion
  const p2Result = await waitForQueueWork(p2Entry.id, 'P2_GRAPH', timeout: 30);
  assert(p2Result.relationships_created > 0);
  
  // 5. Verify P2→P3 cascade
  const p3Entry = await waitForQueueEntry(basketId, 'P3_REFLECTION', timeout: 10);
  
  // 6. Verify final substrate state
  await verifySubstrateIntegrity(basketId);
}
```

**Test scenarios**:
- [ ] Single dump → full pipeline
- [ ] Batch dumps → unified processing
- [ ] Failed stage → retry behavior
- [ ] High load → queue performance

#### 4.2 Substrate Integrity Validation
```python
async def validate_substrate_integrity(basket_id: str):
    """Ensure substrate consistency after pipeline processing"""
    
    # Check for orphaned elements
    orphaned_blocks = await find_blocks_without_proposals(basket_id)
    orphaned_items = await find_items_without_references(basket_id)
    
    # Check for missing relationships
    unconnected_substrate = await find_isolated_substrate(basket_id)
    
    # Check for processing gaps
    unprocessed_dumps = await find_dumps_without_proposals(basket_id)
    
    return IntegrityReport(
        orphaned_elements=len(orphaned_blocks) + len(orphaned_items),
        missing_relationships=len(unconnected_substrate),
        processing_gaps=len(unprocessed_dumps)
    )
```

**Tasks**:
- [ ] Implement integrity validation functions
- [ ] Create repair functions for common issues
- [ ] Add to monitoring dashboard

### Phase 5: Production Readiness
**Goal**: Ensure system is ready for production deployment

#### 5.1 Performance Optimization
- [ ] Add queue indexing for faster claims
- [ ] Implement connection pooling for agents
- [ ] Add caching for frequently accessed substrate

#### 5.2 Error Recovery
- [ ] Implement dead letter queue for failed items
- [ ] Add manual retry capabilities
- [ ] Create error categorization system

#### 5.3 Operational Tooling
- [ ] Queue management CLI commands
- [ ] Bulk reprocessing capabilities
- [ ] Pipeline pause/resume functionality

## Success Metrics

### Queue Processing
- Queue items processed within 30 seconds of creation
- Less than 1% failure rate for pipeline stages
- Successful cascade triggering 99%+ of the time

### Pipeline Flow
- P0→P1: < 1 minute for single dump
- P1→P2: < 30 seconds after approval
- P2→P3: < 30 seconds after relationship creation
- Full pipeline: < 3 minutes end-to-end

### System Health
- Queue processor uptime > 99.9%
- No orphaned queue entries > 1 hour old
- Cascade triggers never missed

## Development Timeline

### Week 1: Queue Processor Deployment
- Days 1-2: Database triggers and health checks
- Days 3-4: Queue worker startup and monitoring
- Day 5: Basic testing and verification

### Week 2: Cascade Implementation
- Days 1-2: P1→P2 cascade trigger
- Days 3-4: P2→P3 cascade trigger
- Day 5: Cascade configuration system

### Week 3: Testing & Monitoring
- Days 1-2: Test harness development
- Days 3-4: Monitoring dashboard
- Day 5: End-to-end testing

### Week 4: Production Readiness
- Days 1-2: Performance optimization
- Days 3-4: Error recovery systems
- Day 5: Final testing and documentation

---

This development sequence prioritizes getting the core pipeline flow working first, then adds robustness and observability layers for production deployment.