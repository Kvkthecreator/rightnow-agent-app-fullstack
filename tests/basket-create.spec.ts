import { test, expect } from '@playwright/test';

test('Create basket from SmartDrop text', async ({ page }) => {
  await page.goto('/baskets/new');

  await page.getByPlaceholder('Drop it').fill('Run a 7-day launch');
  await page.keyboard.press('Meta+Enter');

  await page.waitForURL('**/work');
  await expect(page.url()).toContain('/work');
});
