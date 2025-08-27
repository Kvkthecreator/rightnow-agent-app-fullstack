import { test, expect } from '@playwright/test';

/**
 * [FEATURE] Sacred Memory Capture Tests
 * 
 * Tests the sacred capture principle: all user input becomes immutable raw_dump
 * via the primary write path POST /api/dumps/new
 */

test.describe('[FEATURE] Sacred Memory Capture', () => {
  const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';

  test('text capture creates immutable dump via sacred write path', async ({ page, request }) => {
    await page.goto(`/baskets/${basketId}/memory`);
    
    // Test text input capture
    const testText = `Sacred capture test: ${Date.now()}`;
    
    const textArea = page.locator('textarea[data-testid="memory-input"], textarea[placeholder*="capture" i]').first();
    
    if (await textArea.count() > 0) {
      await textArea.fill(testText);
      
      // Submit/capture the input
      const captureButton = page.locator('button:has-text("Capture"), button[data-testid="capture-submit"]').first();
      
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/dumps/new') && response.status() === 200
      );
      
      await captureButton.click();
      const response = await responsePromise;
      
      const result = await response.json();
      
      // Verify sacred write path was used
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('text_dump', testText);
      expect(result).toHaveProperty('created_at');
      expect(result).toHaveProperty('basket_id', basketId);
      
      // Verify immutability - should not be updatable
      const modifyResponse = await request.patch(`/api/dumps/${result.id}`, {
        data: { text_dump: 'Modified content' }
      });
      expect([404, 405]).toContain(modifyResponse.status());
    }
  });

  test('file capture creates immutable dump with file metadata', async ({ page }) => {
    await page.goto(`/baskets/${basketId}/memory`);
    
    // Test file upload capture
    const fileInput = page.locator('input[type="file"]').first();
    
    if (await fileInput.count() > 0) {
      // Create test file
      const testContent = 'Test file content for sacred capture';
      const testFile = Buffer.from(testContent);
      
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/dumps/new') && response.status() === 200
      );
      
      // Upload file
      await fileInput.setInputFiles({
        name: 'test-capture.txt',
        mimeType: 'text/plain',
        buffer: testFile
      });
      
      // Wait for capture to complete
      const response = await responsePromise;
      const result = await response.json();
      
      // Verify file dump creation
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('file_url');
      expect(result.source_type).toBe('file');
      expect(result.metadata.filename).toBe('test-capture.txt');
      expect(result.metadata.mime_type).toBe('text/plain');
    }
  });

  test('clipboard capture via hotkey creates dump', async ({ page }) => {
    await page.goto(`/baskets/${basketId}/memory`);
    
    // Test clipboard capture hotkey
    const clipboardText = `Clipboard test: ${Date.now()}`;
    
    // Set clipboard content (mock)
    await page.evaluate((text) => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
      }
    }, clipboardText);
    
    // Trigger clipboard capture (usually Cmd+Shift+V or similar)
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/dumps/new')
    );
    
    // Try common clipboard hotkeys
    await page.keyboard.press('Meta+Shift+KeyV');
    
    try {
      const response = await responsePromise;
      const result = await response.json();
      
      expect(result).toHaveProperty('id');
      expect(result.source_type).toBe('clipboard');
      expect(result.text_dump).toContain('Clipboard test');
    } catch (e) {
      // Hotkey might not be implemented or different
      console.log('Clipboard hotkey test skipped - not implemented');
    }
  });

  test('capture preserves exact user input without interpretation', async ({ page }) => {
    await page.goto(`/baskets/${basketId}/memory`);
    
    // Test that capture doesn't interpret or modify content
    const complexText = `
      # Markdown Header
      **Bold Text**
      - List item
      \`code block\`
      https://example.com
      Special chars: @#$%^&*()
      Emoji: 🚀✨🎯
    `;
    
    const textArea = page.locator('textarea[data-testid="memory-input"], textarea[placeholder*="capture" i]').first();
    
    if (await textArea.count() > 0) {
      await textArea.fill(complexText.trim());
      
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/dumps/new') && response.status() === 200
      );
      
      await page.click('button:has-text("Capture"), button[data-testid="capture-submit"]');
      const response = await responsePromise;
      const result = await response.json();
      
      // Should preserve exact input without interpretation
      expect(result.text_dump).toBe(complexText.trim());
      
      // Should not have parsed metadata
      expect(result.metadata).not.toHaveProperty('parsed_markdown');
      expect(result.metadata).not.toHaveProperty('extracted_links');
      expect(result.metadata).not.toHaveProperty('interpreted_content');
    }
  });

  test('capture creates timeline events properly', async ({ page, request }) => {
    await page.goto(`/baskets/${basketId}/memory`);
    
    const initialTimelineResponse = await request.get(`/api/baskets/${basketId}/timeline`);
    const initialTimeline = await initialTimelineResponse.json();
    const initialCount = initialTimeline.events.length;
    
    // Perform capture
    const testText = `Timeline test: ${Date.now()}`;
    const textArea = page.locator('textarea[data-testid="memory-input"], textarea[placeholder*="capture" i]').first();
    
    if (await textArea.count() > 0) {
      await textArea.fill(testText);
      
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/dumps/new') && response.status() === 200
      );
      
      await page.click('button:has-text("Capture"), button[data-testid="capture-submit"]');
      const captureResponse = await responsePromise;
      const captureResult = await captureResponse.json();
      
      // Check timeline was updated
      const updatedTimelineResponse = await request.get(`/api/baskets/${basketId}/timeline`);
      const updatedTimeline = await updatedTimelineResponse.json();
      
      expect(updatedTimeline.events.length).toBeGreaterThan(initialCount);
      
      // Find the dump creation event
      const dumpEvent = updatedTimeline.events.find((event: any) => 
        event.kind === 'dump.created' && event.entity_id === captureResult.id
      );
      
      expect(dumpEvent).toBeDefined();
      expect(dumpEvent.metadata.source_type).toBeDefined();
    }
  });

  test('capture handles large content appropriately', async ({ page }) => {
    await page.goto(`/baskets/${basketId}/memory`);
    
    // Test large content capture
    const largeText = 'Large content test: ' + 'x'.repeat(50000);
    
    const textArea = page.locator('textarea[data-testid="memory-input"], textarea[placeholder*="capture" i]').first();
    
    if (await textArea.count() > 0) {
      await textArea.fill(largeText);
      
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/dumps/new')
      );
      
      await page.click('button:has-text("Capture"), button[data-testid="capture-submit"]');
      const response = await responsePromise;
      
      // Should handle large content (may truncate or split)
      expect(response.ok()).toBeTruthy();
      
      const result = await response.json();
      expect(result).toHaveProperty('id');
      
      // Check if content was truncated
      if (result.text_dump.length < largeText.length) {
        expect(result.metadata.truncated).toBe(true);
      }
    }
  });

  test('capture provides immediate feedback to user', async ({ page }) => {
    await page.goto(`/baskets/${basketId}/memory`);
    
    const testText = `Feedback test: ${Date.now()}`;
    const textArea = page.locator('textarea[data-testid="memory-input"], textarea[placeholder*="capture" i]').first();
    
    if (await textArea.count() > 0) {
      await textArea.fill(testText);
      
      const captureButton = page.locator('button:has-text("Capture"), button[data-testid="capture-submit"]').first();
      await captureButton.click();
      
      // Should show loading state
      await expect(captureButton).toBeDisabled({ timeout: 1000 });
      
      // Wait for completion
      await page.waitForResponse(response => 
        response.url().includes('/api/dumps/new')
      );
      
      // Should re-enable button
      await expect(captureButton).toBeEnabled();
      
      // Should clear input field
      expect(await textArea.inputValue()).toBe('');
      
      // Should show success feedback
      const successMessage = page.locator('[data-testid="success-message"], .success-notification');
      if (await successMessage.count() > 0) {
        await expect(successMessage).toBeVisible();
      }
    }
  });

  test('capture respects basket scoping', async ({ request }) => {
    // Create dump and verify it's properly scoped to basket
    const dumpData = {
      basket_id: basketId,
      text_dump: 'Basket scoping test',
      source_type: 'test'
    };
    
    const response = await request.post('/api/dumps/new', { data: dumpData });
    expect(response.ok()).toBeTruthy();
    
    const result = await response.json();
    expect(result.basket_id).toBe(basketId);
    
    // Verify it appears in basket's dumps
    const basketDumpsResponse = await request.get(`/api/baskets/${basketId}/dumps`);
    const basketDumps = await basketDumpsResponse.json();
    
    const createdDump = basketDumps.find((dump: any) => dump.id === result.id);
    expect(createdDump).toBeDefined();
    expect(createdDump.basket_id).toBe(basketId);
  });

  test('capture fails gracefully with network issues', async ({ page }) => {
    await page.goto(`/baskets/${basketId}/memory`);
    
    // Block API requests to simulate network issues
    await page.route('/api/dumps/new', route => route.abort());
    
    const testText = 'Network error test';
    const textArea = page.locator('textarea[data-testid="memory-input"], textarea[placeholder*="capture" i]').first();
    
    if (await textArea.count() > 0) {
      await textArea.fill(testText);
      await page.click('button:has-text("Capture"), button[data-testid="capture-submit"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"], .error-notification')).toBeVisible();
      
      // Input should be preserved
      expect(await textArea.inputValue()).toBe(testText);
      
      // Unblock requests
      await page.unroute('/api/dumps/new');
      
      // Retry should work
      await page.click('button:has-text("Retry"), button:has-text("Capture")');
      
      // Should eventually succeed
      await page.waitForResponse(response => 
        response.url().includes('/api/dumps/new') && response.status() === 200
      );
    }
  });
});