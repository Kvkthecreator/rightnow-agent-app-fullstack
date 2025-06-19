import { test, expect } from '@playwright/test';

// Simulated snapshot responses before and after running Blockifier
const firstSnapshot = {
  raw_dump: '# dump',
  accepted_blocks: [],
  locked_blocks: [],
  constants: [],
  proposed_blocks: [],
};
const secondSnapshot = {
  ...firstSnapshot,
  proposed_blocks: [
    { id: 'p1', content: 'hello', state: 'PROPOSED', semantic_type: 'note' },
  ],
};

test('run blockifier flow', async ({ page }) => {
  let snapCall = 0;
  await page.route('**/api/baskets/test-basket/snapshot', async (route) => {
    snapCall += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(snapCall === 1 ? firstSnapshot : secondSnapshot),
    });
  });

  await page.route('**/api/agents/orch_block_manager/run', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ proposed: 1 }),
    });
  });

  await page.goto('/baskets/test-basket/work');
  await page.getByRole('button', { name: 'Run Blockifier' }).click();

  await expect(page.getByText('Parsing complete')).toBeVisible();
  await expect(page.getByRole('heading', { name: '□ PROPOSED' })).toBeVisible();
});

