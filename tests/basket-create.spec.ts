import { test, expect } from '@playwright/test';

test('Create a new basket from dump', async ({ page }) => {
  await page.goto('/baskets/new');

  await page.fill('textarea[placeholder="What’s the idea or intent?"]', 'Run a playful Gen Z TikTok challenge');
  await page.fill('textarea[placeholder="Add extra insights…"]', 'Lean into visual humor and cultural slang');

  await page.click('button:has-text("Create")');
  await page.waitForURL('**/baskets/**');

  const heading = await page.locator('h1');
  await expect(heading).toContainText('Run a playful Gen Z TikTok challenge');
});
