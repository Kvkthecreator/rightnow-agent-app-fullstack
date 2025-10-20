# Multi-Basket Architecture Refactoring Proposal

**Context**: YARNNN evolved from single-basket philosophy to multi-basket reality driven by MCP integration needs (Claude/ChatGPT calling in with basket inference). This architectural shift created domain confusion.

---

## Core Principle Clarification

### Change Requests (Governance) = Core Pillar
**NOT** just terminology - this is a fundamental domain/workflow:
- **Purpose**: Review and approve substrate modifications before they commit
- **Workflow**: Proposal → Validation → Review → Approval/Rejection → Execution
- **Scope**: Can operate at basket-level OR workspace-level depending on context
- **Events/Alerts**: Change requests generate notifications, but they're separate concerns

### Events/Alerts = Cross-Cutting Concern
**NOT** the same as governance - this is observability:
- **Purpose**: Notify users of things requiring attention or awareness
- **Workflow**: Event occurs → Notification created → User views/dismisses
- **Scope**: Workspace-level (user receives alerts across all baskets)
- **Sources**: Can be triggered by change requests, processing failures, captures, etc.

### Timeline = Historical Narrative
**NOT** a notification system - this is knowledge archaeology:
- **Purpose**: Show the story of how knowledge evolved over time
- **Workflow**: Events logged → User explores history → Understand context
- **Scope**: Basket-level (each basket has its own evolution story)
- **Sacred Principle**: "Narrative is Deliberate" - meaningful milestones, not raw logs

---

## Architectural Shift Analysis

### OLD Philosophy (Single-Basket)
```
User creates ONE basket → Works within it → All context is local
```

**Implications**:
- Workspace was just a container
- Dashboard was just a launcher
- All meaningful work happened inside `/baskets/[id]/*`
- No cross-basket operations needed

### NEW Reality (Multi-Basket with Inference)
```
Claude/ChatGPT calls MCP tools → Basket inference determines target → May affect multiple baskets
Unassigned captures → User assigns to basket → Creates proposals
Workspace becomes coordination layer
```

**Implications**:
- Workspace is now an **active workspace**, not just container
- Dashboard must support **triage** and **cross-basket visibility**
- Change requests can be **workspace-scoped** (affect multiple baskets)
- Need **workspace-level governance** to review cross-basket proposals

---

## Domain Model (Re-architected)

### Domain 1: **Governance (Change Requests)**

#### Purpose
Control substrate modifications through validation and approval workflow

#### Components
- **Proposals Table** (already exists)
- **Validation** (dupe detection, ontology checks)
- **Review Workflow** (approve/reject/defer)
- **Execution** (commit to substrate)

#### Scope Levels

**A. Basket-Scoped Change Requests**
- **When**: Single basket modifications (most common)
- **Example**: "Add block to Basket A"
- **Review Location**: `/baskets/[id]/change-requests`
- **Current Status**: ✅ Working (GovernanceClient)

**B. Workspace-Scoped Change Requests**
- **When**: Multi-basket operations OR unassigned modifications
- **Example**: "Inferred basket creation", "Cross-basket relationship", "Unassigned capture processing"
- **Review Location**: `/workspace/change-requests` ❌ **MISSING - NEED TO BUILD**
- **Current Status**: Proposals created but no review UI

**C. User-Scoped Change Requests** (Future consideration)
- **When**: User profile/settings changes requiring approval
- **Example**: "Revoke integration token", "Change workspace owner"
- **Review Location**: Could be `/workspace/change-requests` or separate
- **Current Status**: Not implemented (may not be needed)

#### Proposal Schema Enhancement Needed
```typescript
// Current:
interface Proposal {
  basket_id: uuid;  // ❌ Always required - can't handle workspace-scoped!
  workspace_id: uuid;
  // ...
}

// Proposed:
interface Proposal {
  basket_id: uuid | null;  // ✅ Nullable for workspace-scoped proposals
  workspace_id: uuid;      // Always required
  scope: 'basket' | 'workspace' | 'cross-basket';  // Explicit scope
  affected_baskets: uuid[];  // For cross-basket tracking
  // ...
}
```

---

### Domain 2: **Alerts & Notifications**

#### Purpose
Inform users of events requiring attention or awareness

#### Components
- **user_alerts Table** (currently used)
- **Toast System** (transient, in-memory)
- **Notification Center UI** (needs enhancement)

#### Scope
- **Always workspace-level** (user receives alerts for all their baskets)
- User navigates to basket/entity from alert

#### Alert Types
1. **Governance Alerts**
   - "3 change requests pending review"
   - "Proposal auto-approved: [link]"
   - "Validation failed for proposal [link]"

