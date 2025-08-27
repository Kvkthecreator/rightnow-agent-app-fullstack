# Test info

- Name: [CANON] Workspace Isolation >> RLS policies prevent cross-workspace data access
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/canon/workspace-isolation.spec.ts:14:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 401
Received array: [403, 404]
    at /Users/macbook/rightnow-agent-app-fullstack/tests/canon/workspace-isolation.spec.ts:21:24
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | /**
   4 |  * [CANON] Workspace Isolation Tests
   5 |  * 
   6 |  * Validates that workspace-scoped security is enforced via RLS policies
   7 |  * and that users can only access data within their workspace.
   8 |  */
   9 |
   10 | test.describe('[CANON] Workspace Isolation', () => {
   11 |   const testWorkspaceId = '00000000-0000-0000-0000-000000000002';
   12 |   const testBasketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
   13 |
   14 |   test('RLS policies prevent cross-workspace data access', async ({ request }) => {
   15 |     // These tests assume we have test data in multiple workspaces
   16 |     
   17 |     // Attempt to access basket from different workspace should fail
   18 |     const otherWorkspaceBasket = '99999999-9999-9999-9999-999999999999';
   19 |     
   20 |     const basketResponse = await request.get(`/api/baskets/${otherWorkspaceBasket}`);
>  21 |     expect([403, 404]).toContain(basketResponse.status());
      |                        ^ Error: expect(received).toContain(expected) // indexOf
   22 |     
   23 |     // Attempt to access dumps from different workspace
   24 |     const dumpResponse = await request.get(`/api/baskets/${otherWorkspaceBasket}/dumps`);
   25 |     expect([403, 404]).toContain(dumpResponse.status());
   26 |     
   27 |     // Attempt to access blocks from different workspace
   28 |     const blockResponse = await request.get(`/api/baskets/${otherWorkspaceBasket}/blocks`);
   29 |     expect([403, 404]).toContain(blockResponse.status());
   30 |   });
   31 |
   32 |   test('workspace resolution creates single authoritative workspace', async ({ page, request }) => {
   33 |     // Navigate to home - should resolve to user's workspace
   34 |     await page.goto('/');
   35 |     
   36 |     // Should be redirected to a basket within user's workspace
   37 |     await expect(page).toHaveURL(/\/baskets\/[a-f0-9-]+\/(memory|timeline)/);
   38 |     
   39 |     const url = page.url();
   40 |     const basketMatch = url.match(/\/baskets\/([a-f0-9-]+)\//);
   41 |     
   42 |     if (basketMatch) {
   43 |       const basketId = basketMatch[1];
   44 |       
   45 |       // Verify this basket belongs to test workspace
   46 |       const basketResponse = await request.get(`/api/baskets/${basketId}`);
   47 |       expect(basketResponse.ok()).toBeTruthy();
   48 |       
   49 |       const basket = await basketResponse.json();
   50 |       expect(basket.workspace_id).toBe(testWorkspaceId);
   51 |     }
   52 |   });
   53 |
   54 |   test('all workspace-scoped tables enforce RLS', async ({ request }) => {
   55 |     // Test key workspace-scoped tables
   56 |     const tables = [
   57 |       { endpoint: `/api/baskets/${testBasketId}`, resource: 'basket' },
   58 |       { endpoint: `/api/baskets/${testBasketId}/dumps`, resource: 'dumps' },
   59 |       { endpoint: `/api/baskets/${testBasketId}/blocks`, resource: 'blocks' },
   60 |       { endpoint: `/api/baskets/${testBasketId}/documents`, resource: 'documents' },
   61 |       { endpoint: `/api/baskets/${testBasketId}/timeline`, resource: 'timeline' }
   62 |     ];
   63 |
   64 |     for (const table of tables) {
   65 |       const response = await request.get(table.endpoint);
   66 |       expect(response.ok()).toBeTruthy();
   67 |       
   68 |       if (response.ok()) {
   69 |         const data = await response.json();
   70 |         
   71 |         // All returned data should belong to test workspace
   72 |         if (Array.isArray(data)) {
   73 |           for (const item of data) {
   74 |             if (item.workspace_id) {
   75 |               expect(item.workspace_id).toBe(testWorkspaceId);
   76 |             }
   77 |           }
   78 |         } else if (data.workspace_id) {
   79 |           expect(data.workspace_id).toBe(testWorkspaceId);
   80 |         }
   81 |       }
   82 |     }
   83 |   });
   84 |
   85 |   test('create operations respect workspace scoping', async ({ request }) => {
   86 |     // Create new resources - should automatically be scoped to user's workspace
   87 |     
   88 |     // Create dump
   89 |     const dumpResponse = await request.post('/api/dumps/new', {
   90 |       data: {
   91 |         basket_id: testBasketId,
   92 |         text_dump: 'Workspace isolation test'
   93 |       }
   94 |     });
   95 |     
   96 |     if (dumpResponse.ok()) {
   97 |       const dump = await dumpResponse.json();
   98 |       expect(dump.workspace_id).toBe(testWorkspaceId);
   99 |     }
  100 |
  101 |     // Create block
  102 |     const blockResponse = await request.post('/api/blocks', {
  103 |       data: {
  104 |         basket_id: testBasketId,
  105 |         title: 'Test Block',
  106 |         content: 'Workspace test content'
  107 |       }
  108 |     });
  109 |     
  110 |     if (blockResponse.ok()) {
  111 |       const block = await blockResponse.json();
  112 |       expect(block.workspace_id).toBe(testWorkspaceId);
  113 |     }
  114 |
  115 |     // Create document
  116 |     const docResponse = await request.post(`/api/baskets/${testBasketId}/documents`, {
  117 |       data: {
  118 |         title: 'Test Document'
  119 |       }
  120 |     });
  121 |     
```