import { test, expect } from '@playwright/test';

const basketId = process.env.TEST_ONBOARDING_BASKET_ID;
test.skip(!basketId, 'requires TEST_ONBOARDING_BASKET_ID');

test('inline onboarding gate flow', async ({ page }) => {
  await page.goto(`/baskets/${basketId}/memory`);
  await expect(page.getByRole('button', { name: 'Begin the Mirror' })).toBeVisible();

  await page.getByRole('button', { name: 'Begin the Mirror' }).click();
  await page.locator('input[placeholder="Your name"]').fill('Playwright User');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.locator('textarea').fill('Testing tension');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.locator('textarea').fill('Testing aspiration');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Finish' }).click();

  await page.waitForURL(`/baskets/${basketId}/memory?onboarded=1`);
  await expect(page.locator('[data-test=dump-item]')).toHaveCount(3);
});