2. **Processing Alerts**
   - "Reflection computation completed"
   - "Dump processing failed - retry?"
   - "Cascade pipeline stalled"

3. **Capture Alerts**
   - "5 unassigned captures waiting"
   - "High-confidence capture auto-assigned"

4. **Integration Alerts**
   - "Claude connection degraded"
   - "MCP tool error threshold exceeded"

#### Alert → Action Mapping
- Alert shows **what** happened
- Deep link takes user to **where** to act
- Actions happen in appropriate scope (basket or workspace)

#### Consolidation
- ❌ **DELETE**: `user_notifications` table (unused, redundant)
- ✅ **KEEP**: `user_alerts` table
- ✅ **ENHANCE**: NotificationCenter to query user_alerts
- ✅ **KEEP**: Toast system for transient feedback

---

### Domain 3: **Timeline (Historical Events)**

#### Purpose
Show narrative of knowledge evolution within a basket

#### Components
- **timeline_events Table** (canonical substrate log)
- **KnowledgeTimeline Component**

#### Scope
- **Always basket-level** (each basket has its own story)
- Shows: dumps added, blocks created, relationships formed, reflections computed

#### Distinction from Alerts
- **Timeline** = Past narrative (archeology)
- **Alerts** = Present/future action items (triage)
- Timeline doesn't require action, alerts do

#### Keep As-Is
- ✅ Working well, canon-compliant
- ✅ Sacred principle: "Narrative is Deliberate"
- No changes needed

---

### Domain 4: **Queues (Triage)**

#### Purpose
Present items requiring user decision/action

#### Queue Types

**A. Unassigned Captures Queue**
- **Scope**: Workspace-level
- **Purpose**: Assign low-confidence MCP captures to baskets
- **Route**: `/workspace/captures` (rename from `/memory/unassigned`)
- **Status**: ✅ Working, just rename

**B. Change Requests Queue**
- **Scope**: Workspace-level AND Basket-level
- **Purpose**: Review pending proposals

**Workspace View**: `/workspace/change-requests`
```
Pending Change Requests (Grouped by Basket)

📦 Basket: "Project X" (3 pending)
  - Add block: "API Design" [Review]
  - Update context item: "Requirements" [Review]
  - Create relationship: "depends-on" [Review]

📦 Basket: "Research Notes" (1 pending)
  - Add block: "Paper Summary" [Review]

🌐 Workspace-Level (2 pending)
  - Create basket: "Inferred from Claude" [Review]
  - Cross-basket relationship: Project X ↔ Research [Review]
```

**Basket View**: `/baskets/[id]/change-requests`
```
Change Requests for "Project X"

Pending (3)
  - Add block: "API Design" [Review]
  - Update context item: "Requirements" [Review]
  - Create relationship: "depends-on" [Review]

Approved (12)
  - ...
```

**C. Processing Queue** (Deferred)
- **Scope**: Workspace-level
- **Purpose**: Monitor background job status
- **Route**: `/workspace/processing`
- **Status**: ❌ No UI, can defer for now

---

## Refactoring Plan

### Phase 1: Clean Up Unused/Broken (Week 1)

#### 1.1 Database Cleanup
```sql
-- Drop unused notifications table
DROP TABLE IF EXISTS user_notifications CASCADE;
DROP TABLE IF EXISTS workspace_notification_settings CASCADE;
```

#### 1.2 Route Cleanup
```typescript
// Rename for clarity
'/memory/unassigned' → '/workspace/captures'

// Update sidebar
{
  href: '/workspace/captures',
  label: 'Unassigned Captures',
  icon: Inbox,
}
```

#### 1.3 Dashboard Cleanup
```typescript
// Remove broken "Pending Proposals" card
// It will be replaced with proper workspace change requests view
```

---

### Phase 2: Enable Workspace-Level Governance (Week 2-3)

#### 2.1 Database Schema Migration
```sql
-- Make basket_id nullable for workspace-scoped proposals
ALTER TABLE proposals
  ALTER COLUMN basket_id DROP NOT NULL;

-- Add scope and affected baskets
ALTER TABLE proposals
  ADD COLUMN scope text CHECK (scope IN ('basket', 'workspace', 'cross-basket')) DEFAULT 'basket',
  ADD COLUMN affected_baskets uuid[] DEFAULT '{}';

-- Create index for workspace-scoped queries
CREATE INDEX idx_proposals_workspace_scope
  ON proposals(workspace_id, scope, status, created_at DESC)
  WHERE basket_id IS NULL OR scope IN ('workspace', 'cross-basket');
```

#### 2.2 Create Workspace Governance UI
```
/workspace/change-requests/page.tsx
  - WorkspaceGovernanceClient component
  - Grouped by basket + workspace-level section
  - Approve/reject actions
  - Link to basket details
  - Stats: workspace-wide pending count
```

