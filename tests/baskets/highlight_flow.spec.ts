import { test, expect } from "@playwright/test";

test.use({ storageState: "storageState.json" });

test("basic promote and highlight flow", async ({ page }) => {
    await page.route("**/api/baskets/1/inputs", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([
                { id: "in1", content: "# Hello world", created_at: "" },
            ]),
        });
    });
    await page.route("**/api/baskets/1/blocks", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([
                {
                    id: "b1",
                    label: "Hello",
                    type: "note",
                    updated_at: "",
                    commit_id: null,
                },
            ]),
        });
    });
    await page.route("**/api/baskets/1/input-highlights", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([
                {
                    dump_input_id: "in1",
                    conflicting_block_id: "b1",
                    reason: "possible_redundancy",
                },
            ]),
        });
    });
    await page.route("**/api/context-blocks", async (route) => {
        await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: "{}",
        });
    });

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/baskets/1/work");

    await expect(
        page.locator('span[title*="possible_redundancy"]'),
    ).toBeVisible();

    await page.locator("article").click();
    await page.getByRole("button", { name: /Promote Selection/i }).click();
    await expect(page.locator("text=Promoted to block")).toBeVisible();
});
