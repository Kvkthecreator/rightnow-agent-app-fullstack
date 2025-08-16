import { test, expect } from '@playwright/test';

/**
 * Golden Path E2E Test: Interface Spec v0.1.0 Compliance
 * Tests: Create basket → upload 2 files + add 1 text → reload 3x → 1 basket, 3 dumps, 0 duplicates
 */
test.describe('Idempotency Golden Path', () => {
  test('Create basket with files and text, verify no duplicates on reload', async ({ page }) => {
    // Navigate to create page
    await page.goto('/create');
    
    // Add intent (will become text dump)
    await page.fill('[data-testid="intent-field"]', 'Test project for Interface Spec v0.1.0');
    
    // Add one text note
    await page.fill('textarea[placeholder="Write a note"]', 'This is a test note for idempotency validation');
    await page.click('button:has-text("Add note")');
    
    // Mock file uploads (2 files)
    const fileContent1 = 'Mock PDF content for file 1';
    const fileContent2 = 'Mock text content for file 2';
    
    // Create mock files
    const file1 = new File([fileContent1], 'test-doc-1.pdf', { type: 'application/pdf' });
    const file2 = new File([fileContent2], 'test-doc-2.txt', { type: 'text/plain' });
    
    // Upload files via drop zone
    const dropZone = page.locator('[data-testid="drop-zone"]').first();
    const fileInput = dropZone.locator('input[type="file"]');
    
    await fileInput.setInputFiles([
      { name: 'test-doc-1.pdf', mimeType: 'application/pdf', buffer: Buffer.from(fileContent1) },
      { name: 'test-doc-2.txt', mimeType: 'text/plain', buffer: Buffer.from(fileContent2) }
    ]);
    
    // Wait for files to be processed
    await expect(page.locator('[data-testid="added-item"]')).toHaveCount(3); // 1 note + 2 files
    
    // Verify pre-generation state
    await expect(page.locator('text=3 added')).toBeVisible();
    
    // Generate basket (first time)
    await page.click('button:has-text("Generate Basket")');
    
    // Wait for completion and navigation
    await expect(page).toHaveURL(/\/baskets\/[^\/]+\/work/);
    
    // Extract basket ID from URL for verification
    const url = page.url();
    const basketId = url.match(/\/baskets\/([^\/]+)\/work/)?.[1];
    expect(basketId).toBeTruthy();
    
    // Verify initial creation counts in database
    const initialCounts = await page.evaluate(async (basketId) => {
      const basketRes = await fetch(`/api/baskets/${basketId}/deltas`);
      const basketData = await basketRes.json();
      
      const dumpsRes = await fetch(`/api/dumps?basket_id=${basketId}`);
      const dumpsData = await dumpsRes.json();
      
      return {
        baskets: basketData.length > 0 ? 1 : 0,
        dumps: dumpsData.length || 0
      };
    }, basketId);
    
    // Should have exactly 1 basket and 3 dumps (1 text + 2 files)
    expect(initialCounts.baskets).toBe(1);
    expect(initialCounts.dumps).toBe(3);
    
    // Test idempotency: reload page multiple times
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify counts remain the same
      const reloadCounts = await page.evaluate(async (basketId) => {
        const basketRes = await fetch(`/api/baskets/${basketId}/deltas`);
        const basketData = await basketRes.json();
        
        const dumpsRes = await fetch(`/api/dumps?basket_id=${basketId}`);
        const dumpsData = await dumpsRes.json();
        
        return {
          baskets: basketData.length > 0 ? 1 : 0,
          dumps: dumpsData.length || 0
        };
      }, basketId);
      
      expect(reloadCounts.baskets).toBe(1);
      expect(reloadCounts.dumps).toBe(3);
    }
    
    // Verify no duplicate dumps were created
    const finalCounts = await page.evaluate(async (basketId) => {
      // Check for any duplicate dump_request_ids
      const dumpsRes = await fetch(`/api/dumps?basket_id=${basketId}`);
      const dumpsData = await dumpsRes.json();
      
      const dumpRequestIds = dumpsData.map((dump: any) => dump.dump_request_id).filter(Boolean);
      const uniqueRequestIds = new Set(dumpRequestIds);
      
      return {
        totalDumps: dumpsData.length,
        uniqueRequestIds: uniqueRequestIds.size,
        hasDuplicates: dumpRequestIds.length !== uniqueRequestIds.size
      };
    }, basketId);
    
    expect(finalCounts.totalDumps).toBe(3);
    expect(finalCounts.uniqueRequestIds).toBe(3);
    expect(finalCounts.hasDuplicates).toBe(false);
  });
  
  test('Verify API error handling for invalid idempotency keys', async ({ page }) => {
    // Test basket creation with invalid idempotency_key
    const invalidBasketResponse = await page.evaluate(async () => {
      return await fetch('/api/baskets/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: 'Test Basket',
          idempotency_key: 'invalid-uuid'
        })
      }).then(res => ({ status: res.status, body: res.json() }));
    });
    
    expect(invalidBasketResponse.status).toBe(400);
    
    // Test dump creation with invalid dump_request_id
    const invalidDumpResponse = await page.evaluate(async () => {
      return await fetch('/api/dumps/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          basket_id: '00000000-0000-0000-0000-000000000001',
          dump_request_id: 'invalid-uuid',
          text_dump: 'Test content'
        })
      }).then(res => ({ status: res.status, body: res.json() }));
    });
    
    expect(invalidDumpResponse.status).toBe(400);
  });
  
  test('Verify structured logging for created/replayed actions', async ({ page }) => {
    // This test would require access to server logs, so we'll test the API behavior instead
    
    // Create a basket with known idempotency key
    const idempotencyKey = crypto.randomUUID();

    const firstRequest = await page.evaluate(async (data) => {
      return await fetch('/api/baskets/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      }).then(res => ({ status: res.status, body: res.json() }));
    }, { name: 'Test Basket', idempotency_key: idempotencyKey });
    
    expect(firstRequest.status).toBe(201); // Created
    
    // Replay the same request
    const replayRequest = await page.evaluate(async (data) => {
      return await fetch('/api/baskets/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      }).then(res => ({ status: res.status, body: res.json() }));
    }, { name: 'Test Basket', idempotency_key: idempotencyKey });
    
    expect(replayRequest.status).toBe(200); // Replayed
    
    // Verify same basket_id returned
    const firstBody = await firstRequest.body;
    const replayBody = await replayRequest.body;
    expect(firstBody.basket_id).toBe(replayBody.basket_id);
  });
});