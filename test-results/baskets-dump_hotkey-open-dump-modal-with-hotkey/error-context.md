# Test info

- Name: open dump modal with hotkey
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/baskets/dump_hotkey.spec.ts:6:5

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: getByRole('dialog')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for getByRole('dialog')

    at /Users/macbook/rightnow-agent-app-fullstack/tests/baskets/dump_hotkey.spec.ts:10:42
```

# Page snapshot

```yaml
- alert
- banner:
  - button "Toggle sidebar":
    - text: Toggle navigation
    - img
  - text: work
- main:
  - heading "Page Not Found" [level=1]
  - paragraph: Sorry, we couldn\'t find that.
  - link "Go back to Baskets":
    - /url: /baskets
- text: "intervals: 0"
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | // assumes logged in via storageState
   4 | test.use({ storageState: 'storageState.json' });
   5 |
   6 | test('open dump modal with hotkey', async ({ page }) => {
   7 |   const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
   8 |   await page.goto('/baskets/1/work');
   9 |   await page.keyboard.press(`${modifier}+Shift+V`);
> 10 |   await expect(page.getByRole('dialog')).toBeVisible();
     |                                          ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  11 |   await page.getByPlaceholder('Drop it').fill('hotkey text');
  12 |   await page.getByRole('button', { name: /save to basket/i }).click();
  13 |   await expect(page.locator('text=Dump added')).toBeVisible();
  14 | });
  15 |
```