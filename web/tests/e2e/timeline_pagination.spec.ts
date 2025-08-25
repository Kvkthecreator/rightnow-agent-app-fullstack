import { test, expect } from '@playwright/test';

test('timeline paginates with last_cursor', async ({ page }) => {
  const basketId = process.env.TEST_BASKET_ID || 'test-basket';
  await page.goto(`/baskets/${basketId}/timeline`);

  const items = page.locator('[data-test=timeline-item]');
  await expect(items.first()).toBeVisible();

  const loadMore = page.getByRole('button', { name: /load more/i });
  await loadMore.click();

  await expect(items).toHaveCountGreaterThan(1);
});
