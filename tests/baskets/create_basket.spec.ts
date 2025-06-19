import { test, expect } from '@playwright/test';

test('create basket via new page', async ({ page }) => {
  await page.goto('/baskets/new');
  await page.getByPlaceholder('Drop your thoughts here...').fill('hello world');
  await page.getByRole('button', { name: 'Create' }).click();
  await page.waitForURL('**/baskets/*/work');
  await expect(page).toHaveURL(/\/baskets\/[^/]+\/work/);
});
