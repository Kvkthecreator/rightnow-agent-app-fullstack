# Test info

- Name: create basket via new page
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/baskets/create_basket.spec.ts:3:5

# Error details

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByPlaceholder('Drop your thoughts here...')

    at /Users/macbook/rightnow-agent-app-fullstack/tests/baskets/create_basket.spec.ts:5:61
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
   3 | test('create basket via new page', async ({ page }) => {
   4 |   await page.goto('/baskets/new');
>  5 |   await page.getByPlaceholder('Drop your thoughts here...').fill('hello world');
     |                                                             ^ Error: locator.fill: Test timeout of 30000ms exceeded.
   6 |   await page.getByRole('button', { name: 'Create' }).click();
   7 |   await page.waitForURL('**/baskets/*/work');
   8 |   await expect(page).toHaveURL(/\/baskets\/[^/]+\/work/);
   9 | });
  10 |
```