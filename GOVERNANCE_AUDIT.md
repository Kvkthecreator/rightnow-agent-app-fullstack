# Comprehensive Audit: Governance, Notifications, Queues & Timeline Systems

**Date**: 2025-10-18
**Scope**: Analysis of overlapping/ambiguous features across workspace and basket levels

---

## Executive Summary

### Your Concerns (Interpreted)
1. **Scope Ambiguity**: Features exist at both workspace-level and basket-level without clear differentiation
2. **Feature Bloat**: Multiple overlapping systems (proposals/change requests, timeline/notifications, queues)
3. **Stability Issues**: Many features don't work reliably or provide clear value
4. **User Confusion**: Unclear terminology and navigation (e.g., "Memory", "Governance", "Change Requests", "Unassigned Queue")

### Current Reality
After examining the codebase and database schema, I found:
- **5 database tables** for governance/notifications/queues
- **2 distinct timeline systems** (timeline_events + notification event history)
- **3 navigation entry points** for similar concepts
- **Scope confusion** between workspace-level and basket-level features

---

## 1. Database Layer Analysis

### Tables Found

#### `timeline_events` ✅ **ACTIVELY USED**
- **Purpose**: Canonical substrate event log for ALL basket activity
- **Scope**: Basket-level (FK to baskets, workspace_id for access control)
- **Location**: Available at `/baskets/[id]/timeline`
- **Features**:
  - 40+ event types (dump.created, block.created, proposal.submitted, etc.)
  - Full audit trail with provenance
  - Source host tracking (claude, chatgpt, ambient, human)
- **Status**: ✅ Working, well-designed, canonical
- **UI**: KnowledgeTimeline component with significance filtering

#### `proposals` ✅ **ACTIVELY USED**
- **Purpose**: Governance layer for substrate changes requiring approval
- **Scope**: Basket-level (FK to baskets, workspace_id for workspace rollups)
- **Location**: Available at `/baskets/[id]/governance` (labeled "Change Requests")
- **Features**:
  - Proposal kinds: BLOCK_PROPOSAL, CONTEXT_ITEM_PROPOSAL, etc.
  - Statuses: PROPOSED, APPROVED, REJECTED
  - Auto-approval support
  - Validator reports with dupe detection
  - Execution tracking (is_executed, executed_at)
- **Status**: ✅ Working, canon-compliant, has comprehensive UI
- **UI**: GovernanceClient with summary dashboard + detailed list view

#### `user_notifications` ⚠️ **EXISTS BUT UNDERUTILIZED**
- **Purpose**: User-facing notification system
- **Scope**: Workspace-level (workspace_id + user_id)
- **Features**:
  - Types: info, success, warning, error
  - Categories: (not clear from schema)
  - Channels: cross-page persistence
  - Governance context field (JSONB)
  - Status tracking: unread, read, dismissed, acknowledged
- **Status**: ⚠️ Database table exists, has RLS policies, BUT minimal UI usage
- **UI**: NotificationCenter exists but only shows in-memory eventHistory (not DB notifications)
- **Problem**: **Disconnected** - DB table not being populated or consumed properly

#### `agent_processing_queue` ⚠️ **INFRASTRUCTURE ONLY**
- **Purpose**: Background job queue for P0-P4 pipeline processing
- **Scope**: Workspace-level with optional basket_id
- **Work Types**: P0_CAPTURE, P1_SUBSTRATE, P2_GRAPH, P3_REFLECTION, P4_COMPOSE, MANUAL_EDIT, PROPOSAL_REVIEW, TIMELINE_RESTORE
- **Features**:
  - Processing states: pending, processing, completed, failed
  - Cascade metadata for pipeline flows
  - Retry logic with attempt tracking
- **Status**: ⚠️ Backend infrastructure, **NO user-facing queue UI**
- **Problem**: Users can't see processing status, errors, or retry state

#### `proposal_executions` (Found via FK reference)
- **Purpose**: Execution log for proposals (separate from timeline_events)
- **Status**: Not examined in detail, likely implementation detail

#### Tables NOT Found (expected but missing):
- ❌ `change_requests` - Does not exist (proposals serves this role)
- ❌ `unassigned_queue` - Does not exist as table
- ❌ `notifications` - Does not exist (user_notifications does)

---

