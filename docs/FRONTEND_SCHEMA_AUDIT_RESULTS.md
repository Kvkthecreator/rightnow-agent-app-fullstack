# Frontend Schema Audit Results

**Date:** 2025-10-15
**Scope:** V3.0 schema alignment (context_items → blocks)
**Status:** 🔴 **CRITICAL - Multiple Misalignments Found**

---

## 🔍 Audit Summary

**Total Issues Found:** 28 context_items references
**Pages Affected:** 10 frontend pages + 8 API routes
**Severity:** HIGH - Core features broken or showing incorrect data

---

## 📋 Detailed Findings

### Category 1: API Routes (Backend Queries)

These query the deleted `context_items` table and will **fail in production**.

#### 🔴 **CRITICAL - Broken Queries**

1. **`app/api/baskets/[id]/stats/route.ts`** - Lines 24-26
   ```typescript
   context_items_count: number;  // Field name wrong
   supabase.from('context_items')  // TABLE DOESN'T EXIST
   ```
   **Impact:** Stats API broken, memory page shows wrong count
   **Fix:** Query `blocks` table, filter by semantic_type for "meaning" blocks

2. **`app/api/baskets/[id]/uploads/route.ts`** - Multiple lines
   ```typescript
   .from('context_items')  // TABLE DOESN'T EXIST
   derived_context_items: derivedContextItems,
   total_context_items: contextItems.length,
   ```
   **Impact:** Uploads page broken
   **Fix:** Remove context_items queries, use blocks

3. **`app/api/baskets/[id]/purge/route.ts`** - Line ~45
   ```typescript
   supabase.from('context_items').select('id,status')  // TABLE DOESN'T EXIST
   ```
   **Impact:** Basket purge feature broken
   **Fix:** Query blocks table only

4. **`app/api/baskets/[id]/purge/preview/route.ts`** - Multiple lines
   ```typescript
   supabase.from('context_items')  // TABLE DOESN'T EXIST
   context_items: items.count || 0,
   ```
   **Impact:** Can't preview purge operation
   **Fix:** Remove context_items from preview

5. **`app/api/baskets/[id]/proposals/[proposalId]/approve/route.ts`** - Multiple lines
   ```typescript
   supabase.from('context_items')  // TABLE DOESN'T EXIST
   context_items_count
   totalSubstrate = blocks_count + context_items_count
   ```
   **Impact:** Proposal approval might fail or show wrong counts
   **Fix:** Remove context_items logic

---

### Category 2: Frontend Pages (UI Display)

These display fields that no longer exist or query wrong tables.

#### 🟡 **MEDIUM - Incorrect Data Display**

