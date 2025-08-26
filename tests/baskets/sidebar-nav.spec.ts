import { test, expect } from '@playwright/test';

test('sidebar navigation uses soft transitions with pending UI', async ({ page }) => {
  await page.goto('/baskets/work/memory');

  const targets = [
    { name: 'Timeline', path: '/baskets/work/timeline' },
    { name: 'Reflections', path: '/baskets/work/reflections' },
    { name: 'Memory', path: '/baskets/work/memory' },
  ];

  for (const { name, path } of targets) {
    await Promise.all([
      page.waitForSelector('[aria-busy="true"]', { state: 'attached' }),
      page.getByRole('link', { name }).click(),
    ]);
    await expect(page).toHaveURL(path);
    const navType = await page.evaluate(() => performance.getEntriesByType('navigation').at(-1)?.type);
    expect(navType).not.toBe('reload');
  }
});