## 2. Feature Inventory by Level

### A. Workspace-Level Features (Dashboard)

#### Navigation: `/dashboard` ("Control Tower")

**Purpose**: Workspace-wide monitoring and triage

**Sections**:
1. **Integrations** - Claude/ChatGPT connection status
2. **Queues** - Two workspace-level queue cards:
   - **Unassigned Captures** (`mcp_unassigned_captures` table)
     - Links to `/memory/unassigned`
     - Shows low-confidence MCP captures waiting for basket assignment
     - ✅ Working, has UI (UnassignedQueueClient)
   - **Pending Proposals** (workspace-wide proposal count)
     - Links to `/governance/settings` ⚠️ (this route may not exist)
     - Shows PROPOSED status proposals across ALL baskets
     - ⚠️ No workspace-level proposal review UI found
3. **Context Baskets** - List of baskets (navigates to basket overviews)
4. **MCP Activity** - Recent MCP call logs (mcp_activity_logs table)
5. **Alerts** - User alerts (user_alerts table, not user_notifications)

**Problems Identified**:
- "Pending Proposals" queue links to `/governance/settings` which doesn't appear to exist
- No workspace-level proposal review interface (only basket-level governance pages exist)
- Workspace dashboard shows proposal COUNT but can't action them
- **Unassigned Queue** exists at workspace level (`/memory/unassigned`) but labeled "Memory" which is confusing

#### Navigation: Sidebar Links

From `web/app/components/shell/Sidebar.tsx`:
```typescript
{
  href: '/memory/unassigned',
  label: 'Unassigned Queue',
  icon: Inbox,
}
```

**Problem**: Uses `/memory/unassigned` path but "Memory" is now the basket-level "Overview" page - naming collision!

---

### B. Basket-Level Features

#### Navigation: `/baskets/[id]/*` (Basket Sections)

From `sections.ts`:
```typescript
{ key: "memory", label: "Overview", href: `/baskets/${id}/overview` }
  { key: "timeline", label: "Timeline", href: `/baskets/${id}/timeline` }
{ key: "building-blocks", label: "Building Blocks", href: `/baskets/${id}/building-blocks` }
{ key: "governance", label: "Change Requests", href: `/baskets/${id}/governance` }
{ key: "insights", label: "Insights", href: `/baskets/${id}/insights` }
{ key: "graph", label: "Network", href: `/baskets/${id}/graph` }
{ key: "timeline", label: "Timeline", href: `/baskets/${id}/timeline` }
{ key: "settings", label: "Settings", href: `/baskets/${id}/settings` }
{ key: "documents", label: "Documents", href: `/baskets/${id}/documents` }
```

**Features**:

1. **Timeline** (`/baskets/[id]/timeline`)
   - ✅ Shows timeline_events for this basket
   - Significance filtering (low/medium/high)
   - KnowledgeTimeline component
   - **Sacred principle**: "Narrative is Deliberate"
   - **Purpose**: Knowledge evolution story (not technical processing)

2. **Change Requests/Governance** (`/baskets/[id]/governance`)
   - ✅ Shows proposals for this basket
   - GovernanceClient with summary + list views
   - Approve/reject workflow with modal
   - Status filtering (all/PROPOSED/APPROVED/REJECTED)
   - Stats cards: total, pending, approved, auto-approved
   - **Well-designed**, canon-compliant

3. **Building Blocks** (`/baskets/[id]/building-blocks`)
   - Shows blocks and context items
   - Has create/edit modals
   - Stats display
   - Not examined in detail for this audit

4. **Insights** (`/baskets/[id]/insights`)
   - Reflections/analysis
   - Not examined in detail

5. **Network** (`/baskets/[id]/graph`)
   - Memory network visualization
   - Recently improved with pan/zoom, floating panels

---

## 3. Notification Systems (Multiple!)

### System 1: `user_notifications` Table (Database)
- **Purpose**: Persistent user notifications
- **Status**: ⚠️ Table exists, RLS configured, BUT NOT CONNECTED TO UI
- **Problem**: NotificationCenter doesn't query this table

### System 2: In-Memory Event Store (Zustand)
- **Purpose**: Real-time toast notifications
- **Location**: `web/lib/notifications` store
- **Status**: ✅ Working for toasts
- **Problem**: Not persistent, disappears on page refresh

