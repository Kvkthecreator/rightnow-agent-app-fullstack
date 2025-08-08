# ENLIGHTENED DEVELOPMENT SEQUENCE

## REALITY CHECK:
✅ Python Context OS backend DEPLOYED at api.yarnnn.com
✅ Database has full block lifecycle (PROPOSED→ACCEPTED→LOCKED)
✅ 22+ agents ready to process
✅ Event system fully implemented
❌ Frontend calling mocks instead of real backend
❌ Block states invisible to users
❌ Document composition not using blocks

## NEW SEQUENCE - Wire What Exists:

### CHAPTER 1: RECONNECT (2-4 hours)
□ Test api.yarnnn.com/api/agent endpoint with real basket_id
□ Fix /api/intelligence/generate to call real backend
□ Remove ALL mock fallbacks
□ Verify events are being created in database
□ SUCCESS: User input → Real agent response (no mocks)

### CHAPTER 2: EXPOSE BLOCKS (4-6 hours)
□ Query blocks table WHERE state='PROPOSED' 
□ Create BlockReview component showing pending blocks
□ Add Accept/Reject buttons that update block state
□ Show block state badges (colored chips)
□ SUCCESS: Users see and can approve AI-proposed blocks

### CHAPTER 3: DOCUMENT COMPOSITION (6-8 hours)
□ Update document creation to select from ACCEPTED blocks
□ Show which blocks are in each document
□ Enable block reuse across documents
□ Add narrative scaffolding between blocks
□ SUCCESS: Documents are true compositions, not static text

### CHAPTER 4: AGENT ATTRIBUTION (2-3 hours)
□ Show which agent created each block
□ Display agent confidence scores
□ Add agent explanations/reasoning
□ Show event timeline per basket
□ SUCCESS: Full transparency of Context OS processing

### CHAPTER 5: POLISH UX (4-6 hours)
□ Real-time updates via WebSocket or polling
□ Smooth transitions for state changes
□ Loading states during agent processing
□ Success notifications for approvals
□ SUCCESS: Feels like intelligent assistant, not database

**Total: ~24 hours to full Context OS experience**

## CHAPTER 1: RECONNECT (TODAY - 2 hours)

### 1. Test Real Backend Connectivity
```bash
# Test the actual agent endpoint
curl -X POST https://api.yarnnn.com/api/agent \
  -H 'Content-Type: application/json' \
  -d '{"basket_id": "da75cf04-65e5-46ac-940a-74e2ffe077a2"}'

# Test with realistic payload
curl -X POST https://api.yarnnn.com/api/agent \
  -H 'Content-Type: application/json' \
  -d '{
    "basket_id": "da75cf04-65e5-46ac-940a-74e2ffe077a2",
    "workspace_id": "workspace-123",
    "agent_type": "block_manager",
    "payload": {
      "content": "Test content for block generation"
    }
  }'
```

### 2. Fix Intelligence Route
File: `web/app/api/intelligence/generate/[basketId]/route.ts`
- ✅ Already updated to call api.yarnnn.com/api/agent
- ✅ Removed mock fallbacks
- ✅ Uses NEXT_PUBLIC_API_BASE_URL

### 3. Validation Test
- Open basket page
- Use thinking partner
- Should get REAL agent response
- Check database for new blocks/events

## CHAPTER 2: EXPOSE BLOCKS (TONIGHT - 4 hours)

### BlockReview Component
```typescript
// web/components/blocks/BlockReview.tsx
import { useState, useEffect } from 'react';
import { createClientSupabaseClient } from '@/lib/supabaseClient';

interface Block {
  id: string;
  content: string;
  state: 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'LOCKED';
  semantic_type: string;
  created_by_agent: boolean;
  agent_source?: string;
  created_at: string;
}

export function BlockReview({ basketId }: { basketId: string }) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchProposedBlocks();
  }, [basketId]);
  
  const fetchProposedBlocks = async () => {
    const supabase = createClientSupabaseClient();
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .eq('basket_id', basketId)
      .eq('state', 'PROPOSED')
      .order('created_at', { ascending: false });
    
    if (!error) {
      setBlocks(data || []);
    }
    setLoading(false);
  };
  
  const handleAccept = async (blockId: string) => {
    const supabase = createClientSupabaseClient();
    const { error } = await supabase
      .from('blocks')
      .update({ state: 'ACCEPTED' })
      .eq('id', blockId);
    
    if (!error) {
      await fetchProposedBlocks();
    }
  };
  
  const handleReject = async (blockId: string) => {
    const supabase = createClientSupabaseClient();
    const { error } = await supabase
      .from('blocks')
      .update({ state: 'REJECTED' })
      .eq('id', blockId);
    
    if (!error) {
      await fetchProposedBlocks();
    }
  };
  
  if (loading) return <div>Loading proposed blocks...</div>;
  if (blocks.length === 0) return <div>No blocks pending review</div>;
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Blocks Pending Review ({blocks.length})
      </h3>
      {blocks.map((block) => (
        <div key={block.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
              {block.semantic_type} - PROPOSED
            </span>
            {block.agent_source && (
              <span className="text-xs text-gray-500">
                by {block.agent_source}
              </span>
            )}
          </div>
          <p className="mb-3 text-gray-700">
            {block.content.slice(0, 200)}
            {block.content.length > 200 && '...'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleAccept(block.id)}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Accept
            </button>
            <button
              onClick={() => handleReject(block.id)}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Integration Point
File: `web/app/baskets/[id]/page.tsx`
```typescript
import { BlockReview } from '@/components/blocks/BlockReview';

