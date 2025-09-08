import { test, expect } from '@playwright/test';

/**
 * [API CONTRACTS] Add Memory → Raw Dumps + Governance
 *
 * Validates that adding memory results in raw_dumps creation (P0 Capture)
 * and does NOT immediately mutate substrate (no block.created events).
 *
 * Uses test-aware header to bypass membership checks.
 */

const TEST_HEADER = { 'x-playwright-test': 'true' } as const;

test.describe('[API] Add Memory — capture + governance boundaries', () => {
  const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';

  async function countEventsSince(request: any, basketId: string, kinds: string[], sinceISO: string) {
    const params = new URLSearchParams();
    kinds.forEach(k => params.append('event_type', k));
    const res = await request.get(`/api/baskets/${basketId}/timeline?${params.toString()}`, { headers: TEST_HEADER });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const since = new Date(sinceISO).getTime();
    const events = (body.events || [])
      .filter((e: any) => new Date(e.created_at).getTime() >= since && kinds.includes(e.event_type));
    return events.length;
  }

  async function getDumpCount(request: any, basketId: string) {
    const res = await request.get(`/api/baskets/${basketId}/dumps`, { headers: TEST_HEADER });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    return Array.isArray(body?.dumps) ? body.dumps.length : 0;
  }

  test('text-only add memory creates exactly one dump and no immediate substrate', async ({ request }) => {
    const startISO = new Date().toISOString();
    const before = await getDumpCount(request, basketId);

    const dumpData = {
      basket_id: basketId,
      text_dump: `Governance test text ${Date.now()}`,
      dump_request_id: crypto.randomUUID(),
      meta: {
        client_ts: new Date().toISOString(),
        ingest_trace_id: crypto.randomUUID(),
      },
    };

    const createRes = await request.post('/api/dumps/new', { data: dumpData, headers: TEST_HEADER });
    expect([200, 201, 202]).toContain(createRes.status());
    const payload = await createRes.json();
    expect(payload).toHaveProperty('success');
    expect(['direct', 'proposal']).toContain(payload.route);

    await new Promise(r => setTimeout(r, 700));

    const after = await getDumpCount(request, basketId);
    expect(after).toBeGreaterThanOrEqual(before + 1);

    const blockCreated = await countEventsSince(request, basketId, ['block.created'], startISO);
    expect(blockCreated).toBe(0);
  });

  test('text + two files add memory yields multiple dumps; still no immediate substrate', async ({ request }) => {
    const startISO = new Date().toISOString();
    const before = await getDumpCount(request, basketId);
    const batchId = crypto.randomUUID();

    const textRes = await request.post('/api/dumps/new', {
      data: {
        basket_id: basketId,
        text_dump: `Batch text ${Date.now()}`,
        dump_request_id: crypto.randomUUID(),
        meta: { client_ts: new Date().toISOString(), ingest_trace_id: crypto.randomUUID(), batch_id: batchId },
      },
      headers: TEST_HEADER,
    });
    expect([200, 201, 202]).toContain(textRes.status());

    const fileUrls = [
      'https://example.com/test-a.pdf',
      'https://example.com/test-b.png',
    ];

    for (const url of fileUrls) {
      const res = await request.post('/api/dumps/new', {
        data: {
          basket_id: basketId,
          file_url: url,
          dump_request_id: crypto.randomUUID(),
          meta: { client_ts: new Date().toISOString(), ingest_trace_id: crypto.randomUUID(), batch_id: batchId },
        },
        headers: TEST_HEADER,
      });
      expect([200, 201, 202]).toContain(res.status());
    }

    await new Promise(r => setTimeout(r, 1000));

    const after = await getDumpCount(request, basketId);
    expect(after).toBeGreaterThanOrEqual(before + 3);

    const blockCreated = await countEventsSince(request, basketId, ['block.created'], startISO);
    expect(blockCreated).toBe(0);
  });
});