6. **`app/baskets/[id]/memory/MemoryClient.tsx`** - Line 108
   ```tsx
   {stats?.context_items_count ?? 0}
   ```
   **Impact:** Shows "Links" count but queries context_items (table doesn't exist)
   **Fix:** Change to `relationships_count` and update label to "Relationships"
   **Quick Win:** Already identified, just needs implementation

7. **`app/baskets/[id]/settings/DangerZoneClient.tsx`** - Multiple lines
   ```tsx
   counts: { blocks: number; context_items: number; dumps: number }
   <Badge>Context Items {counts.context_items}</Badge>
   ```
   **Impact:** Settings page shows wrong count
   **Fix:** Remove context_items, show relationships count instead

8. **`app/baskets/[id]/graph/page.tsx`** - Lines ~20
   ```tsx
   .from('context_items')  // TABLE DOESN'T EXIST
   context_items: contextItemsResult.data || [],
   ```
   **Impact:** Graph page broken (can't load context items)
   **Fix:** Remove context_items query, show relationships instead

9. **`app/baskets/[id]/uploads/UploadsClient.tsx`** - Multiple lines
   ```tsx
   derived_context_items: DerivedContextItem[];
   total_context_items: number;
   {data?.stats.total_context_items ?? 0} meanings extracted
   {capture.derived_context_items.length} meanings
   ```
   **Impact:** Uploads page shows wrong statistics
   **Fix:** Change to show meaning_blocks count (blocks where semantic_type in meaning category)

10. **`app/baskets/[id]/dashboard/page.tsx`** - Line ~90
    ```tsx
    context_items_to_deprecate: string[]
    Array.isArray(c.context_items_to_deprecate)
    ```
    **Impact:** Dashboard maintenance widget broken
    **Fix:** Remove or replace with deprecated_blocks logic

11. **`app/baskets/[id]/maintenance/MaintenanceClient.tsx`** - Multiple lines
    ```tsx
    context_items_to_deprecate: string[];
    {data.candidates.context_items_to_deprecate.length}
    {data.candidates.context_items_to_deprecate.map(id => ...)}
    ```
    **Impact:** Maintenance page broken
    **Fix:** Remove context_items deprecation logic

12. **`app/baskets/[id]/building-blocks/BuildingBlocksClient.tsx`** - Comments only
    ```tsx
    // V3.0: Changed context_items filter to meaning_blocks filter
    // V3.0: Filter to meaning semantic_types (was context_items)
    ```
    **Impact:** None - just outdated comments
    **Fix:** Update comments or remove

---

## 🎯 Priority Matrix

### 🔥 **P0 - Fix Immediately (Blocking Core Features)**

1. `/api/baskets/[id]/stats` - Memory page can't load
2. `/api/baskets/[id]/uploads` - Uploads broken
3. `/api/baskets/[id]/graph` - Graph page broken
4. `/api/baskets/[id]/purge` - Can't delete baskets

**Estimated Time:** 2 hours
**Impact:** Core user workflows broken

---

### 🟡 **P1 - Fix This Week (Degraded UX)**

5. `MemoryClient.tsx` - Shows wrong "Links" count
6. `DangerZoneClient.tsx` - Settings show wrong data
7. `UploadsClient.tsx` - Stats display incorrect
8. `MaintenanceClient.tsx` - Maintenance widget broken
9. `/api/proposals/.../approve` - Approval stats wrong

**Estimated Time:** 3 hours
**Impact:** Features work but show incorrect data

---

### 🟢 **P2 - Fix When Convenient (Non-Critical)**

10. `dashboard/page.tsx` - Deprecation widget (likely unused)
11. `building-blocks` comments - Just documentation cleanup

**Estimated Time:** 30 minutes
**Impact:** Minimal

---

## 🔧 Recommended Fixes

### Fix 1: Update Stats API (P0)

**File:** `app/api/baskets/[id]/stats/route.ts`

**Before:**
```typescript
context_items_count: number;

const { count: context_items_count } = await supabase
  .from('context_items')
  .select('*', { count: 'exact', head: true })
  .eq('basket_id', basketId)
  .execute();

stats: {
  context_items_count: context_items_count || 0,
}
```

**After:**
```typescript
relationships_count: number;

// Get relationship count for this basket
const { count: relationships_count } = await supabase
  .from('substrate_relationships')
  .select('*', { count: 'exact', head: true })
  .or(`from_block_id.in.(${blockIds}),to_block_id.in.(${blockIds})`)
  .execute();

// Optional: Get meaning blocks count
const { count: meaning_blocks_count } = await supabase
  .from('blocks')
  .select('*', { count: 'exact', head: true })
  .eq('basket_id', basketId)
  .in('semantic_type', ['intent', 'objective', 'rationale', 'principle', 'assumption', 'context', 'constraint'])
  .execute();

stats: {
  relationships_count: relationships_count || 0,
  meaning_blocks_count: meaning_blocks_count || 0,
}
```

---

### Fix 2: Update Memory Client (P0)

**File:** `app/baskets/[id]/memory/MemoryClient.tsx`

**Before:**
```tsx
<div className="flex items-center gap-2">
  <LinkIcon className="h-4 w-4 text-purple-600" />
  <span className="text-sm font-medium text-slate-600">Links</span>
</div>
{!statsLoading && (
  <span className="text-2xl font-semibold text-slate-900">
    {stats?.context_items_count ?? 0}
  </span>
)}
<p className="text-xs text-slate-500">Connections and tags</p>
```

**After:**
```tsx
<div className="flex items-center gap-2">
  <LinkIcon className="h-4 w-4 text-purple-600" />
  <span className="text-sm font-medium text-slate-600">Relationships</span>
</div>
{!statsLoading && (
  <span className="text-2xl font-semibold text-slate-900">
    {stats?.relationships_count ?? 0}
  </span>
)}
<p className="text-xs text-slate-500">Causal connections</p>
```

---

### Fix 3: Remove Broken Queries (P0)

**Files to update:**
- `/api/baskets/[id]/uploads/route.ts`
- `/api/baskets/[id]/purge/route.ts`
- `/api/baskets/[id]/purge/preview/route.ts`
- `/api/baskets/[id]/proposals/[proposalId]/approve/route.ts`

**Strategy:** Remove all `context_items` queries, use `blocks` only

---

## 📊 Impact Assessment

### Current State:
- ❌ Memory page shows wrong "Links" count (queries deleted table)
- ❌ Uploads page broken (queries context_items)
- ❌ Graph page broken (queries context_items)
- ❌ Purge/delete basket broken
- ❌ Settings page shows wrong counts
- ❌ Maintenance widget broken

### After Fixes:
- ✅ Memory page shows accurate "Relationships" count
- ✅ Uploads page works with blocks-only logic
- ✅ Graph page shows semantic relationships (V3.1 feature!)
- ✅ Basket deletion works correctly
- ✅ Settings accurate
- ✅ Clean, consistent V3.0/V3.1 alignment

---

## 🚀 Implementation Plan

### Phase 1: Fix Broken APIs (2 hours)
1. Update `/api/baskets/[id]/stats/route.ts`
2. Fix `/api/baskets/[id]/uploads/route.ts`
3. Fix `/api/baskets/[id]/purge/route.ts` and `/purge/preview/route.ts`
4. Fix `/api/baskets/[id]/proposals/[proposalId]/approve/route.ts`
5. Fix `/api/baskets/[id]/graph/page.tsx` (server component)

**Test:** Try each endpoint, verify no context_items errors

### Phase 2: Fix Frontend Display (1 hour)
6. Update `MemoryClient.tsx` - change Links to Relationships
7. Update `DangerZoneClient.tsx` - remove context_items badge
8. Update `UploadsClient.tsx` - use meaning_blocks_count
9. Update `MaintenanceClient.tsx` - remove deprecation widget

**Test:** Visit each page, verify correct counts displayed

### Phase 3: Cleanup (30 min)
10. Update comments in `building-blocks`
11. Remove unused dashboard widgets
12. Add V3.1 relationship visualization to graph page

---

## ✅ Verification Checklist

After fixes are deployed:

```bash
# Test each page loads without errors
[ ] /baskets/[id]/memory - loads, shows relationship count
[ ] /baskets/[id]/uploads - loads, stats correct
[ ] /baskets/[id]/graph - loads, shows relationships
[ ] /baskets/[id]/settings - loads, no context_items
[ ] /baskets/[id]/maintenance - loads or widget removed

# Test API endpoints return 200
[ ] GET /api/baskets/[id]/stats - returns relationships_count
[ ] GET /api/baskets/[id]/uploads - no context_items errors
[ ] POST /api/baskets/[id]/purge/preview - works
[ ] POST /api/baskets/[id]/purge - deletes basket
[ ] POST /api/baskets/[id]/proposals/[id]/approve - works

# Check browser console
[ ] No "context_items" errors
[ ] No "relation does not exist" errors
[ ] No Supabase query errors
```

---

## 💰 Cost/Benefit Analysis

### If We DON'T Fix:
- **Cost:** User-facing features broken
- **Impact:** Memory page, uploads, graph, settings all degraded
- **Time Lost:** Support tickets, user frustration
- **Tech Debt:** Accumulates, harder to fix later

### If We DO Fix:
- **Time:** 3.5 hours total
- **Benefit:** All pages work correctly
- **Bonus:** Ready for V3.1 relationship visualization
- **Maintenance:** Easier going forward (consistent schema)

**ROI:** 🔥 **Immediate high value** - fixes are straightforward, impact is huge

---

## 🎯 Next Steps

1. **Prioritize P0 fixes** - Start with stats API and memory page
2. **Test incrementally** - Fix one file, test, commit, repeat
3. **Add relationship visualization** - Graph page is perfect place to show V3.1 causal relationships
4. **Document changes** - Update component docs to reflect V3.0/V3.1 schema

---

*Audit Complete*
*Status: Ready for Implementation*
*Estimated Total Time: 3.5 hours*
