# Frontend Memory Capture - UX Refactoring Plan

**Date:** 2025-10-15
**Status:** Analysis Complete → Ready for Implementation
**Priority:** HIGH (Production UX Issue)

---

## 🔴 Current Problems (As Observed in Production)

### 1. **"Nothing Happens" After Click**
**User Experience:**
- User clicks "Add Memory" button
- Modal closes immediately
- No visual feedback
- User doesn't know if anything happened

**Root Cause:**
```tsx
// AddMemoryModal.tsx:41-44
onSuccess={(res) => {
  onSuccess();  // Passed from parent
  onClose();    // Modal closes immediately
}}
```

The modal closes **before** the backend processing starts, leaving the user in the dark.

---

### 2. **Multiple Confusing Notifications**
**Current Behavior:**
```tsx
// AddMemoryComposer.tsx:123-129
await notificationAPI.emitActionResult(
  'memory.submit',
  'Memory submitted ✓',
  { severity: 'success', ttlMs: 2500 }
);
```

**Problems:**
- Only emits one notification: "Memory submitted ✓"
- Doesn't show P1 extraction progress
- Doesn't show when blocks are created
- Doesn't show when relationships are inferred
- User has no visibility into the 5-10 second processing time

**Backend emits events too, but frontend doesn't listen:**
- P1 extraction complete
- Governance proposal created/approved
- P2 relationship inference
- Timeline events (table may be broken based on logs)

---

### 3. **No Clear Navigation After Submit**
**Current Behavior:**
- Modal closes
- User stays on `/memory` page
- No indication that new blocks were created
- Stats don't update automatically
- User must manually click "Refresh" to see changes

**Questions:**
- Should we redirect to `/governance` to review proposals?
  - **No** - Most proposals auto-approve (confidence > 0.80)
- Should we stay on `/memory` and show progress inline?
  - **Yes** - This is the right approach

---

### 4. **Notification System Issues**

**Multiple Event Systems:**
1. **`notificationAPI.emitEvent()`** → Inserts into `app_events` table
2. **Backend `timeline_events`** → Broken (logs show `created_at` column missing)
3. **Supabase Realtime** → Subscribed but underutilized

**Problems:**
- `timeline_events` table errors in production logs
- Frontend subscribes to `app_events` channel but only for INSERTs
- No realtime updates for proposals, blocks, or work_queue
- User has to manually refresh to see results

---

## 💡 Recommended Solution: Progressive UX with Realtime Updates

### Phase 1: Immediate Feedback (Keep Modal Open)

**Change:**
```tsx
// AddMemoryModal.tsx
onSuccess={(res) => {
  // DON'T close modal yet
  // Show in-modal progress indicator
  onProcessingStarted(res);
}}
```

**UX Flow:**
1. User clicks "Add Memory"
2. Modal **stays open** showing progress:
   ```
   ✓ Memory submitted
   ⏳ Extracting knowledge...
   ```

3. Subscribe to realtime updates for this specific work item
4. Show progressive states:
   ```
   ✓ Memory submitted
   ✓ Extracted 10 blocks (3 facts, 4 insights, 3 actions)
   ⏳ Finding relationships...
   ```

5. When complete:
   ```
   ✓ Memory submitted
   ✓ Extracted 10 blocks
   ✓ Found 5 causal relationships

   [View Memory] [Add Another]
   ```

---

### Phase 2: Realtime Subscriptions (Backend Events)

**Current:** Frontend only subscribes to `app_events` for generic notifications

**Proposed:** Subscribe to specific channels for work progress

