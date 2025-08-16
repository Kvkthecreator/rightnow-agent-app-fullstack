import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';
import { getTestJwt } from './utils/auth';

test.describe('Basket ingest API', () => {
  test('creates basket and dumps atomically with idempotency', async ({ request }) => {
    const jwt = await getTestJwt();
    const idempotencyKey = randomUUID();
    const dumpReq1 = randomUUID();
    const dumpReq2 = randomUUID();

    const payload = {
      idempotency_key: idempotencyKey,
      basket: { name: 'Combined Ingest' },
      dumps: [
        { dump_request_id: dumpReq1, text_dump: 'First dump' },
        { dump_request_id: dumpReq2, text_dump: 'Second dump' },
      ],
    };

    const res1 = await request.post('/api/baskets/ingest', {
      headers: { Authorization: `Bearer ${jwt}` },
      data: payload,
    });
    expect(res1.ok()).toBeTruthy();
    const data1 = await res1.json();
    expect(data1.basket.created).toBe(true);
    expect(data1.dumps).toHaveLength(2);

    const res2 = await request.post('/api/baskets/ingest', {
      headers: { Authorization: `Bearer ${jwt}` },
      data: payload,
    });
    expect(res2.ok()).toBeTruthy();
    const data2 = await res2.json();
    expect(data2.basket.created).toBe(false);
    for (const d of data2.dumps) {
      expect(d.created).toBe(false);
    }
  });
});
