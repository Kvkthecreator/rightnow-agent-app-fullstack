# Test info

- Name: Document Substrate Composition E2E >> verifies seeded substrate composition data
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/e2e/document_substrate_composition.spec.ts:17:7

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toContainText(expected)

Locator: locator('h1')
Expected string: "E2E Test Document - Multi-Substrate"
Received: <element(s) not found>
Call log:
  - expect.toContainText with timeout 5000ms
  - waiting for locator('h1')

    at /Users/macbook/rightnow-agent-app-fullstack/tests/e2e/document_substrate_composition.spec.ts:22:38
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
   3 | // E2E Test: Document Composition with Multi-Substrate Canon
   4 | // Tests the full workflow: create doc → attach multi-substrate → timeline events
   5 |
   6 | // Use seeded test data from seed-test-basket.js
   7 | const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
   8 | const documentId = '11111111-1111-1111-1111-111111111111';  // Seeded document
   9 | const blockId = '33333333-3333-3333-3333-333333333333';     // Seeded block
   10 | const dumpId = '55555555-5555-5555-5555-555555555555';      // Seeded dump
   11 | const contextItemId = '66666666-6666-6666-6666-666666666666'; // Seeded context item
   12 |
   13 | test.skip(!basketId, 'requires TEST_BASKET_ID to run');
   14 |
   15 | test.describe('Document Substrate Composition E2E', () => {
   16 |
   17 |   test('verifies seeded substrate composition data', async ({ page }) => {
   18 |     // Navigate directly to the seeded test document
   19 |     await page.goto(`/baskets/${basketId}/documents/${documentId}`);
   20 |
   21 |     // Verify we're on the correct document
>  22 |     await expect(page.locator('h1')).toContainText('E2E Test Document - Multi-Substrate');
      |                                      ^ Error: Timed out 5000ms waiting for expect(locator).toContainText(expected)
   23 |
   24 |     // Verify composition overview is visible
   25 |     await expect(page.locator('text=Composition Overview')).toBeVisible();
   26 |     
   27 |     // Should have seeded substrate references (block + dump from seeding script)
   28 |     await expect(page.locator('.substrate-reference-card')).toHaveCount(2);
   29 |     
   30 |     // Verify substrate types are displayed correctly
   31 |     await expect(page.locator('.substrate-badge:has-text("block")')).toBeVisible();
   32 |     await expect(page.locator('.substrate-badge:has-text("dump")')).toBeVisible();
   33 |
   34 |     // Verify composition stats show correct counts
   35 |     const blockStats = page.locator('[data-testid="composition-stats"] .blocks-count, .composition-stats .blocks-count').first();
   36 |     await expect(blockStats).toContainText('1');
   37 |     
   38 |     const dumpStats = page.locator('[data-testid="composition-stats"] .dumps-count, .composition-stats .dumps-count').first();
   39 |     await expect(dumpStats).toContainText('1');
   40 |
   41 |     // Test substrate filtering functionality
   42 |     const filterSelect = page.locator('select:has(option:has-text("All Types")), select:has(option:has-text("block"))').first();
   43 |     if (await filterSelect.isVisible()) {
   44 |       await filterSelect.selectOption('block');
   45 |       await expect(page.locator('.substrate-badge:has-text("block")')).toBeVisible();
   46 |       
   47 |       await filterSelect.selectOption('dump'); 
   48 |       await expect(page.locator('.substrate-badge:has-text("dump")')).toBeVisible();
   49 |       
   50 |       await filterSelect.selectOption('all');
   51 |       await expect(page.locator('.substrate-reference-card')).toHaveCount(2);
   52 |     }
   53 |   });
   54 |
   55 |   test('verifies timeline events for substrate operations', async ({ page }) => {
   56 |     // Navigate to timeline to check seeded events
   57 |     await page.goto(`/baskets/${basketId}/timeline`);
   58 |     
   59 |     // Should have timeline events from seeding
   60 |     await expect(page.locator('.timeline-event, [data-testid="timeline-event"]').first()).toBeVisible();
   61 |     
   62 |     // Check for document creation event
   63 |     const documentEvent = page.locator('text=document.created, text=Created test document').first();
   64 |     if (await documentEvent.isVisible()) {
   65 |       await expect(documentEvent).toBeVisible();
   66 |     }
   67 |
   68 |     // Check for substrate attachment event  
   69 |     const attachEvent = page.locator('text=document.block.attached, text=Attached block').first();
   70 |     if (await attachEvent.isVisible()) {
   71 |       await expect(attachEvent).toBeVisible();
   72 |     }
   73 |   });
   74 |
   75 |   test('substrate canon compliance verification', async ({ page }) => {
   76 |     // This test verifies that the implementation follows substrate canon principles
   77 |     
   78 |     await page.goto(`/baskets/${basketId}/documents/${documentId}`);
   79 |
   80 |     // 1. All substrate types should be available for attachment
   81 |     await page.click('button:has-text("Add Reference")');
   82 |     const substrateTypeOptions = await page.locator('select[data-testid="substrate-type"] option').allTextContents();
   83 |     expect(substrateTypeOptions).toContain('block');
   84 |     expect(substrateTypeOptions).toContain('dump');
   85 |     expect(substrateTypeOptions).toContain('context_item');
   86 |     expect(substrateTypeOptions).toContain('reflection');
   87 |     expect(substrateTypeOptions).toContain('timeline_event');
   88 |
   89 |     await page.keyboard.press('Escape'); // Close modal
   90 |
   91 |     // 2. Substrate references should use consistent data structure
   92 |     const references = page.locator('.substrate-reference-card');
   93 |     const referenceData = await references.evaluateAll(cards =>
   94 |       cards.map(card => ({
   95 |         hasId: !!card.getAttribute('data-reference-id'),
   96 |         hasSubstrateType: !!card.querySelector('.substrate-badge'),
   97 |         hasSubstrateId: !!card.getAttribute('data-substrate-id'),
   98 |         hasCreatedAt: !!card.querySelector('[data-testid="timestamp"]'),
   99 |       }))
  100 |     );
  101 |
  102 |     referenceData.forEach(ref => {
  103 |       expect(ref.hasId).toBe(true);
  104 |       expect(ref.hasSubstrateType).toBe(true);
  105 |       expect(ref.hasSubstrateId).toBe(true);
  106 |       expect(ref.hasCreatedAt).toBe(true);
  107 |     });
  108 |
  109 |     // 3. Composition stats should treat all substrates equally
  110 |     const stats = await page.locator('[data-testid="composition-stats"]').textContent();
  111 |     expect(stats).toMatch(/\d+ Blocks/);
  112 |     expect(stats).toMatch(/\d+ Dumps/);
  113 |     expect(stats).toMatch(/\d+ Context Items/);
  114 |     expect(stats).toMatch(/\d+ Reflections/);
  115 |     expect(stats).toMatch(/\d+ Timeline Events/);
  116 |   });
  117 |
  118 |   test('error handling and edge cases', async ({ page }) => {
  119 |     await page.goto(`/baskets/${basketId}/documents/${documentId}`);
  120 |
  121 |     // Test duplicate substrate attachment prevention
  122 |     await page.click('button:has-text("Add Reference")');
```