```tsx
// New hook: useMemoryProcessing.ts
export function useMemoryProcessing(basketId: string) {
  const supabase = createBrowserClient();

  useEffect(() => {
    // Subscribe to canonical_queue updates for this basket
    const queueSubscription = supabase
      .channel(`basket:${basketId}:queue`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'canonical_queue',
          filter: `basket_id=eq.${basketId}`
        },
        (payload) => {
          const work = payload.new;
          // Update UI based on work.state and work.pipeline
          handleWorkUpdate(work);
        }
      )
      .subscribe();

    // Subscribe to proposals for this basket
    const proposalsSubscription = supabase
      .channel(`basket:${basketId}:proposals`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'proposals',
          filter: `basket_id=eq.${basketId}`
        },
        (payload) => {
          const proposal = payload.new;
          handleProposalCreated(proposal);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(queueSubscription);
      supabase.removeChannel(proposalsSubscription);
    };
  }, [basketId]);
}
```

---

### Phase 3: Inline Progress on Memory Page

**Current:** User stays on `/memory` page but sees no updates

**Proposed:** Show live processing banner at top of page

```tsx
// MemoryClient.tsx - Add processing banner
{processingWork.length > 0 && (
  <ProcessingBanner
    workItems={processingWork}
    onComplete={() => {
      loadStats();  // Refresh stats
      router.refresh();  // Refresh documents
    }}
  />
)}
```

**Banner UI:**
```
┌─────────────────────────────────────────────────────────┐
│ 🔄 Processing your memory...                            │
│                                                          │
│ ✓ P1 Extraction: Created 10 blocks                      │
│ ⏳ P2 Relationships: Finding connections...              │
│                                                          │
│ [Dismiss]                                                │
└─────────────────────────────────────────────────────────┘
```

When complete:
```
┌─────────────────────────────────────────────────────────┐
│ ✅ Memory processed successfully!                        │
│                                                          │
│ Created 10 blocks, 5 relationships                       │
│                                                          │
│ [View Blocks] [Dismiss]                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Fix Modal Close Behavior
**File:** `web/components/memory/AddMemoryModal.tsx`

```tsx
interface AddMemoryModalProps {
  basketId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: (result: any) => void;
}

// Change to:
interface AddMemoryModalProps {
  basketId: string;
  open: boolean;
  onClose: () => void;
  onProcessingStarted?: (dumpId: string) => void;  // New callback
}

// Update AddMemoryComposer integration:
<AddMemoryComposer
  basketId={basketId}
  onSuccess={(res) => {
    // Don't close modal yet
    onProcessingStarted?.(res.dump_id);
    // Show processing UI in modal
    setShowProcessing(true);
    setDumpId(res.dump_id);
  }}
/>
```

---

### Task 2: Create Processing Status Component
**New File:** `web/components/memory/ProcessingStatus.tsx`

```tsx
interface ProcessingStatusProps {
  dumpId: string;
  basketId: string;
  onComplete: (stats: ProcessingStats) => void;
}

