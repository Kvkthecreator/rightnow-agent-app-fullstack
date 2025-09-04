# Test info

- Name: Dumps API Contracts >> GET /api/dumps/[id] - retrieve dump
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/api-contracts/dumps.spec.ts:45:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
    at /Users/macbook/rightnow-agent-app-fullstack/tests/api-contracts/dumps.spec.ts:63:30
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | /**
   4 |  * [API CONTRACTS] Dumps API Tests
   5 |  * 
   6 |  * Tests HTTP API contracts for dumps endpoints.
   7 |  * These are separate from canon compliance tests - focused purely on API correctness.
   8 |  */
   9 |
  10 | test.describe('Dumps API Contracts', () => {
  11 |   const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
  12 |
  13 |   test('POST /api/dumps/new - successful dump creation', async ({ request }) => {
  14 |     const dumpData = {
  15 |       basket_id: basketId,
  16 |       text_dump: 'API contract test dump',
  17 |       dump_request_id: crypto.randomUUID()
  18 |     };
  19 |
  20 |     const response = await request.post('/api/dumps/new', { 
  21 |       data: dumpData,
  22 |       headers: { 'x-playwright-test': 'true' }
  23 |     });
  24 |
  25 |     expect(response.ok()).toBeTruthy();
  26 |     const result = await response.json();
  27 |
  28 |     // API contract validation
  29 |     expect(result).toHaveProperty('dump_id');
  30 |     expect(result.dump_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  31 |   });
  32 |
  33 |   test('POST /api/dumps/new - validation errors', async ({ request }) => {
  34 |     // Missing required fields
  35 |     const response = await request.post('/api/dumps/new', { 
  36 |       data: {},
  37 |       headers: { 'x-playwright-test': 'true' }
  38 |     });
  39 |
  40 |     expect(response.status()).toBe(422);
  41 |     const error = await response.json();
  42 |     expect(error).toHaveProperty('error');
  43 |   });
  44 |
  45 |   test('GET /api/dumps/[id] - retrieve dump', async ({ request }) => {
  46 |     // Create dump first
  47 |     const createResponse = await request.post('/api/dumps/new', { 
  48 |       data: {
  49 |         basket_id: basketId,
  50 |         text_dump: 'API retrieval test',
  51 |         dump_request_id: crypto.randomUUID()
  52 |       },
  53 |       headers: { 'x-playwright-test': 'true' }
  54 |     });
  55 |
  56 |     const created = await createResponse.json();
  57 |     
  58 |     // Retrieve dump
  59 |     const getResponse = await request.get(`/api/dumps/${created.dump_id}`, {
  60 |       headers: { 'x-playwright-test': 'true' }
  61 |     });
  62 |
> 63 |     expect(getResponse.ok()).toBeTruthy();
     |                              ^ Error: expect(received).toBeTruthy()
  64 |     const dump = await getResponse.json();
  65 |     
  66 |     expect(dump.id).toBe(created.dump_id);
  67 |     expect(dump.body_md).toBe('API retrieval test');
  68 |   });
  69 |
  70 |   test('GET /api/dumps/[id] - not found', async ({ request }) => {
  71 |     const fakeId = '00000000-0000-0000-0000-000000000000';
  72 |     
  73 |     const response = await request.get(`/api/dumps/${fakeId}`, {
  74 |       headers: { 'x-playwright-test': 'true' }
  75 |     });
  76 |
  77 |     expect(response.status()).toBe(404);
  78 |   });
  79 | });
```