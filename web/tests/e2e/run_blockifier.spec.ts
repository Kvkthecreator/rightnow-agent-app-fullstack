import { test, expect } from "@playwright/test";

// Simulated snapshot responses before and after running Blockifier
const firstSnapshot = {
    raw_dump_body: "# dump",
    file_refs: [],
    blocks: [],
};
const secondSnapshot = {
    ...firstSnapshot,
    blocks: [
        {
            id: "p1",
            content: "hello",
            state: "PROPOSED",
            semantic_type: "note",
            scope: null,
            canonical_value: null,
        },
    ],
};

test("run blockifier flow", async ({ page }) => {
    let snapCall = 0;
    await page.route("**/baskets/snapshot/test-basket", async (route) => {
        snapCall += 1;
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(
                snapCall === 1 ? firstSnapshot : secondSnapshot,
            ),
        });
    });

    await page.route("**/api/agents/orch_block_manager/run", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ proposed: 1 }),
        });
    });

    await page.goto("/baskets/test-basket/dashboard");
    await page.getByRole("button", { name: "Run Blockifier" }).click();

    await expect(page.getByText("Parsing complete")).toBeVisible();
});
