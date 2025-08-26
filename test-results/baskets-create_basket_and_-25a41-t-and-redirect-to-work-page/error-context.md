# Test info

- Name: Basket Creation Flow >> should create a basket and redirect to work page
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/baskets/create_basket_and_blocks.spec.ts:7:7

# Error details

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByPlaceholder('Drop it')

    at /Users/macbook/rightnow-agent-app-fullstack/tests/baskets/create_basket_and_blocks.spec.ts:12:44
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
   2 | import * as fs from 'fs';
   3 |
   4 | test.describe('Basket Creation Flow', () => {
   5 |   test.use({ storageState: 'storageState.json' }); // assumes you're logged in with this session
   6 |
   7 |   test('should create a basket and redirect to work page', async ({ page }) => {
   8 |     // Open the local basket creation page
   9 |     await page.goto('http://localhost:3000/baskets/new');
  10 |
  11 |     // Fill in raw text dump
> 12 |     await page.getByPlaceholder('Drop it').fill(
     |                                            ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  13 |       `Slide 1 – Dump, Memory, Brief\n\nPaste GPT replies here to structure them later.`
  14 |     );
  15 |
  16 |     // Optional: pause browser to debug manually
  17 |     // await page.pause();
  18 |
  19 |     // Submit the basket creation form
  20 |     await page.getByRole('button', { name: 'Save to Basket' }).click();
  21 |
  22 |     // Wait for redirect to /baskets/[id]/work
  23 |     await page.waitForURL('**/baskets/*/work', { timeout: 5000 });
  24 |
  25 |     // Confirm the new basket work page is visible
  26 |     await expect(
  27 |       page.getByRole('heading', { name: /Blocks/i })
  28 |     ).toBeVisible();
  29 |   });
  30 | });
  31 |
```