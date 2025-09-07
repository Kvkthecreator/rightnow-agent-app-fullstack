# Cascade Integration Points

## Where to Add Cascade Triggers

### 1. P1 → P2 Cascade Points

#### In `governance_processor.py` after auto-execution:
```python
# After successful auto-execution in _auto_execute_proposal()
from services.cascade_manager import cascade_manager

# After line: self.logger.info(f"Auto-executed proposal {proposal_id} with {len(operations)} operations")
# Extract created substrate IDs from execution_log
substrate_created = {
    'blocks': [log['result_data']['created_id'] for log in execution_log 
              if log['success'] and log['operation_type'] == 'CreateBlock'],
    'context_items': [log['result_data']['created_id'] for log in execution_log 
                     if log['success'] and log['operation_type'] == 'CreateContextItem']
}

# Trigger P1→P2 cascade
await cascade_manager.trigger_p1_to_p2_cascade(
    proposal_id=proposal_id,
    basket_id=basket_id,
    workspace_id=workspace_id,
    substrate_created=substrate_created
)
```

#### In approval route after manual approval:
```typescript
// In /web/app/api/baskets/[id]/proposals/[proposalId]/approve/route.ts
// After successful execution (line ~190)

// Import cascade trigger
import { triggerP1toP2Cascade } from '@/lib/pipeline/cascadeManager';

// Extract substrate IDs
const substrateCreated = {
  blocks: executionLog
    .filter(log => log.success && log.operation_type === 'CreateBlock')
    .map(log => log.result_data.created_id),
  context_items: executionLog
    .filter(log => log.success && log.operation_type === 'CreateContextItem')
    .map(log => log.result_data.created_id)
};

// Trigger cascade
if (substrateCreated.blocks.length > 0 || substrateCreated.context_items.length > 0) {
  await triggerP1toP2Cascade({
    proposalId: proposal.id,
    basketId: basket.id,
    workspaceId: workspace.id,
    substrateCreated
  });
}
```

### 2. P2 → P3 Cascade Points

#### In `graph_agent.py` after relationship creation:
```python
# At the end of process_basket() method, after relationship creation
from services.cascade_manager import cascade_manager

# After logging relationships created
if created_relationships > 0:
    work_result = {
        'relationships_created': created_relationships,
        'basket_id': str(basket_id)
    }
    
    await cascade_manager.trigger_cascade(
        completed_work_type='P2_GRAPH',
        basket_id=basket_id,
        workspace_id=workspace_id,
        work_result=work_result
    )
```

### 3. Queue Processor Integration

#### In `canonical_queue_processor.py`:
```python
# Import cascade manager
from services.cascade_manager import cascade_manager

# Modify _process_dump_canonically() to trigger cascades
# After P1 completion (around line 230)
if governance_result['proposals_created'] > 0:
    # Existing comment: "P2/P3 deferred until proposals are approved"
    # Add: Check if auto-approval occurred
    if governance_result.get('auto_approved', False):
        await cascade_manager.trigger_cascade(
            completed_work_type='P1_SUBSTRATE',
            basket_id=basket_id,
            workspace_id=workspace_id,
            work_result=governance_result
        )
```

### 4. Database Trigger for Queue Creation

```sql
-- Trigger to auto-create queue entries when raw_dumps are inserted
CREATE OR REPLACE FUNCTION create_canonical_queue_entry()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create queue entry if not already exists
    IF NOT EXISTS (
        SELECT 1 FROM canonical_queue 
        WHERE dump_id = NEW.id 
        AND work_type = 'P1_SUBSTRATE'
    ) THEN
        INSERT INTO canonical_queue (
            id,
            dump_id,
            basket_id,
            workspace_id,
            work_type,
            status,
            priority,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            NEW.id,
            NEW.basket_id,
            NEW.workspace_id,
            'P1_SUBSTRATE',
            'pending',
            5,
            NOW(),
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER tr_raw_dump_queue_creation
AFTER INSERT ON raw_dumps
FOR EACH ROW
EXECUTE FUNCTION create_canonical_queue_entry();
```

### 5. Queue Health Monitoring Endpoint

```python
# Add to agent_server.py or create new monitoring route
@router.get("/api/queue/health")
async def get_queue_health():
    """Get canonical queue processing health metrics."""
    
    # Get queue stats
    pending = await supabase.table('canonical_queue')\
        .select('work_type', count=True)\
        .eq('status', 'pending')\
        .execute()
        
    processing = await supabase.table('canonical_queue')\
        .select('work_type', 'worker_id')\
        .eq('status', 'processing')\
        .execute()
        
    # Get recent completions
    recent_completed = await supabase.table('canonical_queue')\
        .select('work_type', 'updated_at')\
        .eq('status', 'completed')\
        .gte('updated_at', datetime.now() - timedelta(hours=1))\
        .execute()
        
    # Get cascade metrics
    cascade_events = await supabase.table('timeline_events')\
        .select('event_data')\
        .eq('event_type', 'pipeline.cascade')\
        .gte('created_at', datetime.now() - timedelta(hours=1))\
        .execute()
    
    return {
        "queue_health": {
            "pending_by_type": count_by_type(pending.data),
            "processing_count": len(processing.data),
            "completed_last_hour": len(recent_completed.data),
            "cascade_triggers_last_hour": len(cascade_events.data)
        },
        "worker_status": {
            "active_workers": list(set(p['worker_id'] for p in processing.data if p['worker_id'])),
            "queue_processor_running": canonical_processor.running if canonical_processor else False
        }
    }
```

## Testing the Integration

### Manual Test Script:
```javascript
// scripts/test_cascade_flow.js
async function testCascadeFlow() {
    // 1. Create dump
    const dump = await createTestDump();
    console.log(`Created dump: ${dump.id}`);
    
    // 2. Monitor P1 processing
    const p1Entry = await waitForQueueEntry(dump.id, 'P1_SUBSTRATE');
    console.log(`P1 queue entry created: ${p1Entry.id}`);
    
    // 3. Wait for P1 completion
    await waitForQueueStatus(p1Entry.id, 'completed');
    console.log('P1 completed');
    
    // 4. Check for P1→P2 cascade
    const p2Entry = await findQueueEntry({
        basket_id: dump.basket_id,
        work_type: 'P2_GRAPH',
        'metadata.cascade_trigger.source_work_type': 'P1_SUBSTRATE'
    });
    console.log(`P2 cascade triggered: ${p2Entry ? 'YES' : 'NO'}`);
    
    // Continue monitoring...
}
```

## Priority Integration Order

1. **Database trigger** - Enable automatic queue creation
2. **Cascade manager integration** in governance_processor.py
3. **Queue health endpoint** - Monitor cascade behavior
4. **P2→P3 integration** in graph_agent.py
5. **Frontend monitoring** - Visualize cascade flow