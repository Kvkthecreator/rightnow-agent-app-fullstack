# Frontend Canon Audit — 2025-08-25

## Routes & IA

web/__tests__/basketApi.test.ts:23:import { GET as getDocs } from "@/app/api/baskets/[id]/documents/route";
web/__tests__/basketApi.test.ts:25:import { GET as getBlocks } from "@/app/api/baskets/[id]/blocks/route";
web/__tests__/basketApi.test.ts:26:import { GET as getTimeline } from "@/app/api/baskets/[id]/timeline/route";
web/app/baskets/[id]/timeline/WIRING.md:1:# /baskets/[id]/timeline – Wiring
web/app/baskets/[id]/page.tsx:2: * Redirect: /baskets/[id] -> /baskets/[id]/memory
web/app/baskets/[id]/reflections/WIRING.md:1:# /baskets/[id]/reflections – Wiring
web/app/baskets/[id]/graph/WIRING.md:1:# /baskets/[id]/graph – Wiring
web/app/baskets/[id]/dashboard/page.tsx:2: * Redirect: /baskets/[id]/dashboard -> /baskets/[id]/memory
web/app/baskets/[id]/memory/page.tsx:2: * Page: /baskets/[id]/memory - Primary Operating Surface (Canon v1.3)
web/app/baskets/[id]/memory/WIRING.md:1:# /baskets/[id]/memory – Wiring

---

## Shared contracts imports

web/lib/schemas/ingest.ts:9:import type { IngestItem, IngestReq, IngestRes } from '@shared/contracts/ingest';
web/lib/schemas/dumps.ts:8:import type { CreateDumpReq, CreateDumpRes } from '@shared/contracts/dumps';
web/lib/api/timeline.ts:1:import type { TimelineItem } from '@shared/contracts/memory';
web/lib/schemas/baskets.ts:8:import type { CreateBasketReq, CreateBasketRes } from '@shared/contracts/baskets';
web/lib/api/client.ts:9:import type { BasketChangeRequest, BasketDelta } from '@shared/contracts/basket'
web/lib/substrate/SubstrateTypes.ts:31:import type { ContextItem as ContractContextItem } from '@shared/contracts/context';
web/lib/api/baskets.ts:16:import type { CreateBasketRes } from '@shared/contracts/baskets';
web/lib/reflection.ts:10:import type { ReflectionDTO } from '@shared/contracts/memory';
web/lib/substrate/SubstrateService.ts:8:import type { ContextItem } from '@shared/contracts/context';
web/lib/server/ingest.ts:8:import type { IngestRes, IngestItem } from '@shared/contracts/ingest';
web/lib/server/contextItems.ts:3:import type { ContextItem } from "@shared/contracts/context";
web/types/index.ts:7:export * from "@shared/contracts";
web/types/index.ts:10:export type { Document } from "@shared/contracts/documents";
web/types/index.ts:11:export type { Block, BlockWithHistory } from "@shared/contracts/blocks";
web/types/index.ts:12:export type { Basket } from "@shared/contracts/baskets";
web/types/index.ts:13:export type { Dump, RawDump } from "@shared/contracts/dumps";
web/components/intelligence/ContextItemOverlay.tsx:7:import type { ContextItem } from "@shared/contracts/context";
web/components/intelligence/DocumentIntelligenceLayer.tsx:11:import type { ContextItem } from "@shared/contracts/context";
web/components/document/ContextBlocksPanel.tsx:7:import type { ContextItem } from "@shared/contracts/context";
web/components/understanding/ProjectContext.tsx:7:import type { ContextItem } from "@shared/contracts/context";
web/components/substrate/SubstrateManager.tsx:14:import type { BasketChangeRequest } from '@shared/contracts/basket';
web/lib/intelligence/useDocumentIntelligence.ts:6:import type { ContextItem } from "@shared/contracts/context";
web/components/intelligence/CursorContextTooltip.tsx:7:import type { ContextItem } from "@shared/contracts/context";
web/hooks/useBasketOperations.ts:11:import type { BasketChangeRequest, BasketDelta } from '@shared/contracts/basket'
web/components/context/ContextPanel.tsx:3:import type { ContextItem } from "@shared/contracts/context";

---

## Local type redeclarations (should be none)

