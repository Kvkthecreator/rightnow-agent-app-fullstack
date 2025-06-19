import { test, expect } from "@playwright/test";

// simple guardrail test: paste over 100 lines and expect warning toast

test("shows warning toast on large dump", async ({ page }) => {
  await page.goto("/baskets/new");
  await page.fill("textarea", Array(101).fill("line").join("\n"));
  await page.getByRole("button", { name: /Save to Basket/i }).click();
  // Wait for toast with warning text
  await expect(page.getByText(/Large dump detected/i)).toBeVisible();
});
