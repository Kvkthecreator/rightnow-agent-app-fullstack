import { test, expect } from '@playwright/test';

test('memory fan-out idempotency', async ({ page }) => {
  await page.goto('/');
  const basketId = process.env.TEST_BASKET_ID || 'test-basket';
  await page.goto(`/baskets/${basketId}/memory`);

  const textarea = page.getByRole('textbox');
  await textarea.fill('Hello canon');

  const input = page.locator('input[type=file]');
  await input.setInputFiles([
    { name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('A') },
    { name: 'b.txt', mimeType: 'text/plain', buffer: Buffer.from('B') },
  ]);
  await page.getByRole('button', { name: /add|upload/i }).click();

  await expect(page.locator('[data-test=dump-item]')).toHaveCount(2);
  await expect(page.locator('[data-outcome=replayed]')).toHaveCount(2);
});
