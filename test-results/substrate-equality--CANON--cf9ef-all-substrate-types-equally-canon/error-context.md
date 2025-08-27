# Test info

- Name: [CANON] Substrate Equality >> composition stats treat all substrate types equally
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/canon/substrate-equality.spec.ts:51:7

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toContainText(expected)

Locator: locator('[data-testid="composition-stats"]')
Expected pattern: /\d+ Blocks/
Received: <element(s) not found>
Call log:
  - expect.toContainText with timeout 5000ms
  - waiting for locator('[data-testid="composition-stats"]')

    at /Users/macbook/rightnow-agent-app-fullstack/tests/canon/substrate-equality.spec.ts:55:34
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
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | /**
   4 |  * [CANON] Substrate Equality Tests
   5 |  * 
   6 |  * Validates that all five substrate types (raw_dumps, context_blocks, context_items, 
   7 |  * reflections, timeline_events) are treated as peers with no hierarchy.
   8 |  */
   9 |
   10 | test.describe('[CANON] Substrate Equality', () => {
   11 |   const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
   12 |   const documentId = '11111111-1111-1111-1111-111111111111';
   13 |
   14 |   test.beforeEach(async ({ page }) => {
   15 |     await page.goto(`/baskets/${basketId}/documents/${documentId}`);
   16 |   });
   17 |
   18 |   test('all substrate types are treated as peers in document composition', async ({ page }) => {
   19 |     // Verify all substrate types can be attached
   20 |     await page.click('button:has-text("Add Reference")');
   21 |     
   22 |     const substrateTypeSelect = page.locator('select[data-testid="substrate-type"]');
   23 |     const options = await substrateTypeSelect.locator('option').allTextContents();
   24 |     
   25 |     // All five canonical substrate types must be available
   26 |     expect(options).toContain('block');
   27 |     expect(options).toContain('dump');
   28 |     expect(options).toContain('context_item');
   29 |     expect(options).toContain('reflection');
   30 |     expect(options).toContain('timeline_event');
   31 |     
   32 |     await page.keyboard.press('Escape');
   33 |   });
   34 |
   35 |   test('no substrate type has privileged access or special UI treatment', async ({ page }) => {
   36 |     // Verify substrate references have consistent structure
   37 |     const references = await page.locator('.substrate-reference-card').all();
   38 |     
   39 |     for (const ref of references) {
   40 |       // All substrates should have the same UI structure
   41 |       await expect(ref.locator('.substrate-badge')).toBeVisible();
   42 |       await expect(ref.locator('[data-testid="timestamp"]')).toBeVisible();
   43 |       await expect(ref.locator('button[title="Detach"]')).toBeVisible();
   44 |       
   45 |       // No special styling based on substrate type
   46 |       const classes = await ref.getAttribute('class');
   47 |       expect(classes).toContain('substrate-peer-reference');
   48 |     }
   49 |   });
   50 |
   51 |   test('composition stats treat all substrate types equally', async ({ page }) => {
   52 |     const statsContainer = page.locator('[data-testid="composition-stats"]');
   53 |     
   54 |     // All substrate types should have equal representation in stats
>  55 |     await expect(statsContainer).toContainText(/\d+ Blocks/);
      |                                  ^ Error: Timed out 5000ms waiting for expect(locator).toContainText(expected)
   56 |     await expect(statsContainer).toContainText(/\d+ Dumps/);
   57 |     await expect(statsContainer).toContainText(/\d+ Context Items/);
   58 |     await expect(statsContainer).toContainText(/\d+ Reflections/);
   59 |     await expect(statsContainer).toContainText(/\d+ Timeline Events/);
   60 |     
   61 |     // Verify no substrate type is highlighted or given prominence
   62 |     const statElements = await statsContainer.locator('[data-substrate-stat]').all();
   63 |     const fontSizes = await Promise.all(
   64 |       statElements.map(el => el.evaluate(node => window.getComputedStyle(node).fontSize))
   65 |     );
   66 |     
   67 |     // All stats should have the same font size
   68 |     expect(new Set(fontSizes).size).toBe(1);
   69 |   });
   70 |
   71 |   test('substrate filtering works uniformly across all types', async ({ page }) => {
   72 |     const filterSelect = page.locator('select:has(option:has-text("All Types"))').first();
   73 |     
   74 |     if (await filterSelect.isVisible()) {
   75 |       const substrateTypes = ['block', 'dump', 'context_item', 'reflection', 'timeline_event'];
   76 |       
   77 |       for (const type of substrateTypes) {
   78 |         await filterSelect.selectOption(type);
   79 |         
   80 |         // Filter should work identically for all substrate types
   81 |         const visibleCards = await page.locator('.substrate-reference-card:visible').count();
   82 |         const typeCount = await page.locator(`.substrate-badge:has-text("${type}")`).count();
   83 |         
   84 |         if (typeCount > 0) {
   85 |           expect(visibleCards).toBe(typeCount);
   86 |         }
   87 |       }
   88 |     }
   89 |   });
   90 |
   91 |   test('API treats all substrate types uniformly', async ({ page, request }) => {
   92 |     // Test attachment endpoint accepts all substrate types
   93 |     const substrateTypes = [
   94 |       { type: 'block', id: '33333333-3333-3333-3333-333333333333' },
   95 |       { type: 'dump', id: '55555555-5555-5555-5555-555555555555' },
   96 |       { type: 'context_item', id: '66666666-6666-6666-6666-666666666666' },
   97 |       { type: 'reflection', id: '77777777-7777-7777-7777-777777777777' },
   98 |       { type: 'timeline_event', id: '88888888-8888-8888-8888-888888888888' }
   99 |     ];
  100 |
  101 |     for (const substrate of substrateTypes) {
  102 |       const response = await request.post(`/api/documents/${documentId}/references`, {
  103 |         data: {
  104 |           substrate_type: substrate.type,
  105 |           substrate_id: substrate.id,
  106 |           role: 'test',
  107 |           weight: 0.5
  108 |         }
  109 |       });
  110 |
  111 |       // All substrate types should be accepted equally
  112 |       expect([200, 201, 409]).toContain(response.status()); // 409 if already attached
  113 |     }
  114 |   });
  115 | });
```