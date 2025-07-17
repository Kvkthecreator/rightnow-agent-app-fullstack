import { test, expect } from "@playwright/test";

// This test relies on `storageState.json` which holds a logged-in session.
// It verifies that the login page immediately redirects the authenticated
// user to the dashboard.
test("redirects logged-in user to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.waitForURL("**/work?tab=dashboard");
    await expect(page.locator("text=Design System Preview")).toBeVisible();
});
