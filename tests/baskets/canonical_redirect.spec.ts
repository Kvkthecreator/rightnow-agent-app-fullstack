import { test, expect } from '@playwright/test'

test('redirects to canonical basket id preserving subpath', async ({ page }) => {
  await page.goto('/baskets/not-real/reflections')
  await expect(page).toHaveURL(/\/baskets\/(?!not-real)[^/]+\/reflections$/)
})
