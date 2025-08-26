# Test info

- Name: basic promote and highlight flow
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/baskets/highlight_flow.spec.ts:5:5

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('span[title*="possible_redundancy"]')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('span[title*="possible_redundancy"]')

    at /Users/macbook/rightnow-agent-app-fullstack/tests/baskets/highlight_flow.spec.ts:56:7
```

# Page snapshot

```yaml
- alert
- complementary:
  - button "yarnnn"
  - button "Toggle sidebar":
    - img
  - text: 🧺 Basket
  - paragraph: Loading...
  - paragraph: Not signed in
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
   1 | import { test, expect } from "@playwright/test";
   2 |
   3 | test.use({ storageState: "storageState.json" });
   4 |
   5 | test("basic promote and highlight flow", async ({ page }) => {
   6 |     await page.route("**/api/baskets/1/inputs", async (route) => {
   7 |         await route.fulfill({
   8 |             status: 200,
   9 |             contentType: "application/json",
  10 |             body: JSON.stringify([
  11 |                 { id: "in1", content: "# Hello world", created_at: "" },
  12 |             ]),
  13 |         });
  14 |     });
  15 |     await page.route("**/api/baskets/1/blocks", async (route) => {
  16 |         await route.fulfill({
  17 |             status: 200,
  18 |             contentType: "application/json",
  19 |             body: JSON.stringify([
  20 |                 {
  21 |                     id: "b1",
  22 |                     label: "Hello",
  23 |                     type: "note",
  24 |                     updated_at: "",
  25 |                     commit_id: null,
  26 |                 },
  27 |             ]),
  28 |         });
  29 |     });
  30 |     await page.route("**/api/baskets/1/input-highlights", async (route) => {
  31 |         await route.fulfill({
  32 |             status: 200,
  33 |             contentType: "application/json",
  34 |             body: JSON.stringify([
  35 |                 {
  36 |                     dump_input_id: "in1",
  37 |                     conflicting_block_id: "b1",
  38 |                     reason: "possible_redundancy",
  39 |                 },
  40 |             ]),
  41 |         });
  42 |     });
  43 |     await page.route("**/api/context-blocks", async (route) => {
  44 |         await route.fulfill({
  45 |             status: 201,
  46 |             contentType: "application/json",
  47 |             body: "{}",
  48 |         });
  49 |     });
  50 |
  51 |     await page.setViewportSize({ width: 375, height: 667 });
  52 |     await page.goto("/baskets/1/work");
  53 |
  54 |     await expect(
  55 |         page.locator('span[title*="possible_redundancy"]'),
> 56 |     ).toBeVisible();
     |       ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  57 |
  58 |     await page.locator("article").click();
  59 |     await page.getByRole("button", { name: /Promote Selection/i }).click();
  60 |     await expect(page.locator("text=Promoted to block")).toBeVisible();
  61 | });
  62 |
```