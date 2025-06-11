import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test.describe('Basket Creation Flow', () => {
  test.use({ storageState: 'storageState.json' }); // assumes you're logged in with this session

  test('should create a basket and redirect to work page', async ({ page }) => {
    // Open the local basket creation page
    await page.goto('http://localhost:3000/baskets/create');

    // Fill in raw text dump
    await page.getByLabel('Raw Text Dump').fill(
      `Slide 1 – Dump, Memory, Brief\n\nPaste GPT replies here to structure them later.`
    );

    // Optionally upload a file (safely skip if file doesn't exist)
    const testFilePath = 'tests/assets/test-image.png';
    try {
      if (fs.existsSync(testFilePath)) {
        const [fileChooser] = await Promise.all([
          page.waitForEvent('filechooser'),
          page.getByText('Drag & drop files here or click to upload').click(),
        ]);
        await fileChooser.setFiles(testFilePath);
      } else {
        console.warn(`⚠️ File not found at ${testFilePath}. Upload skipped.`);
      }
    } catch (err) {
      console.warn(`⚠️ File upload error: ${(err as Error).message}`);
    }

    // Try filling the link using label or placeholder fallback
    try {
      await page.getByLabel('Relevant Links').fill('https://example.com/context');
    } catch {
      try {
        await page.getByPlaceholder('Paste links here').fill('https://example.com/context');
      } catch (innerErr) {
        console.warn(`⚠️ Could not find link input by label or placeholder.`);
      }
    }

    // Optional: pause browser to debug manually
    // await page.pause();

    // Submit the basket creation form
    await page.getByRole('button', { name: 'Create Basket' }).click();

    // Wait for redirect to /baskets/[id]/work
    await page.waitForURL('**/baskets/*/work', { timeout: 5000 });

    // Confirm the new basket work page is visible
    await expect(page.getByText('Work on Basket')).toBeVisible();
  });
});
