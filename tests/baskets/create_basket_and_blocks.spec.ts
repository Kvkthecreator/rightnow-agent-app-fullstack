import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test.describe('Basket Creation Flow', () => {
  test.use({ storageState: 'storageState.json' }); // assumes you're already logged in

  test('should create a basket and redirect to work page', async ({ page }) => {
    // Navigate to the DumpArea creation page
    await page.goto('https://www.yarnnn.com/baskets/create');

    // Paste a raw dump
    await page.getByLabel('Raw Text Dump').fill(
      `Slide 1 – Dump, Memory, Brief\n\nPaste GPT replies here to structure them later.`
    );

    // Upload a file (replace with any local test file you want to simulate upload)
    const testFilePath = 'tests/assets/test-image.png';
    if (!fs.existsSync(testFilePath)) {
      console.warn(`⚠️ No file found at ${testFilePath}. Skipping upload test.`);
    } else {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.getByText('Drag & drop files here or click to upload').click(),
      ]);
      await fileChooser.setFiles(testFilePath);
    }

    // Add a relevant link (optional)
    await page.getByLabel('Relevant Links').fill('https://example.com/context');

    // Click Create
    await page.getByRole('button', { name: 'Create Basket' }).click();

    // Wait for redirect to /baskets/[id]/work
    await page.waitForURL('**/baskets/*/work', { timeout: 5000 });

    // Confirm success visually
    await expect(page.getByText('Work on Basket')).toBeVisible();
  });
});
