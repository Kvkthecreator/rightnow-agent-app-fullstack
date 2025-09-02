# Timeline Development Roadmap

## Current State (Completed)

### ✅ Core Implementation
- **Fixed cursor pagination** - Timeline load more now works properly with ISO timestamp format
- **Removed redundant headers** - Clean single header pattern with SubpageHeader component
- **Added pipeline filtering** - Filter by P0-P4 stages + Queue processing
- **Processing status indicators** - Active processing bar, success rates, duration metrics
- **Enhanced event display** - Processing duration, error messages, source tracking, agent confidence

### ✅ Architectural Foundations
- **Clear page boundaries** - Timeline focuses on "processing intelligence" vs content details
- **Governance integration** - Timeline shows governance-related events when enabled
- **Notification separation** - Timeline and notifications are architecturally distinct

## Timeline's Unique Value Proposition

The timeline page answers these specific questions:
- **"What's happening right now?"** - Real-time processing status
- **"How efficient is my knowledge processing?"** - Performance metrics
- **"Where are the bottlenecks?"** - Processing delays and failures  
- **"How are the agents performing?"** - Agent confidence and success rates

### What Timeline Should NOT Show (Belongs in Other Pages)
- ❌ Actual content details (Building Blocks page)
- ❌ Relationship structures (Graph page)
- ❌ Final documents (Memory page)
- ❌ Change proposals (Governance page)

## Interactive Features - Recommendations

### Priority 1: Processing Control Actions
```typescript
// For failed processing events
<Button onClick={() => retryProcessing(event.ref_id)}>
  Retry Processing
</Button>

// For active processing events  
<Button onClick={() => cancelProcessing(event.ref_id)}>
  Cancel
</Button>
```

### Priority 2: Navigation Links
```typescript
// Jump to related entities
{event.event_type === "block.created" && (
  <Link href={`/baskets/${basketId}/building-blocks#${event.ref_id}`}>
    View Block
  </Link>
)}

{event.event_type === "reflection.computed" && (
  <Link href={`/baskets/${basketId}/reflections#${event.ref_id}`}>
    View Insights
  </Link>
)}
```

### Priority 3: Expandable Processing Details
```typescript
// Click to expand technical details
const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

{expandedEvent === event.id && (
  <div className="mt-2 p-3 bg-gray-50 rounded">
    <h4>Processing Details</h4>
    <pre className="text-xs">{JSON.stringify(event.event_data, null, 2)}</pre>
  </div>
)}
```

### Priority 4: Consumer-Friendly Revert (Future)
Instead of git-like UX, think:
- **"Undo this change"** - Simple undo button on recent substrate events
- **"Restore to 1 hour ago"** - Time-based restoration
- **"Remove this addition"** - For unwanted blocks/context items

## Technical Implementation Notes

### Current Data Structure
```typescript
interface TimelineEventDTO {
  id: string;
  event_type: string; // "queue.processing_started", "block.created", etc.
  event_data: Record<string, unknown>; // Processing metadata
  created_at: string;
  processing_agent?: string; // P0/P1/P2/P3
  agent_confidence?: number;
  description?: string; // Agent-computed
  ref_id?: string; // Links to created entity
}
```

### Processing Statistics Implementation
- **Active Processing Count** - Events with "processing_started" but no corresponding "completed"
- **Success Rate** - Ratio of completed vs failed events (24h window)
- **Duration Tracking** - When event_data includes duration_ms

### API Integration Points
- `/api/baskets/[id]/timeline` - Main timeline data
- `/api/canonical/queue/health` - Processing system status
- `/api/proposals/[id]/retry` - Retry failed processing (future)
- `/api/processing/[id]/cancel` - Cancel active processing (future)

## Notification System Separation

### Timeline vs Notifications
- **Timeline**: Detailed processing history and current status (this page)
- **Notifications**: Badge count + quick preview in profile circle (future)

### Notification Architecture (Future)
```typescript
// In profile picture component
const [notificationCount, setNotificationCount] = useState(0);
const [recentEvents, setRecentEvents] = useState<TimelineEventDTO[]>([]);

// Real-time subscription to new events
useEffect(() => {
  const subscription = supabase
    .channel('timeline_notifications')
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'timeline_events',
      filter: `basket_id=eq.${basketId}`
    }, (payload) => {
      setNotificationCount(prev => prev + 1);
      // Show brief toast notification
    })
    .subscribe();
}, [basketId]);
```

## Performance Considerations

### Current Limitations
- **Load more pagination** - Works but limited to 50 events per request
- **Client-side filtering** - Should move to backend for large datasets
- **Real-time updates** - Not implemented (manual refresh required)

### Optimization Opportunities
- **Virtual scrolling** for large event lists
- **WebSocket subscription** for real-time processing updates
- **Background refresh** to keep processing status current
- **Event aggregation** to reduce noise (group related events)

## Future Development Phases

### Phase 1: Core Interactions (Next Session)
1. **Expandable event details** - Click to see processing metadata
2. **Retry failed processing** - Action buttons for failed events
3. **Navigation links** - Jump to created entities
4. **Real-time status updates** - WebSocket for active processing

### Phase 2: Advanced Features
1. **Processing analytics** - Trends, performance charts
2. **Event grouping** - Collapse related processing chains
3. **Custom time ranges** - "Show last 6 hours" filtering
4. **Export timeline data** - For debugging/analysis

### Phase 3: Consumer Revert System
1. **Undo recent changes** - Time-based restoration
2. **Change preview** - Show what will be reverted
3. **Selective revert** - Choose specific changes to undo
4. **Revert impact analysis** - Show what depends on changes

## Technical Debt & Cleanup

### Database Schema
- **Event payload normalization** - Standardize event_data structure
- **Processing chain tracking** - Link related events (dump → blocks → relationships)
- **User activity tracking** - Track last_viewed_at for notification counts

### Code Cleanup
- **Remove unused pipelineFilter state** from UnifiedTimeline (now passed as prop)
- **Standardize event configuration** - Move EVENT_CONFIG to shared constants
- **Type safety improvements** - Proper typing for event_data based on event_type

## Key Architectural Insights

### Timeline as Processing Intelligence Center
The timeline page serves as the "control tower" for knowledge processing:
- Shows what the AI agents are doing
- Provides visibility into processing health
- Enables intervention when things go wrong
- Tracks performance over time

### Clear Separation of Concerns
- **Timeline**: Process monitoring and control
- **Building Blocks**: Content viewing and editing  
- **Graph**: Relationship exploration
- **Memory**: Final document consumption
- **Governance**: Change approval workflow
- **Notifications**: Quick alerts and recent activity summary

This separation ensures each page has a focused purpose and avoids feature bloat.