### System 3: Timeline Events (Canonical)
- **Purpose**: Audit trail of substrate changes
- **Status**: ✅ Working, canonical, basket-scoped
- **Problem**: Not designed for user notifications

### System 4: User Alerts (Separate!)
- **Table**: `user_alerts` (found in dashboard code)
- **Purpose**: Important system alerts shown on dashboard
- **Status**: ✅ Working on dashboard page
- **Problem**: Yet another notification mechanism!

**Analysis**:
- **4 different notification mechanisms** serving overlapping purposes
- user_notifications table is disconnected/unused
- No unified notification strategy

---

## 4. Queue Systems Analysis

### Queue 1: Unassigned Captures (Workspace-Level)
- **Table**: `mcp_unassigned_captures`
- **Purpose**: Low-confidence MCP tool calls waiting for basket assignment
- **Route**: `/memory/unassigned`
- **UI**: ✅ UnassignedQueueClient component
- **Scope**: Workspace-level (user assigns to baskets)
- **Status**: ✅ Working

### Queue 2: Pending Proposals (Workspace Aggregate)
- **Source**: `proposals` table WHERE status = 'PROPOSED'
- **Purpose**: Show workspace-wide pending governance items
- **Route**: Dashboard shows count, links to `/governance/settings`
- **UI**: ❌ No workspace-level governance review page exists!
- **Scope**: Workspace aggregate (but actionable at basket level only)
- **Status**: ⚠️ Broken - count shows on dashboard but no way to action

### Queue 3: Agent Processing Queue (Background)
- **Table**: `agent_processing_queue`
- **Purpose**: Background job processing for P0-P4 pipeline
- **UI**: ❌ No user-facing queue interface
- **Scope**: Workspace-level infrastructure
- **Status**: ⚠️ Hidden from users, no visibility into processing state

### Queue 4: Basket-Level Governance (Proposals)
- **Source**: `proposals` table WHERE basket_id = X
- **Purpose**: Review/approve substrate changes for specific basket
- **Route**: `/baskets/[id]/governance`
- **UI**: ✅ GovernanceClient component (excellent)
- **Scope**: Basket-level
- **Status**: ✅ Working well

