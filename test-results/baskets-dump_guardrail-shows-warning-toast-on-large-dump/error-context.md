# Test info

- Name: shows warning toast on large dump
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/baskets/dump_guardrail.spec.ts:5:5

# Error details

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('textarea')

    at /Users/macbook/rightnow-agent-app-fullstack/tests/baskets/dump_guardrail.spec.ts:7:14
```

# Page snapshot

```yaml
- alert
- text: Something went wrong.
```

# Test source

```ts
   1 | import { test, expect } from "@playwright/test";
   2 |
   3 | // simple guardrail test: paste over 100 lines and expect warning toast
   4 |
   5 | test("shows warning toast on large dump", async ({ page }) => {
   6 |   await page.goto("/baskets/new");
>  7 |   await page.fill("textarea", Array(101).fill("line").join("\n"));
     |              ^ Error: page.fill: Test timeout of 30000ms exceeded.
   8 |   await page.getByRole("button", { name: /Save to Basket/i }).click();
   9 |   // Wait for toast with warning text
  10 |   await expect(page.getByText(/Large dump detected/i)).toBeVisible();
  11 | });
  12 |
```