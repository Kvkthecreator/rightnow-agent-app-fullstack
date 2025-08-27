import { test, expect } from '@playwright/test';

/**
 * [FEATURE] Dump Immutability Tests
 * 
 * Tests the immutability principle: raw_dumps are permanent memory records
 * that cannot be modified after creation.
 */

test.describe('[FEATURE] Dump Immutability', () => {
  const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';

  test('dumps cannot be modified after creation', async ({ request }) => {
    // Create a test dump
    const dumpData = {
      basket_id: basketId,
      text_dump: 'Immutable test dump',
      source_type: 'test'
    };
    
    const createResponse = await request.post('/api/dumps/new', { data: dumpData });
    expect(createResponse.ok()).toBeTruthy();
    
    const dump = await createResponse.json();
    
    // Attempt to modify the dump
    const modifyResponse = await request.patch(`/api/dumps/${dump.id}`, {
      data: { text_dump: 'Modified content' }
    });
    
    // Should reject modification attempts
    expect([404, 405, 403]).toContain(modifyResponse.status());
  });

  test('dumps cannot be deleted', async ({ request }) => {
    // Create a test dump
    const dumpData = {
      basket_id: basketId,
      text_dump: 'Deletion test dump',
      source_type: 'test'
    };
    
    const createResponse = await request.post('/api/dumps/new', { data: dumpData });
    const dump = await createResponse.json();
    
    // Attempt to delete the dump
    const deleteResponse = await request.delete(`/api/dumps/${dump.id}`);
    
    // Should reject deletion attempts
    expect([404, 405, 403]).toContain(deleteResponse.status());
    
    // Verify dump still exists
    const getResponse = await request.get(`/api/dumps/${dump.id}`);
    expect(getResponse.ok()).toBeTruthy();
  });

  test('dump metadata is also immutable', async ({ request }) => {
    const dumpData = {
      basket_id: basketId,
      text_dump: 'Metadata test',
      source_type: 'test',
      metadata: { original: 'value' }
    };
    
    const createResponse = await request.post('/api/dumps/new', { data: dumpData });
    const dump = await createResponse.json();
    
    // Attempt to modify metadata
    const modifyResponse = await request.patch(`/api/dumps/${dump.id}`, {
      data: { 
        metadata: { 
          original: 'modified',
          new_field: 'added'
        }
      }
    });
    
    expect([404, 405, 403]).toContain(modifyResponse.status());
  });

  test('UI does not provide edit/delete options for dumps', async ({ page }) => {
    await page.goto(`/baskets/${basketId}/memory`);
    
    // Look for dump display elements
    const dumpElements = await page.locator('[data-testid="dump-item"], .dump-card, .memory-item').all();
    
    for (const dumpElement of dumpElements.slice(0, 3)) { // Check first 3
      // Should not have edit buttons
      const editButtons = dumpElement.locator('button:has-text("Edit"), [data-testid="edit-dump"]');
      await expect(editButtons).toHaveCount(0);
      
      // Should not have delete buttons
      const deleteButtons = dumpElement.locator('button:has-text("Delete"), [data-testid="delete-dump"]');
      await expect(deleteButtons).toHaveCount(0);
      
      // Should not have contenteditable attributes
      const editableContent = dumpElement.locator('[contenteditable="true"]');
      await expect(editableContent).toHaveCount(0);
    }
  });

  test('dump timestamps show immutability', async ({ request }) => {
    const dumpData = {
      basket_id: basketId,
      text_dump: 'Timestamp test',
      source_type: 'test'
    };
    
    const createResponse = await request.post('/api/dumps/new', { data: dumpData });
    const dump = await createResponse.json();
    
    // created_at and updated_at should be identical for immutable dumps
    expect(dump.created_at).toBe(dump.updated_at);
    
    // Wait and retrieve again to ensure no automatic updates
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const getResponse = await request.get(`/api/dumps/${dump.id}`);
    const retrievedDump = await getResponse.json();
    
    expect(retrievedDump.created_at).toBe(retrievedDump.updated_at);
    expect(retrievedDump.updated_at).toBe(dump.updated_at);
  });

  test('dump evolution happens through new substrate creation', async ({ page, request }) => {
    await page.goto(`/baskets/${basketId}/memory`);
    
    // Create initial dump
    const initialText = 'Evolution test - original thought';
    const textArea = page.locator('textarea[data-testid="memory-input"], textarea[placeholder*="capture" i]').first();
    
    if (await textArea.count() > 0) {
      await textArea.fill(initialText);
      
      const dumpResponsePromise = page.waitForResponse(response => 
        response.url().includes('/api/dumps/new') && response.status() === 200
      );
      
      await page.click('button:has-text("Capture")');
      const dumpResponse = await dumpResponsePromise;
      const originalDump = await dumpResponse.json();
      
      // Create evolved thought as new dump
      const evolvedText = 'Evolution test - refined thought building on original';
      await textArea.fill(evolvedText);
      await page.click('button:has-text("Capture")');
      
      await page.waitForResponse(response => 
        response.url().includes('/api/dumps/new') && response.status() === 200
      );
      
      // Both dumps should exist independently
      const dump1Response = await request.get(`/api/dumps/${originalDump.id}`);
      expect(dump1Response.ok()).toBeTruthy();
      
      const dump1 = await dump1Response.json();
      expect(dump1.text_dump).toBe(initialText);
      
      // Check that both dumps exist in basket
      const basketDumpsResponse = await request.get(`/api/baskets/${basketId}/dumps`);
      const basketDumps = await basketDumpsResponse.json();
      
      const originalFound = basketDumps.some((d: any) => d.text_dump === initialText);
      const evolvedFound = basketDumps.some((d: any) => d.text_dump === evolvedText);
      
      expect(originalFound).toBe(true);
      expect(evolvedFound).toBe(true);
    }
  });

  test('immutability preserved even with admin/system operations', async ({ request }) => {
    // Even system-level operations should respect dump immutability
    const dumpData = {
      basket_id: basketId,
      text_dump: 'System operation test',
      source_type: 'test'
    };
    
    const createResponse = await request.post('/api/dumps/new', { data: dumpData });
    const dump = await createResponse.json();
    
    // Attempt system-level modification (would require admin keys)
    const systemModifyResponse = await request.patch(`/api/admin/dumps/${dump.id}`, {
      data: { text_dump: 'System modified' },
      headers: { 'x-admin-key': 'test-key' }
    });
    
    // Should still reject even admin modifications
    expect([404, 405, 403, 401]).toContain(systemModifyResponse.status());
  });

  test('dump content integrity is maintained', async ({ request }) => {
    const originalContent = `
      Multi-line content test
      With special characters: !@#$%^&*()
      Unicode: 🚀 ✨ 🎯
      Line breaks and spaces should be preserved exactly
    `;
    
    const dumpData = {
      basket_id: basketId,
      text_dump: originalContent,
      source_type: 'test'
    };
    
    const createResponse = await request.post('/api/dumps/new', { data: dumpData });
    const dump = await createResponse.json();
    
    // Retrieve multiple times to ensure consistency
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const getResponse = await request.get(`/api/dumps/${dump.id}`);
      const retrievedDump = await getResponse.json();
      
      // Content should be identical every time
      expect(retrievedDump.text_dump).toBe(originalContent);
      expect(retrievedDump.id).toBe(dump.id);
      expect(retrievedDump.created_at).toBe(dump.created_at);
    }
  });

  test('immutability extends to file dumps', async ({ request }) => {
    // Test file dump immutability
    const dumpData = {
      basket_id: basketId,
      file_url: 'https://example.com/test.pdf',
      source_type: 'file',
      metadata: {
        filename: 'test.pdf',
        mime_type: 'application/pdf',
        file_size: 12345
      }
    };
    
    const createResponse = await request.post('/api/dumps/new', { data: dumpData });
    const dump = await createResponse.json();
    
    // Attempt to modify file metadata
    const modifyResponse = await request.patch(`/api/dumps/${dump.id}`, {
      data: { 
        file_url: 'https://example.com/modified.pdf',
        metadata: { filename: 'modified.pdf' }
      }
    });
    
    expect([404, 405, 403]).toContain(modifyResponse.status());
    
    // Verify original file data preserved
    const getResponse = await request.get(`/api/dumps/${dump.id}`);
    const retrievedDump = await getResponse.json();
    
    expect(retrievedDump.file_url).toBe('https://example.com/test.pdf');
    expect(retrievedDump.metadata.filename).toBe('test.pdf');
  });

  test('bulk operations cannot modify dumps', async ({ request }) => {
    // Test that even bulk operations respect immutability
    
    // Get some existing dumps
    const dumpsResponse = await request.get(`/api/baskets/${basketId}/dumps?limit=3`);
    const dumps = await dumpsResponse.json();
    
    if (dumps.length > 0) {
      const dumpIds = dumps.slice(0, 2).map((d: any) => d.id);
      
      // Attempt bulk modification
      const bulkModifyResponse = await request.patch('/api/dumps/bulk', {
        data: {
          ids: dumpIds,
          updates: { text_dump: 'Bulk modified' }
        }
      });
      
      expect([404, 405, 403]).toContain(bulkModifyResponse.status());
      
      // Verify individual dumps unchanged
      for (const id of dumpIds) {
        const checkResponse = await request.get(`/api/dumps/${id}`);
        const dump = await checkResponse.json();
        
        const original = dumps.find((d: any) => d.id === id);
        expect(dump.text_dump).toBe(original.text_dump);
      }
    }
  });
});