export function ProcessingStatus({ dumpId, basketId, onComplete }: ProcessingStatusProps) {
  const [status, setStatus] = useState<'extracting' | 'relationships' | 'complete'>('extracting');
  const [stats, setStats] = useState({
    blocksCreated: 0,
    relationshipsCreated: 0,
    processingTimeMs: 0
  });

  useEffect(() => {
    // Subscribe to work queue for this dump
    const subscription = supabase
      .channel(`dump:${dumpId}:processing`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'canonical_queue',
        filter: `dump_id=eq.${dumpId}`
      }, (payload) => {
        const work = payload.new;

        if (work.pipeline === 'P1_SUBSTRATE' && work.state === 'completed') {
          setStatus('relationships');
          // Fetch block count
          fetchBlockCount();
        }

        if (work.pipeline === 'P2_GRAPH' && work.state === 'completed') {
          setStatus('complete');
          // Fetch relationship count
          fetchRelationshipCount();
          onComplete(stats);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [dumpId]);

  return (
    <div className="space-y-3">
      <ProcessingStep
        label="Extracting knowledge"
        status={status === 'extracting' ? 'in_progress' : 'complete'}
        result={stats.blocksCreated > 0 ? `${stats.blocksCreated} blocks` : undefined}
      />
      <ProcessingStep
        label="Finding relationships"
        status={status === 'relationships' ? 'in_progress' : status === 'complete' ? 'complete' : 'pending'}
        result={stats.relationshipsCreated > 0 ? `${stats.relationshipsCreated} relationships` : undefined}
      />
    </div>
  );
}
```

---

### Task 3: Add Processing Banner to Memory Page
**File:** `web/app/baskets/[id]/memory/MemoryClient.tsx`

```tsx
export default function MemoryClient({ basketId, needsOnboarding }: Props) {
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [processingDumps, setProcessingDumps] = useState<string[]>([]);

  // Subscribe to active work for this basket
  useEffect(() => {
    const subscription = supabase
      .channel(`basket:${basketId}:active_work`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'canonical_queue',
        filter: `basket_id=eq.${basketId}:state=in.(pending,processing)`
      }, (payload) => {
        // Update processing dumps list
        refreshActiveWork();
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [basketId]);

  return (
    <div className="space-y-6">
      {/* Processing banner */}
      {processingDumps.length > 0 && (
        <ProcessingBanner
          basketId={basketId}
          dumpIds={processingDumps}
          onComplete={() => {
            loadStats();
            router.refresh();
          }}
        />
      )}

      {/* Rest of memory page */}
      {/* ... */}
    </div>
  );
}
```

---

### Task 4: Fix Timeline Events Table (Backend)
**Issue:** Production logs show `created_at` column missing

**File:** Database migration needed

```sql
-- Check if timeline_events table has created_at
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'timeline_events';

-- Add if missing
ALTER TABLE timeline_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
```

---

### Task 5: Simplify Notification Events
**Current:** Multiple event types (`memory.submit`, `memory.error`, job updates, etc.)

**Proposed:** Consolidate to 3 key user-facing events

```tsx
// AddMemoryComposer.tsx
// Remove this:
await notificationAPI.emitActionResult(
  'memory.submit',
  'Memory submitted ✓',
  { severity: 'success', ttlMs: 2500 }
);

// Instead, rely on:
// 1. Modal showing processing status (immediate feedback)
// 2. Processing banner on page (progress updates)
// 3. Final completion toast (when P2 completes)
```

**Backend should emit:**
1. `memory_processing_started` (when P0 captures)
2. `memory_blocks_created` (when P1 completes)
3. `memory_ready` (when P2 completes)

These should trigger the frontend realtime subscriptions, not create toast notifications.

---

## 🎯 Success Criteria

### User Experience
- ✅ User clicks "Add Memory" and sees immediate feedback
- ✅ User sees progressive status (P1 extraction → P2 relationships)
- ✅ User knows when processing is complete
- ✅ Page automatically updates with new blocks/stats
- ✅ User can continue working while processing happens

### Technical
- ✅ No "nothing happens" bug
- ✅ Realtime subscriptions for work queue
- ✅ Stats auto-refresh on completion
- ✅ Timeline events table fixed
- ✅ Reduced notification noise

---

## 🚀 Implementation Phases

### Phase 1: Quick Wins (30 min)
1. Keep modal open during processing
2. Show simple spinner with "Processing..." text
3. Auto-close after 5 seconds OR when P1 completes

### Phase 2: Realtime Progress (2 hours)
1. Add ProcessingStatus component
2. Subscribe to canonical_queue updates
3. Show progressive P1 → P2 status in modal

### Phase 3: Page-Level UX (2 hours)
1. Add ProcessingBanner to MemoryClient
2. Auto-refresh stats on completion
3. Show completion toast with stats

### Phase 4: Polish (1 hour)
1. Fix timeline_events table
2. Clean up notification events
3. Add error handling for failed processing

**Total Estimated Time:** 5-6 hours

---

## 📊 Current vs Proposed Flow

### Current Flow (Broken)
```
User clicks "Add Memory"
  ↓
Modal closes immediately
  ↓
User sees toast: "Memory submitted ✓"
  ↓
??? (5-10 seconds of silence)
  ↓
User manually clicks "Refresh"
  ↓
Sees new blocks
```

### Proposed Flow (Fixed)
```
User clicks "Add Memory"
  ↓
Modal shows: "Processing..."
  ↓
Modal updates: "✓ Extracted 10 blocks"
  ↓
Modal updates: "✓ Found 5 relationships"
  ↓
Modal shows: "Complete! [View Memory]"
  ↓
User clicks "View Memory"
  ↓
Page auto-refreshes, shows new blocks
```

---

## 🔧 Key Files to Modify

1. **`web/components/memory/AddMemoryModal.tsx`**
   - Change onSuccess callback to onProcessingStarted
   - Keep modal open during processing
   - Show ProcessingStatus component

2. **`web/components/memory/AddMemoryComposer.tsx`**
   - Return dump_id from onSuccess
   - Remove premature "Memory submitted" toast

3. **`web/app/baskets/[id]/memory/MemoryClient.tsx`**
   - Add ProcessingBanner for active work
   - Subscribe to work queue updates
   - Auto-refresh on completion

4. **`web/lib/hooks/useMemoryProcessing.ts`** (NEW)
   - Realtime subscription to canonical_queue
   - Parse work state and pipeline
   - Return processing status

5. **`web/components/memory/ProcessingStatus.tsx`** (NEW)
   - UI component for P1 → P2 progress
   - Fetches block/relationship counts
   - Calls onComplete callback

6. **Backend: Fix timeline_events table**
   - Add created_at column if missing
   - Test event emission

---

## 🎨 UI Mockups

### Modal - Processing State
```
┌──────────────────────────────────────────────────────────┐
│  Capture a Thought                                    [X] │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ✓ Memory submitted                                      │
│                                                           │
│  🔄 Extracting knowledge...                              │
│     ⏳ Finding facts, insights, and actions              │
│                                                           │
│  ⏸ Finding relationships                                 │
│     Connecting related blocks                            │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Modal - Complete State
```
┌──────────────────────────────────────────────────────────┐
│  Capture a Thought                                    [X] │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ✅ Memory processed successfully!                        │
│                                                           │
│  ✓ Extracted 10 blocks                                   │
│    • 3 facts, 4 insights, 3 actions                      │
│                                                           │
│  ✓ Found 5 causal relationships                          │
│    • 3 auto-approved, 2 proposed                         │
│                                                           │
│  Processing time: 4.2 seconds                            │
│                                                           │
│  [View Memory]  [Add Another]                            │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Page Banner - In Progress
```
┌──────────────────────────────────────────────────────────┐
│  🔄 Processing 1 memory...                               │
│  ✓ Extracted 10 blocks  ⏳ Finding relationships...       │
└──────────────────────────────────────────────────────────┘
```

### Page Banner - Complete
```
┌──────────────────────────────────────────────────────────┐
│  ✅ Memory processed: 10 blocks, 5 relationships created  │
│  [View Blocks] [Dismiss]                                 │
└──────────────────────────────────────────────────────────┘
```

---

## 💬 Open Questions

1. **Should we show duplicate detection results?**
   - Current: Silent (logs show "V3.1 Semantic duplicate detected: similarity=1.00")
   - Proposed: Show "Found 7 duplicate blocks, skipped" in modal

2. **Should we redirect to /governance for PROPOSED relationships?**
   - Current: No redirect, user must navigate manually
   - Proposed: Show count of proposed items with link: "2 relationships need review [View →]"

3. **Should we batch multiple memories?**
   - If user adds multiple memories quickly, show combined banner?
   - Or separate banner per memory?

4. **Error handling - what if P1 fails?**
   - Show error in modal
   - Allow retry
   - Show failed work items in banner

---

## 📝 Next Steps

1. **Review this document** with team/product owner
2. **Prioritize phases** (Quick wins first?)
3. **Create frontend tickets** for each task
4. **Fix backend timeline_events** table
5. **Implement Phase 1** (quick win: keep modal open)
6. **Test in production** with real users
7. **Iterate based on feedback**

---

*Document Status: Ready for Review*
*Author: Claude*
*Last Updated: 2025-10-15*
