# YARNNN Implementation Roadmap

**Version**: 1.0  
**Status**: Implementation Guide  
**Purpose**: Step-by-step roadmap to implement async agent intelligence

## 🎯 Current State

### What Works ✅
- User input capture via `/api/dumps/new`
- Raw dumps stored in database
- Supabase RPC functions for atomic operations
- Frontend displays basic information
- Agent backend exists but is disconnected

### What's Missing ❌
- No trigger connects dumps to agents
- Agent processing queue doesn't exist
- Frontend shows fake/computed substrate instead of agent-processed
- Contracts misaligned between frontend/RPC/agents

## 🚀 Implementation Plan

### Phase 1: Foundation (Database & Contracts) - 2 hours

**1.1 Create Agent Processing Queue** (30 min)
```sql
-- Create queue table
CREATE TABLE agent_processing_queue (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  dump_id uuid REFERENCES raw_dumps(id) NOT NULL,
  basket_id uuid REFERENCES baskets(id) NOT NULL,  
  workspace_id uuid REFERENCES workspaces(id) NOT NULL,
  processing_state processing_state DEFAULT 'pending',
  claimed_at timestamp,
  claimed_by text,
  completed_at timestamp,
  attempts int DEFAULT 0,
  error_message text,
  created_at timestamp DEFAULT now()
);

-- Create processing states
CREATE TYPE processing_state AS ENUM (
  'pending', 'claimed', 'processing', 'completed', 'failed'
);

-- Add indexes
CREATE INDEX idx_queue_state_created ON agent_processing_queue(processing_state, created_at);
CREATE INDEX idx_queue_workspace ON agent_processing_queue(workspace_id, processing_state);
```

**1.2 Create Database Trigger** (15 min)
```sql
-- Trigger function
CREATE OR REPLACE FUNCTION queue_agent_processing() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO agent_processing_queue (dump_id, basket_id, workspace_id)
  SELECT NEW.id, NEW.basket_id, b.workspace_id
  FROM baskets b WHERE b.id = NEW.basket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER after_dump_insert
AFTER INSERT ON raw_dumps
FOR EACH ROW 
EXECUTE FUNCTION queue_agent_processing();
```

**1.3 Create Queue Management RPCs** (30 min)
```sql
-- Claim dumps for processing  
CREATE OR REPLACE FUNCTION fn_claim_next_dumps(
  p_worker_id text,
  p_limit int DEFAULT 10
) RETURNS SETOF agent_processing_queue AS $$
BEGIN
  RETURN QUERY
  UPDATE agent_processing_queue
  SET processing_state = 'claimed', claimed_at = now(), claimed_by = p_worker_id
  WHERE id IN (
    SELECT id FROM agent_processing_queue
    WHERE processing_state = 'pending'
    ORDER BY created_at LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Update processing state
CREATE OR REPLACE FUNCTION fn_update_queue_state(
  p_id uuid,
  p_state processing_state,
  p_error text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  UPDATE agent_processing_queue 
  SET 
    processing_state = p_state,
    completed_at = CASE WHEN p_state = 'completed' THEN now() ELSE NULL END,
    error_message = p_error,
    attempts = attempts + CASE WHEN p_state = 'failed' THEN 1 ELSE 0 END
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;
```

**1.4 Align Contracts** (45 min)
- Update `/shared/contracts/context.ts` → Match RPC field names
- Update `/shared/contracts/blocks.ts` → Consistent naming
- Update `/shared/contracts/dumps.ts` → Align with RPCs
- Update all API routes to use aligned contracts

### Phase 2: Agent Integration (Agent Backend) - 3 hours

**2.1 Update Agent Service** (2 hours)
```python
# api/src/services/agent_processor.py
class AgentProcessor:
    async def run_processing_loop(self):
        while True:
            dumps = await self.claim_dumps()
            for dump_entry in dumps:
                await self.process_dump(dump_entry)
            await asyncio.sleep(10)
    
    async def process_dump(self, queue_entry):
        try:
            await self.update_state(queue_entry['id'], 'processing')
            
            # P1: Extract substrate
            await self.extract_blocks(queue_entry['dump_id'])
            await self.extract_context_items(queue_entry['dump_id'])
            
            # P2: Map relationships  
            await self.map_relationships(queue_entry['dump_id'])
            
            await self.update_state(queue_entry['id'], 'completed')
        except Exception as e:
            await self.update_state(queue_entry['id'], 'failed', str(e))
```

**2.2 Connect to RPCs** (1 hour)
- Update agent to call substrate-writing RPCs
- Ensure proper authentication (service_role client)
- Add error handling and retries

### Phase 3: Frontend Updates (UI) - 2 hours

**3.1 Add Processing State Display** (1 hour)
```typescript
// Show queue status
export function ProcessingIndicator({ dumpId }: { dumpId: string }) {
  const { data: queueStatus } = useQueueStatus(dumpId);
  
  return (
    <div className="processing-status">
      {queueStatus?.processing_state === 'pending' && (
        <span>⏳ Waiting for analysis...</span>
      )}
      {queueStatus?.processing_state === 'processing' && (
        <span>🧠 Analyzing content...</span>
      )}
      {queueStatus?.processing_state === 'completed' && (
        <span>✅ Analysis complete</span>
      )}
    </div>
  );
}
```

**3.2 Remove Fake Substrate Generation** (1 hour)
- Remove client-side reflection computation
- Update projection routes to show real substrate or "processing" state
- Remove hardcoded pattern/tension/question computation

### Phase 4: Monitoring & Operations - 1 hour

**4.1 Create Monitoring Views**
```sql
-- Queue health
CREATE VIEW queue_health AS
SELECT processing_state, COUNT(*) as count
FROM agent_processing_queue GROUP BY processing_state;

-- Processing performance
CREATE VIEW processing_performance AS  
SELECT AVG(EXTRACT(epoch FROM (completed_at - created_at))) as avg_duration
FROM agent_processing_queue WHERE processing_state = 'completed';
```

**4.2 Add Admin Interface**
- Queue status dashboard
- Failed job retry buttons
- Agent health monitoring

## 🎯 Success Criteria

### Technical
- [ ] Every raw dump creates queue entry automatically
- [ ] Agent backend processes queue within 30 seconds
- [ ] Real substrate appears in UI (no fake computation)
- [ ] Failed jobs retry automatically
- [ ] Zero manual intervention required

### User Experience  
- [ ] Upload gives immediate confirmation
- [ ] Processing state clearly visible
- [ ] Substrate appears progressively
- [ ] No confusion about what's real vs processed
- [ ] System feels intelligent, not mechanical

## 🚨 Critical Path Dependencies

1. **Database changes must deploy first** - Queue table, triggers, RPCs
2. **Agent backend must be updated** - Before frontend changes
3. **Contracts must align** - Before agent processing works
4. **Frontend updated last** - To show real processing states

## ⚡ Quick Wins

If time is limited, implement in this order:
1. Database queue (enables async processing)
2. Agent polling (creates real substrate)
3. Frontend status (shows progress)

The system will work with just these three pieces.

## 🔧 Testing Strategy

### Unit Tests
- Queue management RPCs
- Agent processing logic  
- Contract alignment

### Integration Tests
- End-to-end: Upload → Queue → Process → Display
- Failure scenarios: Agent down, RPC errors
- Load testing: Multiple dumps, multiple agents

### User Acceptance
- Upload experience feels immediate
- Processing progress is clear
- Final result shows real intelligence

---

**Total Time Estimate: 8 hours**  
**Critical Path: Database → Agents → Frontend**  
**Risk Mitigation: Test each phase thoroughly before proceeding**