**Analysis**:
- "Unassigned Queue" is the only true workspace-level actionable queue
- "Pending Proposals" dashboard card is misleading (shows count but can't action at workspace level)
- Agent processing queue is invisible to users (no status visibility)
- Basket governance works well but requires navigating to each basket

---

## 5. Terminology & Naming Issues

### Confusing Terms

1. **"Memory"**
   - Previously: `/baskets/[id]/memory` (basket overview page)
   - Now: `/baskets/[id]/overview` (renamed in previous session)
   - BUT: Workspace-level route `/memory/unassigned` still exists!
   - **Problem**: "Memory" used for both basket overview AND workspace queue

2. **"Change Requests" vs "Governance" vs "Proposals"**
   - UI label: "Change Requests"
   - Route: `/governance`
   - Component: GovernanceClient
   - Database: `proposals` table
   - **All refer to same thing but inconsistent naming**

3. **"Timeline" vs "Notifications"**
   - Timeline shows substrate events
   - Notifications show... what exactly? (disconnected)
   - Both could show "activity" but serve different purposes
   - **Overlap unclear**

4. **"Unassigned Queue" vs "Pending Proposals"**
   - Both are "queues" requiring user action
   - Both shown on dashboard "Queues" section
   - One is pre-basket-assignment (unassigned captures)
   - One is post-basket-assignment (proposals)
   - **Relationship unclear to users**

---

## 6. Scope Confusion Analysis

### What Works at Workspace Level?
✅ **Unassigned Queue** - Makes sense, MCP captures need basket assignment
✅ **Integration Status** - Makes sense, workspace owns connections
✅ **MCP Activity Log** - Makes sense, workspace-level monitoring
⚠️ **Pending Proposals Count** - Shown but not actionable
❌ **Workspace-level Governance** - Doesn't exist (proposals are basket-scoped)

### What Works at Basket Level?
✅ **Governance/Change Requests** - Makes sense, proposals are basket-scoped
✅ **Timeline** - Makes sense, shows basket's knowledge evolution
✅ **Building Blocks** - Makes sense, substrate is basket-scoped
✅ **Network Graph** - Makes sense, relationships are basket-scoped

### What's Ambiguous?
⚠️ **Notifications** - Should they be workspace-level or basket-level?
  - user_notifications table is workspace-scoped (workspace_id + user_id)
  - But governance_context field suggests basket-level context
  - Current UI doesn't distinguish

⚠️ **Processing Queue** - Agent queue is workspace-level but basket-aware
  - Some jobs are workspace-level (P0_CAPTURE)
  - Some jobs are basket-specific (P1_SUBSTRATE with basket_id)
  - No user visibility either way

---

## 7. What's Broken or Unused?

### Broken
1. ❌ **Workspace Governance Review** - Dashboard links to `/governance/settings` which doesn't exist
2. ❌ **user_notifications** - Table exists but not connected to UI
3. ⚠️ **NotificationCenter** - Shows in-memory events, not persisted notifications

### Unused/Underutilized
1. **user_notifications table** - Fully designed with RLS but not populated or consumed
2. **Agent processing queue visibility** - Users can't see job status, errors, retries
3. **Timeline event types** - 40+ event types but UI may not distinguish/display them all

### Redundant
1. **Multiple notification systems** (user_notifications DB + event store + alerts + timeline)
2. **Governance terminology** (Change Requests = Governance = Proposals)

---

## 8. First Principles Analysis

### What Users Actually Need

#### At Workspace Level (Dashboard):
1. **Triage unassigned captures** → Assign to baskets
2. **Monitor integration health** → Fix connection issues
3. **See recent activity** → Understand what AI is doing
4. **Get alerted to problems** → Errors, failures, issues requiring attention

#### At Basket Level:
1. **Review proposed changes** → Approve/reject substrate modifications
2. **See knowledge evolution** → Understand how understanding grew over time
3. **Manage content** → Create/edit blocks, uploads, documents
4. **Explore relationships** → Network graph, insights

### What's Missing

1. **Unified Notification System**
   - Currently: 4 separate systems (alerts, notifications table, event store, timeline)
   - Need: Single source of truth for "things requiring user attention"

2. **Processing Visibility**
   - Currently: Agent queue is invisible
   - Need: Users should see when AI is working, what failed, retry status

3. **Workspace-Level Governance View**
   - Currently: Dashboard shows proposal count but can't action
   - Need: Either remove count or add workspace-level review page OR clarify this is informational only

4. **Clear Scope Boundaries**
   - Currently: Ambiguous what's workspace vs basket level
   - Need: Clear mental model and consistent patterns

---

## 9. Recommendations for Refactoring

### Phase 1: Terminology & Navigation Cleanup

1. **Rename Routes for Clarity**
   - `/memory/unassigned` → `/workspace/captures` or `/captures/unassigned`
   - `/baskets/[id]/governance` → Keep as-is OR standardize to `/baskets/[id]/proposals`
   - Align UI labels with routes

2. **Standardize Naming**
   - Pick ONE term: "Proposals" OR "Change Requests" (I recommend "Proposals" - matches DB)
   - Remove ambiguous "Memory" terminology
   - Update sidebar labels to match

### Phase 2: Consolidate Notification Systems

1. **Unify Around user_notifications Table**
   - Make it the single source of truth for user-facing notifications
   - Categories:
     - `proposal_pending` - Governance items needing review
     - `capture_unassigned` - MCP captures needing assignment
     - `processing_failed` - Background jobs that failed
     - `integration_error` - Connection issues
   - Use channels for cross-page persistence vs toasts
   - Deprecate separate user_alerts table (merge into user_notifications)

2. **Keep Timeline Separate**
   - timeline_events remains canonical substrate audit log
   - NOT a notification system
   - Purpose: Knowledge evolution narrative

3. **Update NotificationCenter UI**
   - Query user_notifications table instead of event store
   - Show actionable items with deep links
   - Group by category
   - Allow dismiss/acknowledge

### Phase 3: Queue Consolidation

1. **Workspace-Level: Single "Inbox"**
   - Combine unassigned captures + workspace-level notifications
   - Route: `/workspace/inbox` or keep `/captures/unassigned`
   - Purpose: Everything requiring workspace-level triage

2. **Basket-Level: Proposals/Governance**
   - Keep as-is (working well)
   - Ensure linked from notifications when applicable

3. **Remove Misleading Dashboard "Pending Proposals" Card**
   - Option A: Remove entirely (proposals are basket-scoped, review per-basket)
   - Option B: Keep informational only with tooltip "Review in individual baskets"
   - Option C: Add workspace-level "Review All" page showing proposals grouped by basket

4. **Add Processing Queue Visibility**
   - New route: `/workspace/processing` or dashboard section
   - Show agent_processing_queue items
   - Filter by state: pending, processing, failed
   - Allow retry for failed jobs
   - Show cascade relationships

### Phase 4: Scope Clarification

1. **Workspace-Level Dashboard Sections**:
   - **Inbox**: Unassigned captures (requires action)
   - **Integrations**: Connection status (informational)
   - **Activity**: Recent MCP calls (informational)
   - **Processing**: Background jobs (informational + retry failed)
   - **Baskets**: Quick links (navigation)

2. **Basket-Level Sections** (keep current structure):
   - **Overview**: Stats, recent activity
   - **Uploads**: Raw dumps
   - **Building Blocks**: Substrate content
   - **Proposals**: Governance review
   - **Timeline**: Knowledge evolution
   - **Network**: Relationship graph
   - **Insights**: Reflections
   - **Documents**: Composed artifacts
   - **Settings**: Basket config

---

## 10. Migration Path

### Step 1: Low-Risk Cleanup (Week 1)
- [ ] Rename `/memory/unassigned` → `/workspace/captures`
- [ ] Update sidebar labels for consistency
- [ ] Standardize "Proposals" terminology across UI
- [ ] Add tooltip to dashboard "Pending Proposals" explaining it's informational
- [ ] Update breadcrumbs to reflect new routes

### Step 2: Notification System Unification (Week 2)
- [ ] Wire up user_notifications table to NotificationCenter UI
- [ ] Create notification triggers for:
  - Proposal created (if validation fails)
  - Processing job failed
  - Unassigned capture arrived
- [ ] Migrate user_alerts into user_notifications (single table)
- [ ] Add dismiss/acknowledge actions
- [ ] Add notification badge to top nav

### Step 3: Processing Queue Visibility (Week 3)
- [ ] Create `/workspace/processing` page
- [ ] Show agent_processing_queue items
- [ ] Add retry functionality for failed jobs
- [ ] Add polling for real-time updates
- [ ] Link from dashboard

### Step 4: Governance Flow Polish (Week 4)
- [ ] Decide: Keep basket-level only OR add workspace-level review
- [ ] If workspace-level: Create `/workspace/proposals` with basket grouping
- [ ] If basket-level only: Remove dashboard card
- [ ] Ensure notifications link correctly to proposals

### Step 5: Documentation & Testing
- [ ] Update user docs with clear scope model
- [ ] Add tooltips/help text explaining workspace vs basket
- [ ] Test flows end-to-end
- [ ] Gather user feedback

---

## Conclusion

### The Core Problem
You were right - the codebase has **scope ambiguity** and **feature bloat**:

- **4 notification systems** doing overlapping things
- **3 queue concepts** with unclear relationships
- **Terminology inconsistency** (Memory, Governance, Change Requests, Proposals)
- **Broken links** (dashboard → `/governance/settings`)
- **Disconnected features** (user_notifications table exists but unused)
- **Invisible infrastructure** (agent queue has no UI)

### The Path Forward
1. **Clarify scopes**: Workspace = triage/monitor, Basket = review/manage
2. **Unify notifications**: One table, one UI, clear categories
3. **Consolidate queues**: Workspace inbox + basket proposals
4. **Fix terminology**: Pick one name per concept
5. **Add visibility**: Show background processing status
6. **Remove dead code**: Drop unused tables/routes

### Quick Wins
- Rename `/memory/unassigned` to avoid confusion with basket "Overview" (formerly "Memory")
- Fix dashboard "Pending Proposals" link
- Connect user_notifications table to NotificationCenter UI
- Standardize "Proposals" vs "Change Requests" terminology

### Strategic Decision Needed
**Should proposals be reviewable at workspace level or only per-basket?**
- Current design: Basket-scoped (proposals have basket_id FK)
- Dashboard shows workspace count but can't action
- Decision will determine if we need workspace-level governance UI or just remove the dashboard card
