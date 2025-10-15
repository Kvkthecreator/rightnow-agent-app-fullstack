# Frontend Audit & Refactoring Strategy

**Context:** V3.0 schema consolidation (context_items → blocks) + V3.1 semantic layer (embeddings + relationships)
**Question:** Fix notifications first, or do comprehensive frontend audit?
**Recommendation:** **Systematic audit FIRST, then fix holistically**

---

## 🎯 Strategic Recommendation: Audit-First Approach

### Why NOT "Fix Notifications Now"?

**Problem:** Notifications/events are symptoms, not root cause.

Your backend went through massive architectural changes:
- **V3.0:** Unified substrate (context_items merged into blocks)
- **V3.1:** Semantic layer (embeddings, causal relationships, LLM inference)
- **V3.1:** Governance evolution (PROPOSED → ACCEPTED states, confidence scores)

**But the frontend was built for the OLD architecture:**
- Still expects `context_items` (see: MemoryClient shows "Links" card)
- Event subscriptions assume old schema (timeline_events table broken)
- No realtime updates for new features (embeddings, relationships)
- Notification logic scattered across multiple systems

**If you fix notifications first:**
- ❌ You'll fix symptoms while structure remains misaligned
- ❌ Next page you touch will reveal more breakage
- ❌ You'll refactor notifications again when you fix other pages
- ❌ Tech debt accumulates faster than you can patch

---

## ✅ Recommended Approach: Systematic Frontend Audit

### Phase 1: Schema Alignment Audit (1-2 days)

**Goal:** Identify ALL places where frontend assumes old schema

**Checklist:**
```
[ ] Search codebase for "context_items" references
[ ] Search for "timeline_events" table queries
[ ] Search for old substrate types (e.g. "context", "tag", "link")
[ ] Check all Supabase queries for schema mismatches
[ ] Identify hardcoded semantic_types that don't match V3.0
[ ] Find places that assume anchor_role is static vs emergent
```

**Tool:**
```bash
# Run these searches
cd web
grep -r "context_items" --include="*.ts" --include="*.tsx"
grep -r "timeline_events" --include="*.ts" --include="*.tsx"
grep -r "anchor_role" --include="*.ts" --include="*.tsx"
```

**Expected Findings:**
- MemoryClient.tsx line 108: `context_items_count`
- Various components querying deleted tables
- Type definitions that don't match new schema

---

### Phase 2: Feature Gap Analysis (1 day)

**Goal:** Identify V3.1 features with NO frontend representation

