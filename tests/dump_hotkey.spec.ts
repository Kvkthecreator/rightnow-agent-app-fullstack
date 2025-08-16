import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';

// Helper to call API directly
async function createBasket() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/baskets/new`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idempotency_key: randomUUID(),
      basket: { name: 'init' },
    }),
  });
  const data = await res.json();
  return data.basket_id as string;
}

test('dump hotkey saves dump', async ({ page }) => {
  const basketId = await createBasket();
  await page.goto(`/baskets/${basketId}/work`);
  await page.keyboard.press('Shift+V');
  await page.locator('textarea').fill('hello world');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Dump saved')).toBeVisible();
  const snap = await page.request.get(`/api/baskets/snapshot/${basketId}`);
  expect(snap.status()).toBe(200);
});