#### 2.3 Update Dashboard
```typescript
// Replace broken card with working one
<QueueCard
  title="Change Requests"
  description="Review pending substrate modifications"
  count={workspacePendingCount}
  href="/workspace/change-requests"
  cta="Review requests"
/>
```

#### 2.4 Update Basket Governance
```typescript
// Keep existing basket-level view
// Filter to basket_id = X OR (scope = 'cross-basket' AND X IN affected_baskets)
```

---

### Phase 3: Consolidate Alerts (Week 4)

#### 3.1 Alert Generation
```typescript
// When proposal created:
if (proposal.status === 'PROPOSED' && !proposal.auto_approved) {
  await supabase.from('user_alerts').insert({
    workspace_id,
    user_id,
    alert_type: 'governance',
    severity: proposal.blast_radius === 'Global' ? 'warning' : 'info',
    title: 'Change request pending',
    message: `${proposal.ops_summary} awaiting review`,
    action_href: proposal.basket_id
      ? `/baskets/${proposal.basket_id}/change-requests#${proposal.id}`
      : `/workspace/change-requests#${proposal.id}`,
    action_label: 'Review'
  });
}

// When unassigned capture arrives:
await supabase.from('user_alerts').insert({
  alert_type: 'capture',
  severity: 'info',
  title: 'Unassigned capture',
  message: `${tool} captured: ${summary}`,
  action_href: `/workspace/captures#${capture.id}`,
  action_label: 'Assign'
});

// When processing fails:
await supabase.from('user_alerts').insert({
  alert_type: 'processing',
  severity: 'error',
  title: 'Processing failed',
  message: `${work_type} failed: ${error_message}`,
  action_href: `/workspace/processing#${queue.id}`,
  action_label: 'Retry'
});
```

#### 3.2 NotificationCenter Enhancement
```typescript
// Query user_alerts instead of event store
const { data: alerts } = await supabase
  .from('user_alerts')
  .select('*')
  .eq('workspace_id', workspaceId)
  .eq('user_id', userId)
  .is('dismissed_at', null)
  .order('created_at', { desc: true })
  .limit(20);

// Group by type
const grouped = {
  governance: alerts.filter(a => a.alert_type === 'governance'),
  captures: alerts.filter(a => a.alert_type === 'capture'),
  processing: alerts.filter(a => a.alert_type === 'processing'),
  integration: alerts.filter(a => a.alert_type === 'integration'),
};
```

#### 3.3 Badge Count
```typescript
// Top nav notification badge
const unreadCount = alerts.filter(a => !a.read_at).length;
```

---

### Phase 4: Terminology Standardization (Week 5)

#### 4.1 UI Labels (Consistent Naming)
```typescript
// Basket sections
{ key: "governance", label: "Change Requests", href: `/baskets/${id}/change-requests` }

// Dashboard/Workspace
"Change Requests" → Links to /workspace/change-requests
"Unassigned Captures" → Links to /workspace/captures

// Navigation
Sidebar: "Change Requests" (workspace-level)
Basket nav: "Change Requests" (basket-level)
```

#### 4.2 Route Naming
```
/workspace/change-requests (new)
/workspace/captures (renamed from /memory/unassigned)
/baskets/[id]/change-requests (renamed from /governance)
```

#### 4.3 Component Naming
```
WorkspaceGovernanceClient → WorkspaceChangeRequestsClient
GovernanceClient → BasketChangeRequestsClient
ProposalDetailModal → ChangeRequestDetailModal (or keep as-is, internal name)
```

#### 4.4 Database Terminology (Keep as-is)
```
proposals table → Keep (internal model)
User-facing: "Change Requests"
Code/DB: "Proposals"
```

---

## Final Mental Model

### Workspace Level (Coordination & Triage)
```
/workspace/
  ├── /captures              ← Assign MCP captures to baskets
  ├── /change-requests       ← Review workspace + cross-basket proposals
  └── /processing (future)   ← Monitor background jobs
```

**Philosophy**: Workspace is where **cross-basket coordination** happens
- Assign captures to correct basket
- Review proposals that affect workspace or multiple baskets
- Monitor system health

### Basket Level (Knowledge Work)
```
/baskets/[id]/
  ├── /overview              ← Stats, recent activity
  ├── /timeline?view=uploads ← Raw dumps
  ├── /building-blocks       ← Substrate content
  ├── /change-requests       ← Review basket-specific proposals
  ├── /timeline              ← Knowledge evolution story
  ├── /network               ← Relationship graph
  ├── /insights              ← Reflections
  ├── /documents             ← Composed artifacts
  └── /settings              ← Basket config