**V3.1 Backend Capabilities (from our refactoring):**
1. ✅ Semantic duplicate detection (working, but invisible to user)
2. ✅ Embedding generation (working, no UI)
3. ❌ Causal relationship inference (P2 agent, no UI)
4. ❌ Relationship confidence scores (stored, not shown)
5. ❌ Governance states (PROPOSED vs ACCEPTED, not clear)
6. ❌ Semantic search (backend ready, frontend doesn't use it)

**Questions to answer:**
- Where should users see duplicate detection results?
- Should we show embedding status?
- How should causal relationships be visualized?
- Should users review PROPOSED relationships?
- Is semantic search exposed anywhere?

---

### Phase 3: Page-by-Page Inventory (2-3 days)

**Goal:** Audit every basket sub-page for V3.0/V3.1 alignment

#### Pages to Audit:

1. **/baskets/[id]/memory** ✅ **PARTIALLY FIXED**
   - [x] Add Memory modal (just fixed)
   - [ ] Stats cards (still shows "context_items_count")
   - [ ] Documents list (uses old schema?)
   - [ ] Missing: Relationship visualization

2. **/baskets/[id]/governance** ⚠️  **NEEDS AUDIT**
   - [ ] Proposal review (confidence scores shown?)
   - [ ] PROPOSED vs ACCEPTED states clear?
   - [ ] Relationship proposals visible?
   - [ ] Semantic duplicate alerts?

3. **/baskets/[id]/blocks** ⚠️  **NEEDS AUDIT**
   - [ ] Block list (shows semantic_type correctly?)
   - [ ] Embedding status visible?
   - [ ] Anchor roles (emergent vs static confusion?)
   - [ ] Relationships shown on block detail?

4. **/baskets/[id]/relationships** ❓ **DOES THIS EXIST?**
   - If not, should it? (V3.1 adds causal relationships)
   - Where do users see "addresses", "supports", "contradicts", "depends_on"?

5. **/baskets/[id]/insights** ⚠️  **NEEDS AUDIT**
   - [ ] P3 agent output shown?
   - [ ] Uses new semantic layer?

6. **/baskets/[id]/documents** ⚠️  **NEEDS AUDIT**
   - [ ] P4 composition using new substrate?
   - [ ] Shows which blocks contributed?

#### Audit Template (per page):

```markdown
## Page: /baskets/[id]/[page]

### Schema Alignment
- [ ] Uses blocks table correctly
- [ ] No context_items queries
- [ ] Semantic types match V3.0 taxonomy
- [ ] Anchor roles understood as emergent

### V3.1 Features
- [ ] Embeddings visible (if applicable)
- [ ] Relationships shown (if applicable)
- [ ] Confidence scores displayed
- [ ] Governance states clear

### Event/Notification System
- [ ] Subscribed to correct realtime channels
- [ ] Events trigger appropriate UI updates
- [ ] No broken table queries

### UX Issues
- [ ] Loading states clear
- [ ] Error handling present
- [ ] Auto-refresh works
- [ ] User knows what's happening

### Action Items
- Fix X
- Add Y
- Remove Z
```

---

### Phase 4: Unified Event Architecture (2-3 days)

**Goal:** Design consistent event/notification system across all pages

**Current Mess:**
1. `app_events` table (frontend inserts via API)
2. `timeline_events` table (broken, backend tries to insert)
3. Supabase realtime subscriptions (underutilized)
4. Toast notifications (scattered, inconsistent)
5. Page-specific polling (inefficient)

**Proposed Architecture:**

```typescript
// Single source of truth: Supabase realtime subscriptions
const useBasketUpdates = (basketId: string) => {
  // Subscribe to all relevant tables for this basket
  useEffect(() => {
    const channels = [
      // Work queue for processing status
      supabase.channel(`basket:${basketId}:work`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'canonical_queue',
          filter: `basket_id=eq.${basketId}`
        }, handleWorkUpdate),

      // Blocks for new substrate
      supabase.channel(`basket:${basketId}:blocks`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'blocks',
          filter: `basket_id=eq.${basketId}`
        }, handleBlockCreated),

      // Proposals for governance
      supabase.channel(`basket:${basketId}:proposals`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'proposals',
          filter: `basket_id=eq.${basketId}`
        }, handleProposalUpdate),

      // Relationships for graph updates
      supabase.channel(`basket:${basketId}:relationships`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'substrate_relationships',
          filter: `from_block_id.in.(${blockIds})`
        }, handleRelationshipCreated),
    ];

    channels.forEach(ch => ch.subscribe());
    return () => channels.forEach(ch => supabase.removeChannel(ch));
  }, [basketId]);
};
```

**Benefits:**
- Single subscription hook reused across pages
- No more broken table queries
- Realtime updates everywhere
- Consistent notification logic

---

## 📋 Execution Plan

### Recommended Sequence:

#### Week 1: Audit & Document (Non-Breaking)
**Days 1-2:** Schema alignment audit (grep + fix type definitions)
**Day 3:** Feature gap analysis (what's missing?)
**Days 4-5:** Page-by-page inventory (use template above)

**Deliverable:** Comprehensive audit document listing:
- All schema mismatches
- All missing V3.1 features
- All broken event subscriptions
- Prioritized fix list

#### Week 2: Foundation Fixes (Breaking Changes)
**Days 1-2:** Fix all schema queries (context_items → blocks)
**Day 3:** Update type definitions to match V3.0/V3.1
**Days 4-5:** Implement unified event subscription hook

**Deliverable:** All pages query correct schema, no broken tables

#### Week 3: Feature Integration
**Days 1-2:** Add V3.1 UI components (relationships, confidence scores)
**Days 3-4:** Wire up semantic search frontend
**Day 5:** Polish and test

**Deliverable:** V3.1 features visible and functional

#### Week 4: Notification System Overhaul
**Days 1-2:** Remove app_events/timeline_events
**Day 3-4:** Implement realtime-only notifications
**Day 5:** User testing and refinement

**Deliverable:** Clean, consistent event system

---

## 🚨 Risk Assessment

### If You Fix Notifications First:
- **Risk:** High
- **Reason:** You'll discover schema issues while fixing notifications, requiring rework
- **Timeline:** 1 week notification fix + 2 weeks schema fixes = 3 weeks total
- **Quality:** Patchy, inconsistent

### If You Audit First:
- **Risk:** Low
- **Reason:** You understand the full scope before changing code
- **Timeline:** 1 week audit + 3 weeks systematic fixes = 4 weeks total
- **Quality:** Comprehensive, consistent

**Verdict:** Audit-first is 25% longer but MUCH lower risk

---

## 💡 Immediate Quick Wins (While Planning Audit)

You can do these NOW without waiting for full audit:

1. **Fix MemoryClient context_items_count** (5 min)
   ```tsx
   // Line 108: Change from context_items_count to relationships_count
   {stats?.relationships_count ?? 0}
   ```

2. **Add relationship count to stats API** (15 min)
   ```typescript
   // api/baskets/[id]/stats/route.ts
   const relationships = await supabase
     .table('substrate_relationships')
     .select('id', { count: 'exact', head: true })
     .eq('basket_id', basketId)
     .execute();
   ```

3. **Remove timeline_events queries** (10 min)
   ```bash
   # Find and delete all timeline_events code
   grep -r "timeline_events" web/ | cut -d: -f1 | uniq
   # Then remove those queries
   ```

4. **Add semantic duplicate toast** (20 min)
   ```tsx
   // In governance processor after duplicate detection
   if (duplicatesSkipped > 0) {
     await notificationAPI.emitActionResult(
       'duplicate_detection',
       `Found ${duplicatesSkipped} duplicates, skipped`
     );
   }
   ```

**Total: 50 minutes of work, immediate user-visible improvements**

---

## 🎯 Success Criteria

### After Full Audit + Refactor:
✅ No queries to deleted tables (context_items, timeline_events)
✅ All V3.1 features visible in UI (embeddings, relationships, confidence)
✅ Consistent realtime updates across all pages
✅ Single event subscription architecture
✅ User knows what's happening at all times (no silent processing)
✅ All semantic types match V3.0 taxonomy
✅ Governance states (PROPOSED/ACCEPTED) clear
✅ Semantic search exposed and functional

---

## 🔄 What About Notifications?

**Answer:** They get fixed automatically during Phase 4

By that point you'll have:
- Fixed all schema queries (no more broken table errors)
- Added realtime subscriptions everywhere
- Unified event handling logic

Then notifications become simple:
```typescript
// Single notification component
<NotificationProvider>
  {children}
</NotificationProvider>

// Listens to realtime events
// Shows consistent toasts
// No custom logic per page
```

---

## 📊 ROI Comparison

### Option A: Fix Notifications Now
- **Time:** 1 week
- **Benefit:** Cleaner notifications
- **Cost:** Will need to refactor again during schema fixes
- **Total Work:** 4 weeks (1 notifications + 3 schema fixes)

### Option B: Audit First, Then Fix Holistically
- **Time:** 4 weeks
- **Benefit:** Everything fixed once, comprehensively
- **Cost:** Slightly longer upfront
- **Total Work:** 4 weeks (1 audit + 3 systematic fixes)

**Winner:** Option B - same total time, WAY better quality

---

## 🚀 Recommended Next Steps

1. **This Week:**
   - Run schema audit (grep commands above)
   - Do 4 quick wins (50 min total)
   - Start page-by-page inventory

2. **Next Week:**
   - Complete inventory
   - Write comprehensive audit doc
   - Present findings and get buy-in

3. **Following 3 Weeks:**
   - Execute systematic refactor
   - Fix notifications as part of Phase 4
   - Launch V3.1-aligned frontend

---

## 🤔 Open Question for You

**Do you want to:**

A. **Go deep on audit first?**
   - I can help run the grep searches
   - Create the page-by-page inventory
   - Draft the comprehensive audit doc
   - **Timeline:** 1 week of investigation, then 3 weeks of fixes

B. **Hybrid approach?**
   - Fix the 4 quick wins NOW (50 min)
   - Audit 1-2 critical pages (governance, blocks)
   - Fix those pages deeply
   - Continue incrementally
   - **Timeline:** Rolling, page-by-page

C. **Just fix notifications?**
   - Focus only on event system
   - Leave schema issues for later
   - **Timeline:** 1 week notifications, schema debt grows

**My recommendation:** **Option B (Hybrid)**

**Why:**
- Quick wins give immediate user value
- Page-by-page lets you learn as you go
- Less risky than big-bang refactor
- Fits with your iterative style
- Can course-correct based on findings

---

**Your Call:** What feels right for YARNNN's current pace and priorities?

*Document Status: Strategic Recommendation*
*Author: Claude*
*Date: 2025-10-15*
