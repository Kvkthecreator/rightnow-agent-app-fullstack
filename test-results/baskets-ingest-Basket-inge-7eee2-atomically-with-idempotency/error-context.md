# Test info

- Name: Basket ingest API >> creates basket and dumps atomically with idempotency
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/baskets-ingest.spec.ts:6:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
    at /Users/macbook/rightnow-agent-app-fullstack/tests/baskets-ingest.spec.ts:25:23
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import { randomUUID } from 'crypto';
   3 | import { getTestJwt } from './utils/auth';
   4 |
   5 | test.describe('Basket ingest API', () => {
   6 |   test('creates basket and dumps atomically with idempotency', async ({ request }) => {
   7 |     const jwt = await getTestJwt();
   8 |     const idempotencyKey = randomUUID();
   9 |     const dumpReq1 = randomUUID();
  10 |     const dumpReq2 = randomUUID();
  11 |
  12 |     const payload = {
  13 |       idempotency_key: idempotencyKey,
  14 |       basket: { name: 'Combined Ingest' },
  15 |       dumps: [
  16 |         { dump_request_id: dumpReq1, text_dump: 'First dump' },
  17 |         { dump_request_id: dumpReq2, text_dump: 'Second dump' },
  18 |       ],
  19 |     };
  20 |
  21 |     const res1 = await request.post('/api/baskets/ingest', {
  22 |       headers: { Authorization: `Bearer ${jwt}` },
  23 |       data: payload,
  24 |     });
> 25 |     expect(res1.ok()).toBeTruthy();
     |                       ^ Error: expect(received).toBeTruthy()
  26 |     const data1 = await res1.json();
  27 |     expect(typeof data1.basket_id).toBe('string');
  28 |     expect(data1.dumps).toHaveLength(2);
  29 |
  30 |     const res2 = await request.post('/api/baskets/ingest', {
  31 |       headers: { Authorization: `Bearer ${jwt}` },
  32 |       data: payload,
  33 |     });
  34 |     expect(res2.ok()).toBeTruthy();
  35 |     const data2 = await res2.json();
  36 |     expect(data2.basket_id).toBe(data1.basket_id);
  37 |     expect(data2.dumps.map((d: any) => d.dump_id)).toEqual(
  38 |       data1.dumps.map((d: any) => d.dump_id)
  39 |     );
  40 |   });
  41 | });
  42 |
```