```

**Philosophy**: Basket is where **focused knowledge work** happens
- Curate substrate (blocks, context items)
- Review basket-specific changes
- Explore relationships and insights

### Cross-Cutting Concerns
- **Alerts** (workspace-level) → Deep links to basket or workspace actions
- **Timeline** (basket-level) → Historical narrative of basket evolution
- **Toasts** (transient) → Immediate feedback on actions

---

## Domain Boundaries (Clear Separation)

### Governance Domain
- **Entities**: Proposals, validators, operations
- **Workflows**: Submit → Validate → Review → Execute
- **UI**: Change request lists, detail modals, approve/reject
- **Scopes**: Basket-level + Workspace-level

### Alert Domain
- **Entities**: Alerts, notifications, badges
- **Workflows**: Generate → Display → Dismiss/Acknowledge
- **UI**: Notification center, top nav badge, toast
- **Scope**: Workspace-level only

### Timeline Domain
- **Entities**: Timeline events, provenance
- **Workflows**: Log → Query → Display narrative
- **UI**: Knowledge timeline with significance filtering
- **Scope**: Basket-level only

### Relationship Between Domains
```
[Governance] --generates--> [Alerts]
  Example: Proposal created → Alert "Review pending"

[Governance] --logs to--> [Timeline]
  Example: Proposal approved → Timeline event "substrate.committed"

[Alerts] --link to--> [Governance] OR [Baskets] OR [Workspace]
  Example: Alert "Review pending" → /workspace/change-requests#id
```

---

## Migration Checklist

### Immediate Deletions (No Risk)
- [ ] Drop `user_notifications` table
- [ ] Drop `workspace_notification_settings` table
- [ ] Remove broken dashboard "Pending Proposals" card
- [ ] Clean up unused NotificationCenter DB query code

### Schema Changes (Backwards Compatible)
- [ ] Make `proposals.basket_id` nullable
- [ ] Add `proposals.scope` column with default 'basket'
- [ ] Add `proposals.affected_baskets` column with default []
- [ ] Create index for workspace-scoped queries
- [ ] Backfill existing proposals: `scope = 'basket'`

### New Features (Additive)
- [ ] Create `/workspace/change-requests` page
- [ ] Create WorkspaceChangeRequestsClient component
- [ ] Update dashboard with correct link
- [ ] Rename `/memory/unassigned` → `/workspace/captures`
- [ ] Wire up user_alerts to NotificationCenter
- [ ] Add alert generation triggers (proposals, captures, processing)
- [ ] Add notification badge to top nav

### Renames (Low Risk)
- [ ] `/baskets/[id]/governance` → `/baskets/[id]/change-requests`
- [ ] Update all hrefs, links, redirects
- [ ] Update breadcrumb logic
- [ ] Update sidebar labels

### Testing
- [ ] Create workspace-scoped proposal manually
- [ ] Verify appears in `/workspace/change-requests`
- [ ] Verify approve/reject works
- [ ] Test alert generation for proposals
- [ ] Test alert deep links
- [ ] Test basket-scoped proposals still work

---

## Success Criteria

After refactoring, users should have **mental clarity**:

1. **"Where do I review change requests?"**
   - Basket-specific: Go to that basket's Change Requests page
   - Workspace/cross-basket: Go to /workspace/change-requests
   - Dashboard shows count with working link

2. **"Where do I assign unassigned captures?"**
   - /workspace/captures (clear, workspace-level triage)

3. **"Where do I see what happened in a basket?"**
   - Timeline page (knowledge evolution story)

4. **"How do I know when something needs my attention?"**
   - Alerts appear in notification center (top nav badge)
   - Deep links take me to the right place

5. **"What's the difference between workspace and basket?"**
   - Workspace = coordination across baskets, triage, system health
   - Basket = focused knowledge work within context

---

## Open Questions for Your Decision

1. **Should we show basket-scoped proposals in workspace view?**
   - Option A: Yes, show all proposals grouped by basket (complete view)
   - Option B: No, only workspace/cross-basket proposals (separation of concerns)

2. **Should workspace change requests have approval authority over basket changes?**
   - Option A: Yes, workspace owner can approve any basket proposal
   - Option B: No, only workspace/cross-basket proposals (respect basket autonomy)

3. **Processing queue visibility - priority?**
   - Option A: High priority (users need to see job status)
   - Option B: Low priority (defer to later)
   - Option C: Infrastructure only (never show to users)

4. **Route naming preference?**
   - Option A: `/workspace/change-requests` (matches UI label)
   - Option B: `/workspace/governance` (technical term)
   - Option C: `/workspace/proposals` (matches DB)

My recommendations: 1-A, 2-A, 3-B, 4-A
