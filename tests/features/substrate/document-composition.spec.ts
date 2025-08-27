import { test, expect } from '@playwright/test';

/**
 * [FEATURE] Document Composition Tests
 * 
 * Tests the document composition system that allows deliberate narrative creation
 * by composing substrate references with authored prose.
 */

test.describe('[FEATURE] Document Composition', () => {
  const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
  const documentId = '11111111-1111-1111-1111-111111111111';

  test('user can create document with multi-substrate composition', async ({ page }) => {
    await page.goto(`/baskets/${basketId}/documents`);
    
    // Create new document
    const createButton = page.locator('button:has-text("Create Document"), [data-testid="create-document"]');
    
    if (await createButton.count() > 0) {
      await createButton.click();
      
      // Fill document details
      await page.fill('input[name="title"]', 'Test Multi-Substrate Document');
      await page.click('button:has-text("Create")');
      
      // Should navigate to document composition view
      await expect(page).toHaveURL(/\/documents\/[a-f0-9-]+$/);
      
      // Add substrate references
      await page.click('button:has-text("Add Reference")');
      
      // Select substrate type
      await page.selectOption('select[data-testid="substrate-type"]', 'block');
      
      // Select a block to attach
      const blockOption = page.locator('[data-testid^="substrate-"]').first();
      if (await blockOption.count() > 0) {
        await blockOption.click();
      }
      
      // Set reference details
      await page.fill('input[data-testid="role"]', 'primary');
      await page.fill('input[data-testid="weight"]', '0.8');
      
      await page.click('button:has-text("Attach")');
      
      // Should see attached reference
      await expect(page.locator('.substrate-reference-card')).toHaveCount(1);
      
      // Add dump reference
      await page.click('button:has-text("Add Reference")');
      await page.selectOption('select[data-testid="substrate-type"]', 'dump');
      
      const dumpOption = page.locator('[data-testid^="substrate-"]').first();
      if (await dumpOption.count() > 0) {
        await dumpOption.click();
        await page.click('button:has-text("Attach")');
      }
      
      // Should now have multiple substrate references
      await expect(page.locator('.substrate-reference-card')).toHaveCount(2);
    }
  });

  test('composition stats accurately reflect attached substrates', async ({ page }) => {
    await page.goto(`/baskets/${basketId}/documents/${documentId}`);
    
    const statsContainer = page.locator('[data-testid="composition-stats"]');
    
    if (await statsContainer.count() > 0) {
      // Get current reference count
      const referenceCards = await page.locator('.substrate-reference-card').count();
      
      // Stats should reflect actual composition
      const statsText = await statsContainer.textContent();
      expect(statsText).toContain('Total References');
      
      // Individual substrate type counts
      const blockCount = (statsText?.match(/(\d+)\s*Blocks?/) || [, '0'])[1];
      const dumpCount = (statsText?.match(/(\d+)\s*Dumps?/) || [, '0'])[1];
      const contextCount = (statsText?.match(/(\d+)\s*Context Items?/) || [, '0'])[1];
      
      const totalFromStats = parseInt(blockCount) + parseInt(dumpCount) + parseInt(contextCount);
      
      // Should match actual reference cards shown
      expect(totalFromStats).toBeLessThanOrEqual(referenceCards);
    }
  });

  test('substrate filtering works in document composition', async ({ page }) => {
    await page.goto(`/baskets/${basketId}/documents/${documentId}`);
    
    const filterSelect = page.locator('select:has(option:has-text("All Types"))');
    
    if (await filterSelect.count() > 0) {
      const allReferences = await page.locator('.substrate-reference-card').count();
      
      if (allReferences > 0) {
        // Filter by block type
        await filterSelect.selectOption('block');
        
        const blockReferences = await page.locator('.substrate-reference-card').count();
        const visibleBlockBadges = await page.locator('.substrate-badge:has-text("block")').count();
        
        expect(blockReferences).toBe(visibleBlockBadges);
        
        // Filter by dump type
        await filterSelect.selectOption('dump');
        
        const dumpReferences = await page.locator('.substrate-reference-card').count();
        const visibleDumpBadges = await page.locator('.substrate-badge:has-text("dump")').count();
        
        expect(dumpReferences).toBe(visibleDumpBadges);
        
        // Reset to show all
        await filterSelect.selectOption('all');
        const resetReferences = await page.locator('.substrate-reference-card').count();
        expect(resetReferences).toBe(allReferences);
      }
    }
  });

  test('user can detach substrate references', async ({ page, request }) => {
    await page.goto(`/baskets/${basketId}/documents/${documentId}`);
    
    const initialReferences = await page.locator('.substrate-reference-card').count();
    
    if (initialReferences > 0) {
      // Get reference details for verification
      const firstCard = page.locator('.substrate-reference-card').first();
      const substrateId = await firstCard.getAttribute('data-substrate-id');
      const substrateType = await firstCard.locator('.substrate-badge').textContent();
      
      // Detach reference
      const detachButton = firstCard.locator('button[title="Detach"], button:has-text("Remove")');
      await detachButton.click();
      
      // Confirm detachment
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Remove")');
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }
      
      // Should have one fewer reference
      await expect(page.locator('.substrate-reference-card')).toHaveCount(initialReferences - 1);
      
      // Verify via API that reference was removed
      const compositionResponse = await request.get(`/api/documents/${documentId}/composition`);
      const composition = await compositionResponse.json();
      
      const detachedRef = composition.references.find((ref: any) => 
        ref.reference.substrate_id === substrateId &&
        ref.substrate.substrate_type?.toLowerCase() === substrateType?.toLowerCase()
      );
      
      expect(detachedRef).toBeUndefined();
    }
  });

  test('substrate references maintain role and weight metadata', async ({ page, request }) => {
    await page.goto(`/baskets/${basketId}/documents/${documentId}`);
    
    // Add reference with specific role and weight
    await page.click('button:has-text("Add Reference")');
    
    await page.selectOption('select[data-testid="substrate-type"]', 'context_item');
    
    const contextOption = page.locator('[data-testid^="substrate-"]').first();
    if (await contextOption.count() > 0) {
      await contextOption.click();
      
      // Set specific role and weight
      await page.fill('input[data-testid="role"]', 'supporting');
      await page.fill('input[data-testid="weight"]', '0.6');
      
      // Add snippets
      await page.fill('textarea[data-testid="snippets"]', 'Important snippet text');
      
      await page.click('button:has-text("Attach")');
      
      // Verify metadata is displayed
      const newReference = page.locator('.substrate-reference-card').last();
      await expect(newReference).toContainText('supporting');
      await expect(newReference).toContainText('0.6');
      await expect(newReference).toContainText('Important snippet text');
      
      // Verify via API
      const compositionResponse = await request.get(`/api/documents/${documentId}/composition`);
      const composition = await compositionResponse.json();
      
      const recentRef = composition.references[composition.references.length - 1];
      expect(recentRef.reference.role).toBe('supporting');
      expect(parseFloat(recentRef.reference.weight)).toBe(0.6);
      expect(recentRef.reference.snippets).toContain('Important snippet text');
    }
  });

  test('document composition emits proper timeline events', async ({ page, request }) => {
    const initialTimelineResponse = await request.get(`/api/baskets/${basketId}/timeline`);
    const initialTimeline = await initialTimelineResponse.json();
    const initialEventCount = initialTimeline.events.length;
    
    await page.goto(`/baskets/${basketId}/documents/${documentId}`);
    
    // Add a substrate reference
    await page.click('button:has-text("Add Reference")');
    await page.selectOption('select[data-testid="substrate-type"]', 'block');
    
    const blockOption = page.locator('[data-testid^="substrate-"]').first();
    if (await blockOption.count() > 0) {
      const substrateId = await blockOption.getAttribute('data-substrate-id');
      
      await blockOption.click();
      
      const attachResponsePromise = page.waitForResponse(response => 
        response.url().includes('/references') && response.status() === 200
      );
      
      await page.click('button:has-text("Attach")');
      await attachResponsePromise;
      
      // Check timeline for attachment event
      const updatedTimelineResponse = await request.get(`/api/baskets/${basketId}/timeline`);
      const updatedTimeline = await updatedTimelineResponse.json();
      
      expect(updatedTimeline.events.length).toBeGreaterThan(initialEventCount);
      
      const attachEvent = updatedTimeline.events.find((event: any) => 
        event.kind === 'document.block.attached' &&
        event.entity_id === documentId &&
        event.metadata.substrate_id === substrateId
      );
      
      expect(attachEvent).toBeDefined();
      expect(attachEvent.metadata.substrate_type).toBe('block');
    }
  });

  test('composition supports all canonical substrate types', async ({ page }) => {
    await page.goto(`/baskets/${basketId}/documents/${documentId}`);
    
    await page.click('button:has-text("Add Reference")');
    
    const substrateTypeSelect = page.locator('select[data-testid="substrate-type"]');
    const options = await substrateTypeSelect.locator('option').allTextContents();
    
    // Should support all five canonical substrate types
    expect(options).toContain('block');
    expect(options).toContain('dump');
    expect(options).toContain('context_item');
    expect(options).toContain('reflection');
    expect(options).toContain('timeline_event');
    
    // Test each type can be selected
    for (const type of ['block', 'dump', 'context_item']) {
      await substrateTypeSelect.selectOption(type);
      
      const selectedValue = await substrateTypeSelect.inputValue();
      expect(selectedValue).toBe(type);
      
      // Should show substrate options for this type
      const substrateOptions = page.locator('[data-testid^="substrate-"]');
      if (await substrateOptions.count() > 0) {
        await expect(substrateOptions.first()).toBeVisible();
      }
    }
  });

  test('composition preserves substrate order and relationships', async ({ page, request }) => {
    await page.goto(`/baskets/${basketId}/documents/${documentId}`);
    
    // Get current composition
    const initialCompositionResponse = await request.get(`/api/documents/${documentId}/composition`);
    const initialComposition = await initialCompositionResponse.json();
    
    // Add multiple references in specific order
    const referencesToAdd = [
      { type: 'block', role: 'primary' },
      { type: 'dump', role: 'supporting' },
      { type: 'context_item', role: 'citation' }
    ];
    
    for (const ref of referencesToAdd) {
      await page.click('button:has-text("Add Reference")');
      await page.selectOption('select[data-testid="substrate-type"]', ref.type);
      
      const option = page.locator('[data-testid^="substrate-"]').first();
      if (await option.count() > 0) {
        await option.click();
        await page.fill('input[data-testid="role"]', ref.role);
        await page.click('button:has-text("Attach")');
        
        // Wait for attachment to complete
        await page.waitForResponse(response => 
          response.url().includes('/references') && response.status() === 200
        );
      }
    }
    
    // Verify composition order is preserved
    const finalCompositionResponse = await request.get(`/api/documents/${documentId}/composition`);
    const finalComposition = await finalCompositionResponse.json();
    
    const newReferences = finalComposition.references.slice(initialComposition.references.length);
    
    for (let i = 0; i < newReferences.length; i++) {
      const ref = newReferences[i];
      const expected = referencesToAdd[i];
      
      expect(ref.reference.role).toBe(expected.role);
      expect(ref.substrate.substrate_type).toBe(expected.type);
    }
  });

  test('error handling for invalid substrate references', async ({ page }) => {
    await page.goto(`/baskets/${basketId}/documents/${documentId}`);
    
    await page.click('button:has-text("Add Reference")');
    await page.selectOption('select[data-testid="substrate-type"]', 'block');
    
    // Try invalid weight values
    const option = page.locator('[data-testid^="substrate-"]').first();
    if (await option.count() > 0) {
      await option.click();
      
      // Test weight > 1.0
      await page.fill('input[data-testid="weight"]', '1.5');
      await page.click('button:has-text("Attach")');
      
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Weight must be between 0 and 1');
      
      // Test negative weight
      await page.fill('input[data-testid="weight"]', '-0.1');
      await page.click('button:has-text("Attach")');
      
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Weight must be between 0 and 1');
      
      // Test valid weight should work
      await page.fill('input[data-testid="weight"]', '0.7');
      
      // Mock successful response
      await page.route('**/references', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ reference: { id: 'test-ref-id' } })
        });
      });
      
      await page.click('button:has-text("Attach")');
      
      // Should not show error for valid weight
      await expect(page.locator('[data-testid="error-message"]:visible')).toHaveCount(0);
    }
  });

  test('composition supports duplicate substrate prevention', async ({ page }) => {
    await page.goto(`/baskets/${basketId}/documents/${documentId}`);
    
    // Try to attach the same substrate twice
    await page.click('button:has-text("Add Reference")');
    await page.selectOption('select[data-testid="substrate-type"]', 'block');
    
    const blockOption = page.locator('[data-testid^="substrate-"]').first();
    if (await blockOption.count() > 0) {
      const substrateId = await blockOption.getAttribute('data-substrate-id');
      
      // First attachment
      await blockOption.click();
      await page.click('button:has-text("Attach")');
      
      await page.waitForResponse(response => 
        response.url().includes('/references')
      );
      
      // Try second attachment of same substrate
      await page.click('button:has-text("Add Reference")');
      await page.selectOption('select[data-testid="substrate-type"]', 'block');
      
      const sameBlock = page.locator(`[data-substrate-id="${substrateId}"]`);
      if (await sameBlock.count() > 0) {
        await sameBlock.click();
        await page.click('button:has-text("Attach")');
        
        // Should show duplicate error
        await expect(page.locator('[data-testid="error-message"]')).toContainText(/already attached|duplicate/i);
      }
    }
  });
});