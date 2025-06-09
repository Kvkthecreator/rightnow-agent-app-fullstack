# Test info

- Name: Basket Creation Flow >> should create a basket and redirect to work page
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/baskets/create_basket_and_blocks.spec.ts:7:7

# Error details

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel('Relevant Links')

    at /Users/macbook/rightnow-agent-app-fullstack/tests/baskets/create_basket_and_blocks.spec.ts:29:45
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
  - main:
    - heading "🧠 Dump your thoughts here" [level=1]
    - paragraph: Paste chats and upload reference files.
    - heading "🧠 Dump your thoughts here" [level=2]
    - paragraph: Paste chats, upload images/docs, or drop links.
    - text: Raw Text Dump
    - textbox "Raw Text Dump": Slide 1 – Dump, Memory, Brief Paste GPT replies here to structure them later.
    - text: Reference Files
    - paragraph: Drag & drop files here or click to upload
    - paragraph: (0/5 files, max 5MB each)
    - paragraph: No files uploaded yet.
    - text: Relevant Links
    - textbox "Paste a link and press Enter"
    - paragraph: No links added yet.
    - button "Create Basket"
- alert
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import * as fs from 'fs';
   3 |
   4 | test.describe('Basket Creation Flow', () => {
   5 |   test.use({ storageState: 'storageState.json' }); // assumes you're already logged in
   6 |
   7 |   test('should create a basket and redirect to work page', async ({ page }) => {
   8 |     // Navigate to the DumpArea creation page
   9 |     await page.goto('https://www.yarnnn.com/baskets/create');
  10 |
  11 |     // Paste a raw dump
  12 |     await page.getByLabel('Raw Text Dump').fill(
  13 |       `Slide 1 – Dump, Memory, Brief\n\nPaste GPT replies here to structure them later.`
  14 |     );
  15 |
  16 |     // Upload a file (replace with any local test file you want to simulate upload)
  17 |     const testFilePath = 'tests/assets/test-image.png';
  18 |     if (!fs.existsSync(testFilePath)) {
  19 |       console.warn(`⚠️ No file found at ${testFilePath}. Skipping upload test.`);
  20 |     } else {
  21 |       const [fileChooser] = await Promise.all([
  22 |         page.waitForEvent('filechooser'),
  23 |         page.getByText('Drag & drop files here or click to upload').click(),
  24 |       ]);
  25 |       await fileChooser.setFiles(testFilePath);
  26 |     }
  27 |
  28 |     // Add a relevant link (optional)
> 29 |     await page.getByLabel('Relevant Links').fill('https://example.com/context');
     |                                             ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  30 |
  31 |     // Click Create
  32 |     await page.getByRole('button', { name: 'Create Basket' }).click();
  33 |
  34 |     // Wait for redirect to /baskets/[id]/work
  35 |     await page.waitForURL('**/baskets/*/work', { timeout: 5000 });
  36 |
  37 |     // Confirm success visually
  38 |     await expect(page.getByText('Work on Basket')).toBeVisible();
  39 |   });
  40 | });
  41 |
```