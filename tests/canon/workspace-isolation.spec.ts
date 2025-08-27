import { test, expect } from '@playwright/test';

/**
 * [CANON] Workspace Isolation Tests
 * 
 * Validates that workspace-scoped security is enforced via RLS policies
 * and that users can only access data within their workspace.
 */

test.describe('[CANON] Workspace Isolation', () => {
  const testWorkspaceId = '00000000-0000-0000-0000-000000000002';
  const testBasketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';

  test('RLS policies prevent cross-workspace data access', async ({ request }) => {
    // These tests assume we have test data in multiple workspaces
    
    // Attempt to access basket from different workspace should fail
    const otherWorkspaceBasket = '99999999-9999-9999-9999-999999999999';
    
    const basketResponse = await request.get(`/api/baskets/${otherWorkspaceBasket}`);
    expect([403, 404]).toContain(basketResponse.status());
    
    // Attempt to access dumps from different workspace
    const dumpResponse = await request.get(`/api/baskets/${otherWorkspaceBasket}/dumps`);
    expect([403, 404]).toContain(dumpResponse.status());
    
    // Attempt to access blocks from different workspace
    const blockResponse = await request.get(`/api/baskets/${otherWorkspaceBasket}/blocks`);
    expect([403, 404]).toContain(blockResponse.status());
  });

  test('workspace resolution creates single authoritative workspace', async ({ page, request }) => {
    // Navigate to home - should resolve to user's workspace
    await page.goto('/');
    
    // Should be redirected to a basket within user's workspace
    await expect(page).toHaveURL(/\/baskets\/[a-f0-9-]+\/(memory|timeline)/);
    
    const url = page.url();
    const basketMatch = url.match(/\/baskets\/([a-f0-9-]+)\//);
    
    if (basketMatch) {
      const basketId = basketMatch[1];
      
      // Verify this basket belongs to test workspace
      const basketResponse = await request.get(`/api/baskets/${basketId}`);
      expect(basketResponse.ok()).toBeTruthy();
      
      const basket = await basketResponse.json();
      expect(basket.workspace_id).toBe(testWorkspaceId);
    }
  });

  test('all workspace-scoped tables enforce RLS', async ({ request }) => {
    // Test key workspace-scoped tables
    const tables = [
      { endpoint: `/api/baskets/${testBasketId}`, resource: 'basket' },
      { endpoint: `/api/baskets/${testBasketId}/dumps`, resource: 'dumps' },
      { endpoint: `/api/baskets/${testBasketId}/blocks`, resource: 'blocks' },
      { endpoint: `/api/baskets/${testBasketId}/documents`, resource: 'documents' },
      { endpoint: `/api/baskets/${testBasketId}/timeline`, resource: 'timeline' }
    ];

    for (const table of tables) {
      const response = await request.get(table.endpoint);
      expect(response.ok()).toBeTruthy();
      
      if (response.ok()) {
        const data = await response.json();
        
        // All returned data should belong to test workspace
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item.workspace_id) {
              expect(item.workspace_id).toBe(testWorkspaceId);
            }
          }
        } else if (data.workspace_id) {
          expect(data.workspace_id).toBe(testWorkspaceId);
        }
      }
    }
  });

  test('create operations respect workspace scoping', async ({ request }) => {
    // Create new resources - should automatically be scoped to user's workspace
    
    // Create dump
    const dumpResponse = await request.post('/api/dumps/new', {
      data: {
        basket_id: testBasketId,
        text_dump: 'Workspace isolation test'
      }
    });
    
    if (dumpResponse.ok()) {
      const dump = await dumpResponse.json();
      expect(dump.workspace_id).toBe(testWorkspaceId);
    }

    // Create block
    const blockResponse = await request.post('/api/blocks', {
      data: {
        basket_id: testBasketId,
        title: 'Test Block',
        content: 'Workspace test content'
      }
    });
    
    if (blockResponse.ok()) {
      const block = await blockResponse.json();
      expect(block.workspace_id).toBe(testWorkspaceId);
    }

    // Create document
    const docResponse = await request.post(`/api/baskets/${testBasketId}/documents`, {
      data: {
        title: 'Test Document'
      }
    });
    
    if (docResponse.ok()) {
      const doc = await docResponse.json();
      // Document workspace is inherited from basket
      const basketResponse = await request.get(`/api/baskets/${testBasketId}`);
      const basket = await basketResponse.json();
      expect(basket.workspace_id).toBe(testWorkspaceId);
    }
  });

  test('user cannot manipulate workspace_id in requests', async ({ request }) => {
    // Attempt to create resource with different workspace_id
    const maliciousResponse = await request.post('/api/dumps/new', {
      data: {
        basket_id: testBasketId,
        workspace_id: '99999999-9999-9999-9999-999999999999', // Different workspace
        text_dump: 'Malicious request'
      }
    });
    
    if (maliciousResponse.ok()) {
      const result = await maliciousResponse.json();
      // Should ignore provided workspace_id and use authenticated user's workspace
      expect(result.workspace_id).toBe(testWorkspaceId);
    }
  });

  test('search and filtering respect workspace boundaries', async ({ page }) => {
    await page.goto(`/baskets/${testBasketId}/memory`);
    
    // Search should only return results from current workspace
    await page.fill('input[placeholder*="search" i]', 'test');
    await page.keyboard.press('Enter');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // All visible results should be from current workspace
    const resultCards = await page.locator('[data-testid="search-result"], .search-result-card').all();
    
    for (const card of resultCards) {
      // Verify no cross-workspace leakage in results
      const dataAttributes = await card.evaluate(el => ({
        workspaceId: el.getAttribute('data-workspace-id'),
        basketId: el.getAttribute('data-basket-id')
      }));
      
      if (dataAttributes.workspaceId) {
        expect(dataAttributes.workspaceId).toBe(testWorkspaceId);
      }
    }
  });

  test('timeline events are workspace-scoped', async ({ page, request }) => {
    await page.goto(`/baskets/${testBasketId}/timeline`);
    
    // Timeline should only show events from current workspace
    const timelineResponse = await request.get(`/api/baskets/${testBasketId}/timeline`);
    
    if (timelineResponse.ok()) {
      const timeline = await timelineResponse.json();
      
      for (const event of timeline.events) {
        // All events should be associated with current workspace
        expect(event.workspace_id).toBe(testWorkspaceId);
      }
    }
  });

  test('reflections are workspace-isolated', async ({ page }) => {
    await page.goto(`/baskets/${testBasketId}/memory`);
    
    // Reflections computed from workspace data only
    const reflectionElements = await page.locator('[data-testid="reflection-item"], .reflection-card').all();
    
    for (const reflection of reflectionElements) {
      // Reflections should not contain data from other workspaces
      const content = await reflection.textContent();
      expect(content).not.toContain('Cross-Workspace-Marker');
    }
  });
});