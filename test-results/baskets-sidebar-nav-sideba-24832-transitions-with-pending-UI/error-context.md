# Test info

- Name: sidebar navigation uses soft transitions with pending UI
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/baskets/sidebar-nav.spec.ts:3:5

# Error details

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[aria-busy="true"]')

    at /Users/macbook/rightnow-agent-app-fullstack/tests/baskets/sidebar-nav.spec.ts:14:12
```

# Page snapshot

```yaml
- alert
- text: Something went wrong.
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test('sidebar navigation uses soft transitions with pending UI', async ({ page }) => {
   4 |   await page.goto('/baskets/work/memory');
   5 |
   6 |   const targets = [
   7 |     { name: 'Timeline', path: '/baskets/work/timeline' },
   8 |     { name: 'Reflections', path: '/baskets/work/reflections' },
   9 |     { name: 'Memory', path: '/baskets/work/memory' },
  10 |   ];
  11 |
  12 |   for (const { name, path } of targets) {
  13 |     await Promise.all([
> 14 |       page.waitForSelector('[aria-busy="true"]', { state: 'attached' }),
     |            ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  15 |       page.getByRole('link', { name }).click(),
  16 |     ]);
  17 |     await expect(page).toHaveURL(path);
  18 |     const navType = await page.evaluate(() => performance.getEntriesByType('navigation').at(-1)?.type);
  19 |     expect(navType).not.toBe('reload');
  20 |   }
  21 | });
  22 |
```