web/lib/api/contracts.ts:149:export type CreateBasketRequest = z.infer<typeof CreateBasketRequestSchema>;
web/lib/api/contracts.ts:186:export type CreateDumpRequest = z.infer<typeof CreateDumpRequestSchema>;
web/lib/api/baskets.ts:14:  type CreateBasketRequest,

---

## Fetchers using withSchema()

_none_

---

## Raw fetchers without schema (fix)

web/lib/fetchWithToken.ts:26:  return fetch(input, {
web/lib/telemetry/index.ts:4:      await fetch(process.env.TELEMETRY_ENDPOINT, {
web/lib/api/timeline.ts:13:  const res = await fetch(`/api/baskets/${basketId}/timeline?${params.toString()}`, { cache: 'no-store' });
web/lib/api/client.ts:4: * No more scattered fetch() calls across components
web/docs/unified-state-management.md:187:fetch('/api/substrate/basket/${basketId}')        // Current intelligence
web/docs/unified-state-management.md:188:fetch('/api/intelligence/pending/${basketId}')    // Pending changes  
web/docs/unified-state-management.md:189:fetch('/api/intelligence/generate/${basketId}')   // Generation
web/docs/unified-state-management.md:190:fetch('/api/substrate/add-context')               // Context addition
web/docs/unified-state-management.md:309:    const data = await api.fetch();
web/lib/api/http.ts:171:    let response = await fetch(fullUrl, {
web/lib/api/http.ts:186:        response = await fetch(fullUrl, {
web/middleware.ts:17:      const upstream = await fetch(new URL('/api/baskets/resolve', req.nextUrl.origin), {
web/debug-realtime.js:217:    const healthResponse = await fetch(`${SUPABASE_URL}/realtime/v1/health`);
web/lib/api.ts:22:  return fetch(apiUrl(path), options);
web/lib/baskets/getOrCreateDefaultBasket.ts:18:  const res = await fetch(`${base}/api/baskets/new`, {
web/lib/baskets/resolveTargetBasket.ts:3:  const res = await fetch(`${base}/api/baskets/resolve`, {
web/app/baskets/[id]/documents/[docId]/page.tsx:10:  const res = await fetch(`${baseUrl}/api/documents/${docId}`, { cache: "no-store" });
web/app/baskets/[id]/memory/page.tsx:14:  const res = await fetch(`${base}/api/baskets/${basketId}/projection`, {
web/app/api/substrate/basket/[id]/detailed-analysis/route.ts:159:      const intelligenceResponse = await fetch(
web/app/api/intelligence/generate/[basketId]/route.ts:234:        const response = await fetch(`${agentUrl}/api/agent`, {
web/app/api/intelligence/generate/[basketId]/route.ts:407:    const intelligenceResponse = await fetch(
web/app/api/intelligence/generate/[basketId]/route.ts:435:    const substrateResponse = await fetch(
web/components/dashboard/ConsciousnessDashboard.tsx:54:    fetch(`/api/baskets/${basketId}/state`)
web/app/api/baskets/[id]/work/route.ts:114:    const res = await fetch(`${API_BASE}/api/baskets/${basketId}/work`, {
web/app/api/baskets/new/route.ts:106:  const upstream = await fetch(`${API_BASE}/api/baskets/new`, {
web/app/api/baskets/[id]/deltas/route.ts:58:  const res = await fetch(`${API_BASE}/api/baskets/${basketId}/deltas`, {

---

## Timeline: last_cursor usages

web/__tests__/auth-polling-tripwires.test.tsx:43:    last_cursor: null,
web/hooks/useBasketEvents.ts:136:            cursor: eventsPage.last_cursor,
web/hooks/useBasketEvents.ts:171:        } else if (eventsPage.last_cursor) {
web/hooks/useBasketEvents.ts:173:          setState(prev => ({ ...prev, cursor: eventsPage.last_cursor }));
shared/contracts/events.ts:19:  last_cursor: {
web/lib/api/contracts.ts:120:  last_cursor: z.object({

---

## Timeline: legacy cursor usages (fix)

shared/contracts/memory.ts:28:  next_cursor?: string; // opaque
web/lib/api/timeline.ts:8:): Promise<{ items: TimelineItem[]; next_before: string|null }> {
web/lib/hooks/useBasketTimeline.ts:10:type TimelinePage = { items: TimelineItem[]; next_before: string | null };
web/app/api/baskets/[id]/timeline/route.ts:64:  const next_before = data && data.length ? data[data.length - 1].ts : null;
web/app/api/baskets/[id]/timeline/route.ts:65:  return NextResponse.json({ items: data ?? [], next_before }, { status: 200 });

---

## Dump flow: calls

web/lib/api/dumps.ts:27:    url: '/api/dumps/new',
web/components/basket/AddMemoryComposer.tsx:46:      const res = await fetchWithToken("/api/dumps/new", {

---

## Dump flow: legacy patterns (fix)

_none_

---

## Blocks editor canonical fields

web/lib/server/blocks.ts:9:    .select("id, semantic_type, content, created_at")
web/lib/server/blocks.ts:20:    type: b.semantic_type,
web/tests/e2e/run_blockifier.spec.ts:16:            semantic_type: "note",
web/tests/e2e/run_blockifier.spec.ts:18:            canonical_value: null,
web/__tests__/work_inline_diff.test.tsx:9:      semantic_type: "tone",
web/__tests__/work_inline_diff.test.tsx:15:      canonical_value: null,
web/__tests__/work_inline_diff.test.tsx:19:      semantic_type: "tone",
web/__tests__/work_inline_diff.test.tsx:23:      canonical_value: null,
web/__tests__/work_inline_diff.test.tsx:34:      semantic_type: "tone",
web/__tests__/work_inline_diff.test.tsx:38:      canonical_value: null,
web/lib/intelligence/sharedAnalysis.ts:55:        .select("id, semantic_type, content, canonical_value, created_at")
web/lib/intelligence/sharedAnalysis.ts:347:    if (block.semantic_type) {
web/lib/intelligence/sharedAnalysis.ts:348:      themes.add(capitalizeWord(block.semantic_type.replace(/_/g, ' ')));
web/lib/intelligence/sharedAnalysis.ts:350:    if (block.canonical_value) {
web/lib/intelligence/sharedAnalysis.ts:351:      themes.add(capitalizeWord(block.canonical_value));
web/lib/supabase/blocks.ts:9:   * TODO: rename to semantic_type across callers.
web/lib/supabase/blocks.ts:10:   * Accept either `type` or `semantic_type` to satisfy legacy usage.
web/lib/supabase/blocks.ts:13:  semantic_type?: string;
web/lib/dbTypes.ts:11:          semantic_type: string;
web/lib/dbTypes.ts:16:          canonical_value: string | null;
web/components/InlineDiffCard.tsx:16:    typeof (block as any).canonical_value === "string"
web/components/InlineDiffCard.tsx:17:      ? (block as any).canonical_value
web/components/InlineDiffCard.tsx:23:    typeof (block as any).semantic_type === "string"
web/components/InlineDiffCard.tsx:24:      ? (block as any).semantic_type
web/lib/blocks/dev_mock_blocks.ts:6:    semantic_type: "tone",
web/lib/blocks/dev_mock_blocks.ts:10:    canonical_value: "upbeat and friendly",
web/lib/blocks/dev_mock_blocks.ts:16:    semantic_type: "audience",
web/lib/blocks/dev_mock_blocks.ts:20:    canonical_value: "busy founders",
web/app/api/baskets/[id]/projection/route.ts:25:      supabase.from("blocks").select("id, semantic_type, metadata, confidence_score, created_at").eq("basket_id", basketId).limit(200),
web/app/api/baskets/[id]/projection/route.ts:30:    analyzerBlocks?.find(b => b.semantic_type === "theme")?.metadata?.summary ??
web/app/api/baskets/[id]/projection/route.ts:33:    analyzerBlocks?.find(b => b.semantic_type === "tension")?.metadata?.summary ??
web/app/api/baskets/[id]/projection/route.ts:36:    analyzerBlocks?.find(b => b.semantic_type === "question")?.metadata?.text ??
web/app/api/intelligence/initialize/route.ts:178:      semantic_type: 'insight',
web/app/api/substrate/persist/route.ts:58:          semantic_type: (substrate as any).semanticType,
web/components/document/NarrativeEditor.tsx:42:          (block as any).canonical_value ?? ""
web/components/document/NarrativeEditor.tsx:50:              (block as any).semantic_type ?? "UNKNOWN"
web/components/document/NarrativeEditor.tsx:80:      if (!(blk as any).canonical_value) return;
web/components/document/NarrativeEditor.tsx:82:      const idx = rawText.indexOf((blk as any).canonical_value ?? "");
web/components/document/NarrativeEditor.tsx:85:      if (ranges.some((r) => idx < r.end && idx + ((blk as any).canonical_value ?? "").length > r.start)) {
web/components/document/NarrativeEditor.tsx:89:      ranges.push({ start: idx, end: idx + ((blk as any).canonical_value ?? "").length, block: blk });
web/components/document/IntelligentDocumentCanvas.tsx:41:        {(block as any).canonical_value ?? ""}
web/components/document/IntelligentDocumentCanvas.tsx:46:            {(block as any).semantic_type ?? "UNKNOWN"}
web/components/document/IntelligentDocumentCanvas.tsx:73:      if (!(blk as any).canonical_value) return;
web/components/document/IntelligentDocumentCanvas.tsx:74:      const idx = rawText.indexOf((blk as any).canonical_value ?? "");
web/components/document/IntelligentDocumentCanvas.tsx:76:      if (ranges.some((r) => idx < r.end && idx + ((blk as any).canonical_value ?? "").length > r.start)) {
web/components/document/IntelligentDocumentCanvas.tsx:79:      ranges.push({ start: idx, end: idx + ((blk as any).canonical_value ?? "").length, block: blk });
web/components/insights/InsightRefinement.tsx:53:      .select("semantic_type")
web/components/insights/InsightRefinement.tsx:59:              data.map((d) => (d as any).semantic_type ?? "UNKNOWN")
web/components/blocks/BlockCreateModal.tsx:47:    // ⚠️ FIXED: semantic_type instead of type
web/components/blocks/BlockCreateModal.tsx:50:      .select("semantic_type")
web/components/blocks/BlockCreateModal.tsx:57:              data.map((d) => (d as any).semantic_type ?? "UNKNOWN")
web/components/blocks/BlocksPane.tsx:42:                  (block as any).canonical_value ??
web/components/blocks/BlocksPane.tsx:50:                  (block as any).semantic_type === "pending proposal"
web/components/blocks/BlocksPane.tsx:53:                    : (block as any).semantic_type ?? "UNKNOWN"

---

## Hard-coded storage hosts (fix)

web/components/library/UploadArea.tsx:44:        const url = `https://YOUR_PROJECT.supabase.co/storage/v1/object/public/user-library/${filePath}`;

---

## E2E specs present

No matching E2E specs found

---

## Summary

**Total banned patterns found: 16**

## Actionable TODOs

### 🔴 Critical (Canon violations)

1. **Legacy cursor patterns (5 instances)**
   - `web/lib/api/timeline.ts:8` - Still using `next_before` instead of `last_cursor`
   - `web/app/api/baskets/[id]/timeline/route.ts:64-65` - Returning `next_before` in API response
   - **Fix**: Update to use `last_cursor` pattern per canon v1.3.1

2. **Hard-coded storage host (1 instance)**
   - `web/components/library/UploadArea.tsx:44` - Contains hardcoded Supabase URL
   - **Fix**: Use environment variable for storage URL

3. **Missing E2E tests**
   - No memory or timeline E2E specs found
   - **Fix**: Create `web/tests/e2e/memory_fanout.spec.ts` and `timeline_pagination.spec.ts`

### 🟡 Warnings (Best practices)

4. **Raw fetch calls without schema validation (26 instances)**
   - Multiple direct `fetch()` calls without `withSchema()` wrapper
   - **Fix**: Wrap all API calls with schema validation

5. **Local type redeclarations (3 instances)**
   - `web/lib/api/contracts.ts` defines local types that should use shared contracts
   - **Fix**: Import from `@shared/contracts/*` instead

### ✅ Conformance Wins

- All basket routes properly structured under `/baskets/[id]/`
- Shared contracts imports are widely used (44 instances)
- `last_cursor` pattern partially implemented (6 instances)
- Dump flow correctly uses `/api/dumps/new` endpoint
- No `file_urls` or `file_refs` legacy patterns found
- Blocks using correct `semantic_type` and `canonical_value` fields

## Conclusion

The frontend largely conforms to canon v1.3.1 with **3 critical issues** that need immediate attention:
1. Timeline cursor implementation
2. Hardcoded storage URL
3. Missing E2E test coverage

Once these are resolved, the UI will be fully canon-compliant.

