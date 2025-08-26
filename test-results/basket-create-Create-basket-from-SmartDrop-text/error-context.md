# Test info

- Name: Create basket from SmartDrop text
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/basket-create.spec.ts:3:5

# Error details

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByPlaceholder('Drop it')

    at /Users/macbook/rightnow-agent-app-fullstack/tests/basket-create.spec.ts:6:42
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
   3 | test('Create basket from SmartDrop text', async ({ page }) => {
   4 |   await page.goto('/baskets/new');
   5 |
>  6 |   await page.getByPlaceholder('Drop it').fill('Run a 7-day launch');
     |                                          ^ Error: locator.fill: Test timeout of 30000ms exceeded.
   7 |   await page.keyboard.press('Meta+Enter');
   8 |
   9 |   await page.waitForURL('**/work');
  10 |   await expect(page.url()).toContain('/work');
  11 | });
  12 |
```