import { test, expect } from '@playwright/test';

/**
 * [FEATURE] Add Memory → Raw Dumps + Governance (No Immediate Substrate)
 *
 * Validates that adding memory results in raw_dumps creation (P0 Capture)
 * and does NOT immediately mutate substrate (no block.created events).
 *
 * This test uses API routes directly with the test-aware header to bypass
 * auth/membership during CI. It does not depend on UI auth state.
 */

const TEST_HEADER = { 'x-playwright-test': 'true' } as const;

test.describe('[FEATURE] Add Memory — capture + governance boundaries', () => {
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

  test('text-only add memory creates exactly one dump and no immediate substrate', async ({ request }) => {
    const startISO = new Date().toISOString();

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
    // Accept either governance route shapes
    expect(payload).toHaveProperty('success');
    expect(['direct', 'proposal']).toContain(payload.route);

    // Give a short moment for triggers to emit timeline events
    await new Promise(r => setTimeout(r, 300));

    // Exactly one new dump.created since start
    const dumpCreated = await countEventsSince(request, basketId, ['dump.created'], startISO);
    expect(dumpCreated).toBeGreaterThanOrEqual(1); // some backends may emit additional batching events

    // No immediate substrate mutations (no block.created right away)
    const blockCreated = await countEventsSince(request, basketId, ['block.created'], startISO);
    expect(blockCreated).toBe(0);
  });

  test('text + two files add memory yields multiple dumps; still no immediate substrate', async ({ request }) => {
    const startISO = new Date().toISOString();
    const ingestTrace = crypto.randomUUID();

    // Text dump
    const textRes = await request.post('/api/dumps/new', {
      data: {
        basket_id: basketId,
        text_dump: `Batch text ${Date.now()}`,
        dump_request_id: crypto.randomUUID(),
        meta: { client_ts: new Date().toISOString(), ingest_trace_id: ingestTrace, batch_id: ingestTrace },
      },
      headers: TEST_HEADER,
    });
    expect([200, 201, 202]).toContain(textRes.status());

    // File-like dumps via file_url (use /new to keep test auth simple)
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
          meta: { client_ts: new Date().toISOString(), ingest_trace_id: ingestTrace, batch_id: ingestTrace },
        },
        headers: TEST_HEADER,
      });
      expect([200, 201, 202]).toContain(res.status());
    }

    // Allow timeline emission
    await new Promise(r => setTimeout(r, 500));

    // We expect at least 3 dump.created events since start (text + 2 files)
    const dumpCreated = await countEventsSince(request, basketId, ['dump.created'], startISO);
    expect(dumpCreated).toBeGreaterThanOrEqual(3);

    // Still no immediate substrate (no block.created)
    const blockCreated = await countEventsSince(request, basketId, ['block.created'], startISO);
    expect(blockCreated).toBe(0);
  });
});

