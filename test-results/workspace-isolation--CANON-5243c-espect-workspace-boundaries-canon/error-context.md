# Test info

- Name: [CANON] Workspace Isolation >> search and filtering respect workspace boundaries
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/canon/workspace-isolation.spec.ts:148:7

# Error details

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[placeholder*="search" i]')

    at /Users/macbook/rightnow-agent-app-fullstack/tests/canon/workspace-isolation.spec.ts:152:16
```

# Page snapshot

```yaml
- alert
- text: Something went wrong.
- img
- text: 1 error
- button "Hide Errors":
  - img
```

# Test source

```ts
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
  138 |       }
  139 |     });
  140 |     
  141 |     if (maliciousResponse.ok()) {
  142 |       const result = await maliciousResponse.json();
  143 |       // Should ignore provided workspace_id and use authenticated user's workspace
  144 |       expect(result.workspace_id).toBe(testWorkspaceId);
  145 |     }
  146 |   });
  147 |
  148 |   test('search and filtering respect workspace boundaries', async ({ page }) => {
  149 |     await page.goto(`/baskets/${testBasketId}/memory`);
  150 |     
  151 |     // Search should only return results from current workspace
> 152 |     await page.fill('input[placeholder*="search" i]', 'test');
      |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  153 |     await page.keyboard.press('Enter');
  154 |     
  155 |     // Wait for search results
  156 |     await page.waitForTimeout(1000);
  157 |     
  158 |     // All visible results should be from current workspace
  159 |     const resultCards = await page.locator('[data-testid="search-result"], .search-result-card').all();
  160 |     
  161 |     for (const card of resultCards) {
  162 |       // Verify no cross-workspace leakage in results
  163 |       const dataAttributes = await card.evaluate(el => ({
  164 |         workspaceId: el.getAttribute('data-workspace-id'),
  165 |         basketId: el.getAttribute('data-basket-id')
  166 |       }));
  167 |       
  168 |       if (dataAttributes.workspaceId) {
  169 |         expect(dataAttributes.workspaceId).toBe(testWorkspaceId);
  170 |       }
  171 |     }
  172 |   });
  173 |
  174 |   test('timeline events are workspace-scoped', async ({ page, request }) => {
  175 |     await page.goto(`/baskets/${testBasketId}/timeline`);
  176 |     
  177 |     // Timeline should only show events from current workspace
  178 |     const timelineResponse = await request.get(`/api/baskets/${testBasketId}/timeline`);
  179 |     
  180 |     if (timelineResponse.ok()) {
  181 |       const timeline = await timelineResponse.json();
  182 |       
  183 |       for (const event of timeline.events) {
  184 |         // All events should be associated with current workspace
  185 |         expect(event.workspace_id).toBe(testWorkspaceId);
  186 |       }
  187 |     }
  188 |   });
  189 |
  190 |   test('reflections are workspace-isolated', async ({ page }) => {
  191 |     await page.goto(`/baskets/${testBasketId}/memory`);
  192 |     
  193 |     // Reflections computed from workspace data only
  194 |     const reflectionElements = await page.locator('[data-testid="reflection-item"], .reflection-card').all();
  195 |     
  196 |     for (const reflection of reflectionElements) {
  197 |       // Reflections should not contain data from other workspaces
  198 |       const content = await reflection.textContent();
  199 |       expect(content).not.toContain('Cross-Workspace-Marker');
  200 |     }
  201 |   });
  202 | });
```