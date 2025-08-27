# Test info

- Name: [CANON] Workspace Isolation >> workspace resolution creates single authoritative workspace
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/canon/workspace-isolation.spec.ts:32:7

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toHaveURL(expected)

Locator: locator(':root')
Expected pattern: /\/baskets\/[a-f0-9-]+\/(memory|timeline)/
Received string:  "http://localhost:3000/"
Call log:
  - expect.toHaveURL with timeout 5000ms
  - waiting for locator(':root')
    8 × locator resolved to <html lang="en" class="__variable_e8ce0c __variable_5899e0 __variable_5f64cf">…</html>
      - unexpected value "http://localhost:3000/"

    at /Users/macbook/rightnow-agent-app-fullstack/tests/canon/workspace-isolation.spec.ts:37:24
```

# Page snapshot

```yaml
- alert
- img "Background Paths"
- img "Background Paths"
- link "yarnnn logo":
  - /url: /
  - img "yarnnn logo"
- navigation:
  - link "About":
    - /url: /about
  - link "Sign-Up/Login":
    - /url: /login
- heading "yarnnn" [level=1]
- paragraph: Finally organize your AI chaos. Build a memory system that evolves with your ideas.
- paragraph: You’ve got raw ideas, AI chats, and half-finished docs everywhere. yarnnn helps you turn that chaos into something alive — evolving plans, reusable strategy, and meaningful memory.
- link "try yarnnn - it remembers for you":
  - /url: /login
- contentinfo:
  - text: yarnnn
  - link "Privacy":
    - /url: /privacy
  - link "Terms":
    - /url: /terms
  - text: Office Donggyo-Ro 272-8 3F, Seoul, Korea Contact contactus@yarnnn.com
- text: "intervals: 0"
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
   21 |     expect([403, 404]).toContain(basketResponse.status());
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
>  37 |     await expect(page).toHaveURL(/\/baskets\/[a-f0-9-]+\/(memory|timeline)/);
      |                        ^ Error: Timed out 5000ms waiting for expect(locator).toHaveURL(expected)
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
  122 |     if (docResponse.ok()) {
  123 |       const doc = await docResponse.json();
  124 |       // Document workspace is inherited from basket
  125 |       const basketResponse = await request.get(`/api/baskets/${testBasketId}`);
  126 |       const basket = await basketResponse.json();
  127 |       expect(basket.workspace_id).toBe(testWorkspaceId);
  128 |     }
  129 |   });
  130 |
  131 |   test('user cannot manipulate workspace_id in requests', async ({ request }) => {
  132 |     // Attempt to create resource with different workspace_id
  133 |     const maliciousResponse = await request.post('/api/dumps/new', {
  134 |       data: {
  135 |         basket_id: testBasketId,
  136 |         workspace_id: '99999999-9999-9999-9999-999999999999', // Different workspace
  137 |         text_dump: 'Malicious request'
```