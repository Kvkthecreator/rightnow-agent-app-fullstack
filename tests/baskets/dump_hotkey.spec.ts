import { test, expect } from '@playwright/test';

// assumes logged in via storageState
test.use({ storageState: 'storageState.json' });

test('open dump modal with hotkey', async ({ page }) => {
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
  await page.goto('/baskets/1/work');
  await page.keyboard.press(`${modifier}+Shift+V`);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByPlaceholder('Drop it').fill('hotkey text');
  await page.getByRole('button', { name: /save to basket/i }).click();
  await expect(page.locator('text=Dump added')).toBeVisible();
});