// Add in basket page layout:
<BlockReview basketId={params.id} />
```

## CHAPTER 3: DOCUMENT COMPOSITION (TOMORROW - 6 hours)

### Updated Document Creation Flow
```typescript
// web/components/documents/DocumentComposer.tsx
export function DocumentComposer({ basketId }: { basketId: string }) {
  const [acceptedBlocks, setAcceptedBlocks] = useState<Block[]>([]);
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [narrative, setNarrative] = useState('');
  
  useEffect(() => {
    fetchAcceptedBlocks();
  }, [basketId]);
  
  const fetchAcceptedBlocks = async () => {
    const supabase = createClientSupabaseClient();
    const { data } = await supabase
      .from('blocks')
      .select('*')
      .eq('basket_id', basketId)
      .eq('state', 'ACCEPTED')
      .order('created_at');
    
    setAcceptedBlocks(data || []);
  };
  
  const createDocument = async () => {
    const supabase = createClientSupabaseClient();
    
    // Create document with block references
    const documentContent = {
      blocks: selectedBlocks,
      narrative,
      composition_type: 'block_based'
    };
    
    const { data, error } = await supabase
      .from('documents')
      .insert({
        basket_id: basketId,
        title: 'Composed Document',
        content: JSON.stringify(documentContent),
        created_from_blocks: selectedBlocks
      });
    
    return data;
  };
  
  return (
    <div className="space-y-6">
      <h3>Available Blocks ({acceptedBlocks.length})</h3>
      {acceptedBlocks.map((block) => (
        <div key={block.id} className="border rounded p-3">
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={selectedBlocks.includes(block.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedBlocks([...selectedBlocks, block.id]);
                } else {
                  setSelectedBlocks(selectedBlocks.filter(id => id !== block.id));
                }
              }}
            />
            <div>
              <div className="font-medium">{block.semantic_type}</div>
              <p className="text-gray-600">{block.content.slice(0, 150)}...</p>
              <small className="text-gray-400">by {block.agent_source}</small>
            </div>
          </label>
        </div>
      ))}
      
      <div>
        <label className="block mb-2 font-medium">Narrative Context</label>
        <textarea
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          className="w-full h-32 p-3 border rounded"
          placeholder="Add narrative context to connect your selected blocks..."
        />
      </div>
      
      <button
        onClick={createDocument}
        disabled={selectedBlocks.length === 0}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
      >
        Compose Document from {selectedBlocks.length} Blocks
      </button>
    </div>
  );
}
```

## QUICK WINS (Do Today - 2 hours total):

### 1. Fix One API Call (30 min)
✅ Already completed - intelligence route now calls real backend

### 2. Show PROPOSED Blocks Count (30 min)
```typescript
// Add to basket header or sidebar
const { data: proposedCount } = useQuery({
  queryKey: ['proposed-blocks', basketId],
  queryFn: async () => {
    const { count } = await supabase
      .from('blocks')
      .select('*', { count: 'exact', head: true })
      .eq('basket_id', basketId)
      .eq('state', 'PROPOSED');
    return count || 0;
  }
});

// Display: "Blocks pending review: {proposedCount}"
```

### 3. Add One Accept Button (1 hour)
✅ Included in BlockReview component above

### 4. Display Agent Name (30 min)
```typescript
// In any component showing generated content:
{block.created_by_agent && (
  <div className="text-xs text-gray-500 mt-1">
    Generated by {block.agent_source || 'AI Agent'}
  </div>
)}
```

## VALIDATION TEST:
**User Story**: "I paste my thoughts, AI suggests structured blocks, I review and accept them, then compose them into a document"

**Test Flow**:
1. User adds content via thinking partner
2. Backend agents process → create PROPOSED blocks
3. BlockReview component shows pending blocks
4. User accepts some, rejects others
5. DocumentComposer shows ACCEPTED blocks
6. User selects blocks + adds narrative → creates document
7. Document shows block attribution and composition

**Success Metric**: End-to-end flow works without mocks

## SUCCESS METRICS PER CHAPTER:

### Chapter 1: Backend Connected
- [ ] No mock responses in console logs
- [ ] Real agent data appearing in database
- [ ] Error handling shows backend issues clearly

### Chapter 2: Blocks Exposed  
- [ ] PROPOSED blocks visible in UI
- [ ] Accept/Reject buttons work
- [ ] Block states update in real-time
- [ ] Agent attribution shown

### Chapter 3: True Composition
- [ ] Documents created from selected blocks
- [ ] Block reuse across multiple documents
- [ ] Narrative scaffolding preserved
- [ ] Block metadata visible in documents

### Chapter 4: Full Transparency
- [ ] Agent confidence scores displayed
- [ ] Event timeline shows processing history
- [ ] Block reasoning/explanations available
- [ ] Complete audit trail accessible

### Chapter 5: Polished Experience
- [ ] Real-time updates without page refresh
- [ ] Smooth state transitions
- [ ] Loading states during processing
- [ ] Success notifications and feedback

**If all chapters complete: Full Context OS experience achieved.**