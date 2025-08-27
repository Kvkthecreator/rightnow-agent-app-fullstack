import { test, expect } from '@playwright/test';

/**
 * [CANON] Substrate Equality Tests
 * 
 * Validates that all five substrate types (raw_dumps, context_blocks, context_items, 
 * reflections, timeline_events) are treated as peers with no hierarchy.
 */

test.describe('[CANON] Substrate Equality', () => {
  const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
  const documentId = '11111111-1111-1111-1111-111111111111';

  test.beforeEach(async ({ page }) => {
    await page.goto(`/baskets/${basketId}/documents/${documentId}`);
  });

  test('all substrate types are treated as peers in document composition', async ({ page }) => {
    // Verify all substrate types can be attached
    await page.click('button:has-text("Add Reference")');
    
    const substrateTypeSelect = page.locator('select[data-testid="substrate-type"]');
    const options = await substrateTypeSelect.locator('option').allTextContents();
    
    // All five canonical substrate types must be available
    expect(options).toContain('block');
    expect(options).toContain('dump');
    expect(options).toContain('context_item');
    expect(options).toContain('reflection');
    expect(options).toContain('timeline_event');
    
    await page.keyboard.press('Escape');
  });

  test('no substrate type has privileged access or special UI treatment', async ({ page }) => {
    // Verify substrate references have consistent structure
    const references = await page.locator('.substrate-reference-card').all();
    
    for (const ref of references) {
      // All substrates should have the same UI structure
      await expect(ref.locator('.substrate-badge')).toBeVisible();
      await expect(ref.locator('[data-testid="timestamp"]')).toBeVisible();
      await expect(ref.locator('button[title="Detach"]')).toBeVisible();
      
      // No special styling based on substrate type
      const classes = await ref.getAttribute('class');
      expect(classes).toContain('substrate-peer-reference');
    }
  });

  test('composition stats treat all substrate types equally', async ({ page }) => {
    const statsContainer = page.locator('[data-testid="composition-stats"]');
    
    // All substrate types should have equal representation in stats
    await expect(statsContainer).toContainText(/\d+ Blocks/);
    await expect(statsContainer).toContainText(/\d+ Dumps/);
    await expect(statsContainer).toContainText(/\d+ Context Items/);
    await expect(statsContainer).toContainText(/\d+ Reflections/);
    await expect(statsContainer).toContainText(/\d+ Timeline Events/);
    
    // Verify no substrate type is highlighted or given prominence
    const statElements = await statsContainer.locator('[data-substrate-stat]').all();
    const fontSizes = await Promise.all(
      statElements.map(el => el.evaluate(node => window.getComputedStyle(node).fontSize))
    );
    
    // All stats should have the same font size
    expect(new Set(fontSizes).size).toBe(1);
  });

  test('substrate filtering works uniformly across all types', async ({ page }) => {
    const filterSelect = page.locator('select:has(option:has-text("All Types"))').first();
    
    if (await filterSelect.isVisible()) {
      const substrateTypes = ['block', 'dump', 'context_item', 'reflection', 'timeline_event'];
      
      for (const type of substrateTypes) {
        await filterSelect.selectOption(type);
        
        // Filter should work identically for all substrate types
        const visibleCards = await page.locator('.substrate-reference-card:visible').count();
        const typeCount = await page.locator(`.substrate-badge:has-text("${type}")`).count();
        
        if (typeCount > 0) {
          expect(visibleCards).toBe(typeCount);
        }
      }
    }
  });

  test('API treats all substrate types uniformly', async ({ page, request }) => {
    // Test attachment endpoint accepts all substrate types
    const substrateTypes = [
      { type: 'block', id: '33333333-3333-3333-3333-333333333333' },
      { type: 'dump', id: '55555555-5555-5555-5555-555555555555' },
      { type: 'context_item', id: '66666666-6666-6666-6666-666666666666' },
      { type: 'reflection', id: '77777777-7777-7777-7777-777777777777' },
      { type: 'timeline_event', id: '88888888-8888-8888-8888-888888888888' }
    ];

    for (const substrate of substrateTypes) {
      const response = await request.post(`/api/documents/${documentId}/references`, {
        data: {
          substrate_type: substrate.type,
          substrate_id: substrate.id,
          role: 'test',
          weight: 0.5
        }
      });

      // All substrate types should be accepted equally
      expect([200, 201, 409]).toContain(response.status()); // 409 if already attached
    }
  });
});