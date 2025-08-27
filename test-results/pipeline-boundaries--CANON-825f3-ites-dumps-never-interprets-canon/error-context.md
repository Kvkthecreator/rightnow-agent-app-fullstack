# Test info

- Name: [CANON] Pipeline Boundaries >> P0: Capture pipeline only writes dumps, never interprets
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/canon/pipeline-boundaries.spec.ts:13:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
    at /Users/macbook/rightnow-agent-app-fullstack/tests/canon/pipeline-boundaries.spec.ts:22:27
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | /**
   4 |  * [CANON] Pipeline Boundaries Tests
   5 |  * 
   6 |  * Validates the five pipeline boundaries (P0-P4) and their strict write restrictions
   7 |  * according to YARNNN canon v1.3.1.
   8 |  */
   9 |
   10 | test.describe('[CANON] Pipeline Boundaries', () => {
   11 |   const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
   12 |
   13 |   test('P0: Capture pipeline only writes dumps, never interprets', async ({ page, request }) => {
   14 |     // Test the sacred write path
   15 |     const dumpData = {
   16 |       basket_id: basketId,
   17 |       text_dump: 'Test capture for pipeline validation',
   18 |       source_type: 'test'
   19 |     };
   20 |
   21 |     const response = await request.post('/api/dumps/new', { data: dumpData });
>  22 |     expect(response.ok()).toBeTruthy();
      |                           ^ Error: expect(received).toBeTruthy()
   23 |     
   24 |     const result = await response.json();
   25 |     
   26 |     // P0 should only create dump, no side effects
   27 |     expect(result).toHaveProperty('id');
   28 |     expect(result).not.toHaveProperty('block_id');
   29 |     expect(result).not.toHaveProperty('document_id');
   30 |     expect(result).not.toHaveProperty('relationships');
   31 |     
   32 |     // Verify immutability - dumps cannot be updated
   33 |     const updateResponse = await request.patch(`/api/dumps/${result.id}`, {
   34 |       data: { text_dump: 'Modified content' }
   35 |     });
   36 |     expect(updateResponse.status()).toBe(405); // Method not allowed
   37 |   });
   38 |
   39 |   test('P1: Substrate pipeline creates structured units, no relationships', async ({ request }) => {
   40 |     // Create a block (substrate creation)
   41 |     const blockData = {
   42 |       basket_id: basketId,
   43 |       title: 'Test Block',
   44 |       content: 'Structured content',
   45 |       state: 'PROPOSED'
   46 |     };
   47 |
   48 |     const response = await request.post('/api/blocks', { data: blockData });
   49 |     expect(response.ok()).toBeTruthy();
   50 |     
   51 |     const result = await response.json();
   52 |     
   53 |     // P1 should only create substrate, no graph connections
   54 |     expect(result).toHaveProperty('id');
   55 |     expect(result).toHaveProperty('state');
   56 |     expect(result).not.toHaveProperty('connections');
   57 |     expect(result).not.toHaveProperty('relationships');
   58 |     expect(result).not.toHaveProperty('reflections');
   59 |   });
   60 |
   61 |   test('P2: Graph pipeline connects substrates, never modifies content', async ({ request }) => {
   62 |     const blockId = '33333333-3333-3333-3333-333333333333';
   63 |     const documentId = '11111111-1111-1111-1111-111111111111';
   64 |     
   65 |     // Connect substrate to document (graph operation)
   66 |     const response = await request.post(`/api/documents/${documentId}/references`, {
   67 |       data: {
   68 |         substrate_type: 'block',
   69 |         substrate_id: blockId,
   70 |         role: 'primary'
   71 |       }
   72 |     });
   73 |     
   74 |     expect(response.ok()).toBeTruthy();
   75 |     const result = await response.json();
   76 |     
   77 |     // P2 should only create connection, not modify substrate
   78 |     expect(result.reference).toHaveProperty('substrate_id', blockId);
   79 |     expect(result.reference).toHaveProperty('document_id', documentId);
   80 |     
   81 |     // Verify substrate content wasn't modified
   82 |     const blockResponse = await request.get(`/api/blocks/${blockId}`);
   83 |     const block = await blockResponse.json();
   84 |     expect(block.updated_at).toBe(block.created_at); // No updates
   85 |   });
   86 |
   87 |   test('P3: Reflection pipeline is read-only computation', async ({ page, request }) => {
   88 |     // Navigate to memory view where reflections are computed
   89 |     await page.goto(`/baskets/${basketId}/memory`);
   90 |     
   91 |     // Reflections should be present but read-only
   92 |     await expect(page.locator('[data-testid="reflection-patterns"]')).toBeVisible();
   93 |     
   94 |     // Attempt to directly create a reflection should fail
   95 |     const reflectionData = {
   96 |       basket_id: basketId,
   97 |       type: 'pattern',
   98 |       content: 'Test reflection'
   99 |     };
  100 |     
  101 |     const response = await request.post('/api/reflections', { data: reflectionData });
  102 |     expect([404, 405]).toContain(response.status()); // Endpoint shouldn't exist or allow POST
  103 |   });
  104 |
  105 |   test('P4: Presentation pipeline consumes substrate, never creates it', async ({ page, request }) => {
  106 |     const documentId = '11111111-1111-1111-1111-111111111111';
  107 |     
  108 |     // Documents can reference substrates but not create them
  109 |     await page.goto(`/baskets/${basketId}/documents/${documentId}`);
  110 |     
  111 |     // Verify presentation layer only composes existing substrates
  112 |     const compositionResponse = await request.get(`/api/documents/${documentId}/composition`);
  113 |     const composition = await compositionResponse.json();
  114 |     
  115 |     expect(composition).toHaveProperty('document');
  116 |     expect(composition).toHaveProperty('references');
  117 |     expect(composition.references.length).toBeGreaterThan(0);
  118 |     
  119 |     // Each reference should point to existing substrate
  120 |     for (const ref of composition.references) {
  121 |       expect(ref.substrate).toBeDefined();
  122 |       expect(ref.substrate.created_at).toBeDefined();
```