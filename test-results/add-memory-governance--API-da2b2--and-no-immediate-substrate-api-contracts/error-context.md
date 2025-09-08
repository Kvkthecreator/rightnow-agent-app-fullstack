# Test info

- Name: [API] Add Memory — capture + governance boundaries >> text-only add memory creates exactly one dump and no immediate substrate
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/api-contracts/add-memory-governance.spec.ts:36:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
    at getDumpCount (/Users/macbook/rightnow-agent-app-fullstack/tests/api-contracts/add-memory-governance.spec.ts:31:22)
    at /Users/macbook/rightnow-agent-app-fullstack/tests/api-contracts/add-memory-governance.spec.ts:38:20
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | /**
   4 |  * [API CONTRACTS] Add Memory → Raw Dumps + Governance
   5 |  *
   6 |  * Validates that adding memory results in raw_dumps creation (P0 Capture)
   7 |  * and does NOT immediately mutate substrate (no block.created events).
   8 |  *
   9 |  * Uses test-aware header to bypass membership checks.
   10 |  */
   11 |
   12 | const TEST_HEADER = { 'x-playwright-test': 'true' } as const;
   13 |
   14 | test.describe('[API] Add Memory — capture + governance boundaries', () => {
   15 |   const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
   16 |
   17 |   async function countEventsSince(request: any, basketId: string, kinds: string[], sinceISO: string) {
   18 |     const params = new URLSearchParams();
   19 |     kinds.forEach(k => params.append('event_type', k));
   20 |     const res = await request.get(`/api/baskets/${basketId}/timeline?${params.toString()}`, { headers: TEST_HEADER });
   21 |     expect(res.ok()).toBeTruthy();
   22 |     const body = await res.json();
   23 |     const since = new Date(sinceISO).getTime();
   24 |     const events = (body.events || [])
   25 |       .filter((e: any) => new Date(e.created_at).getTime() >= since && kinds.includes(e.event_type));
   26 |     return events.length;
   27 |   }
   28 |
   29 |   async function getDumpCount(request: any, basketId: string) {
   30 |     const res = await request.get(`/api/baskets/${basketId}/building-blocks`, { headers: TEST_HEADER });
>  31 |     expect(res.ok()).toBeTruthy();
      |                      ^ Error: expect(received).toBeTruthy()
   32 |     const body = await res.json();
   33 |     return body?.counts?.dumps ?? 0;
   34 |   }
   35 |
   36 |   test('text-only add memory creates exactly one dump and no immediate substrate', async ({ request }) => {
   37 |     const startISO = new Date().toISOString();
   38 |     const before = await getDumpCount(request, basketId);
   39 |
   40 |     const dumpData = {
   41 |       basket_id: basketId,
   42 |       text_dump: `Governance test text ${Date.now()}`,
   43 |       dump_request_id: crypto.randomUUID(),
   44 |       meta: {
   45 |         client_ts: new Date().toISOString(),
   46 |         ingest_trace_id: crypto.randomUUID(),
   47 |       },
   48 |     };
   49 |
   50 |     const createRes = await request.post('/api/dumps/new', { data: dumpData, headers: TEST_HEADER });
   51 |     expect([200, 201, 202]).toContain(createRes.status());
   52 |     const payload = await createRes.json();
   53 |     expect(payload).toHaveProperty('success');
   54 |     expect(['direct', 'proposal']).toContain(payload.route);
   55 |
   56 |     await new Promise(r => setTimeout(r, 700));
   57 |
   58 |     const after = await getDumpCount(request, basketId);
   59 |     expect(after).toBeGreaterThanOrEqual(before + 1);
   60 |
   61 |     const blockCreated = await countEventsSince(request, basketId, ['block.created'], startISO);
   62 |     expect(blockCreated).toBe(0);
   63 |   });
   64 |
   65 |   test('text + two files add memory yields multiple dumps; still no immediate substrate', async ({ request }) => {
   66 |     const startISO = new Date().toISOString();
   67 |     const before = await getDumpCount(request, basketId);
   68 |     const batchId = crypto.randomUUID();
   69 |
   70 |     const textRes = await request.post('/api/dumps/new', {
   71 |       data: {
   72 |         basket_id: basketId,
   73 |         text_dump: `Batch text ${Date.now()}`,
   74 |         dump_request_id: crypto.randomUUID(),
   75 |         meta: { client_ts: new Date().toISOString(), ingest_trace_id: crypto.randomUUID(), batch_id: batchId },
   76 |       },
   77 |       headers: TEST_HEADER,
   78 |     });
   79 |     expect([200, 201, 202]).toContain(textRes.status());
   80 |
   81 |     const fileUrls = [
   82 |       'https://example.com/test-a.pdf',
   83 |       'https://example.com/test-b.png',
   84 |     ];
   85 |
   86 |     for (const url of fileUrls) {
   87 |       const res = await request.post('/api/dumps/new', {
   88 |         data: {
   89 |           basket_id: basketId,
   90 |           file_url: url,
   91 |           dump_request_id: crypto.randomUUID(),
   92 |           meta: { client_ts: new Date().toISOString(), ingest_trace_id: crypto.randomUUID(), batch_id: batchId },
   93 |         },
   94 |         headers: TEST_HEADER,
   95 |       });
   96 |       expect([200, 201, 202]).toContain(res.status());
   97 |     }
   98 |
   99 |     await new Promise(r => setTimeout(r, 1000));
  100 |
  101 |     const after = await getDumpCount(request, basketId);
  102 |     expect(after).toBeGreaterThanOrEqual(before + 3);
  103 |
  104 |     const blockCreated = await countEventsSince(request, basketId, ['block.created'], startISO);
  105 |     expect(blockCreated).toBe(0);
  106 |   });
  107 | });
  108 |
```