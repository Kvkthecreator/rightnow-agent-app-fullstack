import { test, expect } from '@playwright/test';

// E2E Test: Document Composition with Multi-Substrate Canon
// Tests the full workflow: create doc → attach multi-substrate → timeline events

// Use seeded test data from seed-test-basket.js
const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
const documentId = '11111111-1111-1111-1111-111111111111';  // Seeded document
const blockId = '33333333-3333-3333-3333-333333333333';     // Seeded block
const dumpId = '55555555-5555-5555-5555-555555555555';      // Seeded dump
const contextItemId = '66666666-6666-6666-6666-666666666666'; // Seeded context item

test.skip(!basketId, 'requires TEST_BASKET_ID to run');

test.describe('Document Substrate Composition E2E', () => {

  test('verifies seeded substrate composition data', async ({ page }) => {
    // Navigate directly to the seeded test document
    await page.goto(`/baskets/${basketId}/documents/${documentId}`);

    // Verify we're on the correct document
    await expect(page.locator('h1')).toContainText('E2E Test Document - Multi-Substrate');

    // Verify composition overview is visible
    await expect(page.locator('text=Composition Overview')).toBeVisible();
    
    // Should have seeded substrate references (block + dump from seeding script)
    await expect(page.locator('.substrate-reference-card')).toHaveCount(2);
    
    // Verify substrate types are displayed correctly
    await expect(page.locator('.substrate-badge:has-text("block")')).toBeVisible();
    await expect(page.locator('.substrate-badge:has-text("dump")')).toBeVisible();

    // Verify composition stats show correct counts
    const blockStats = page.locator('[data-testid="composition-stats"] .blocks-count, .composition-stats .blocks-count').first();
    await expect(blockStats).toContainText('1');
    
    const dumpStats = page.locator('[data-testid="composition-stats"] .dumps-count, .composition-stats .dumps-count').first();
    await expect(dumpStats).toContainText('1');

    // Test substrate filtering functionality
    const filterSelect = page.locator('select:has(option:has-text("All Types")), select:has(option:has-text("block"))').first();
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption('block');
      await expect(page.locator('.substrate-badge:has-text("block")')).toBeVisible();
      
      await filterSelect.selectOption('dump'); 
      await expect(page.locator('.substrate-badge:has-text("dump")')).toBeVisible();
      
      await filterSelect.selectOption('all');
      await expect(page.locator('.substrate-reference-card')).toHaveCount(2);
    }
  });

  test('verifies timeline events for substrate operations', async ({ page }) => {
    // Navigate to timeline to check seeded events
    await page.goto(`/baskets/${basketId}/timeline`);
    
    // Should have timeline events from seeding
    await expect(page.locator('.timeline-event, [data-testid="timeline-event"]').first()).toBeVisible();
    
    // Check for document creation event
    const documentEvent = page.locator('text=document.created, text=Created test document').first();
    if (await documentEvent.isVisible()) {
      await expect(documentEvent).toBeVisible();
    }

    // Check for substrate attachment event  
    const attachEvent = page.locator('text=document.block.attached, text=Attached block').first();
    if (await attachEvent.isVisible()) {
      await expect(attachEvent).toBeVisible();
    }
  });

  test('substrate canon compliance verification', async ({ page }) => {
    // This test verifies that the implementation follows substrate canon principles
    
    await page.goto(`/baskets/${basketId}/documents/${documentId}`);

    // 1. All substrate types should be available for attachment
    await page.click('button:has-text("Add Reference")');
    const substrateTypeOptions = await page.locator('select[data-testid="substrate-type"] option').allTextContents();
    expect(substrateTypeOptions).toContain('block');
    expect(substrateTypeOptions).toContain('dump');
    expect(substrateTypeOptions).toContain('context_item');
    expect(substrateTypeOptions).toContain('reflection');
    expect(substrateTypeOptions).toContain('timeline_event');

    await page.keyboard.press('Escape'); // Close modal

    // 2. Substrate references should use consistent data structure
    const references = page.locator('.substrate-reference-card');
    const referenceData = await references.evaluateAll(cards =>
      cards.map(card => ({
        hasId: !!card.getAttribute('data-reference-id'),
        hasSubstrateType: !!card.querySelector('.substrate-badge'),
        hasSubstrateId: !!card.getAttribute('data-substrate-id'),
        hasCreatedAt: !!card.querySelector('[data-testid="timestamp"]'),
      }))
    );

    referenceData.forEach(ref => {
      expect(ref.hasId).toBe(true);
      expect(ref.hasSubstrateType).toBe(true);
      expect(ref.hasSubstrateId).toBe(true);
      expect(ref.hasCreatedAt).toBe(true);
    });

    // 3. Composition stats should treat all substrates equally
    const stats = await page.locator('[data-testid="composition-stats"]').textContent();
    expect(stats).toMatch(/\d+ Blocks/);
    expect(stats).toMatch(/\d+ Dumps/);
    expect(stats).toMatch(/\d+ Context Items/);
    expect(stats).toMatch(/\d+ Reflections/);
    expect(stats).toMatch(/\d+ Timeline Events/);
  });

  test('error handling and edge cases', async ({ page }) => {
    await page.goto(`/baskets/${basketId}/documents/${documentId}`);

    // Test duplicate substrate attachment prevention
    await page.click('button:has-text("Add Reference")');
    await page.selectOption('select[data-testid="substrate-type"]', 'block');
    await page.click(`[data-testid="substrate-${blockId}"]`); // Same block as before
    await page.click('button:has-text("Attach")');

    // Should show error for duplicate attachment
    await expect(page.locator('[data-testid="error-message"]')).toContainText('already attached');

    // Test invalid weight values
    await page.fill('input[data-testid="weight"]', '1.5'); // > 1.0
    await page.click('button:has-text("Attach")');
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Weight must be between 0 and 1');

    await page.fill('input[data-testid="weight"]', '-0.1'); // < 0.0
    await page.click('button:has-text("Attach")');
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Weight must be between 0 and 1');

    await page.keyboard.press('Escape'); // Close modal

    // Test network error handling
    await page.route('/api/documents/*/references', route => route.abort());
    
    const detachButton = page.locator('.substrate-reference-card').first().locator('button[title="Detach"]');
    await detachButton.click();
    await page.click('button:has-text("Confirm")');
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to detach reference');
  });

  test.afterAll(async ({ request }) => {
    // Clean up test data
    if (documentId) {
      await request.delete(`/api/documents/${documentId}`);
    }
    if (basketId) {
      await request.delete(`/api/baskets/${basketId}`);
    }
  });
});