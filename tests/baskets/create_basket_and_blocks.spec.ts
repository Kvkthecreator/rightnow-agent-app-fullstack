import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test.describe('Basket Creation Flow', () => {
  test.use({ storageState: 'storageState.json' }); // assumes you're logged in with this session

  test('should create a basket and redirect to work page', async ({ page }) => {
    // Open the local basket creation page
    await page.goto('http://localhost:3000/baskets/create');

    // Fill in raw text dump
    await page.getByPlaceholder('Drop it').fill(
      `Slide 1 – Dump, Memory, Brief\n\nPaste GPT replies here to structure them later.`
    );

    // Optional: pause browser to debug manually
    // await page.pause();

    // Submit the basket creation form
    await page.getByRole('button', { name: 'Save to Basket' }).click();

    // Wait for redirect to /baskets/[id]/work
    await page.waitForURL('**/baskets/*/work', { timeout: 5000 });

    // Confirm the new basket work page is visible
    await expect(
      page.getByRole('heading', { name: /Blocks/i })
    ).toBeVisible();
  });
});
