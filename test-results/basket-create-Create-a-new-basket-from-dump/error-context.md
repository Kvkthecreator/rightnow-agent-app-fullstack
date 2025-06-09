# Test info

- Name: Create a new basket from dump
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/basket-create.spec.ts:3:5

# Error details

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('textarea[placeholder="What’s the idea or intent?"]')

    at /Users/macbook/rightnow-agent-app-fullstack/tests/basket-create.spec.ts:6:14
```

# Page snapshot

```yaml
- complementary:
  - link "yarnnn logo":
    - /url: /
    - img "yarnnn logo"
  - navigation:
    - link "🧶 Dashboard":
      - /url: /dashboard
    - link "🧺 Baskets":
      - /url: /baskets
    - link "➕ New Basket":
      - /url: /baskets/create
    - link "◾ Blocks":
      - /url: /blocks
  - group: seulkim88@gmail.com
- main:
  - paragraph: Loading…
- alert
- button "Open Next.js Dev Tools":
  - img
- button "Open issues overlay": 2 Issue
- button "Collapse issues badge":
  - img
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test('Create a new basket from dump', async ({ page }) => {
   4 |   await page.goto('/baskets/new');
   5 |
>  6 |   await page.fill('textarea[placeholder="What’s the idea or intent?"]', 'Run a playful Gen Z TikTok challenge');
     |              ^ Error: page.fill: Test timeout of 30000ms exceeded.
   7 |   await page.fill('textarea[placeholder="Add extra insights…"]', 'Lean into visual humor and cultural slang');
   8 |
   9 |   await page.click('button:has-text("Create")');
  10 |   await page.waitForURL('**/baskets/**');
  11 |
  12 |   const heading = await page.locator('h1');
  13 |   await expect(heading).toContainText('Run a playful Gen Z TikTok challenge');
  14 | });
  15 |
```