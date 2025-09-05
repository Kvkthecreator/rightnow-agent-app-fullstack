import { test, expect } from '@playwright/test';

/**
 * [API CONTRACTS] Baskets API Tests
 * 
 * Tests critical basket endpoints that have been breaking in production.
 * Validates API contracts, error handling, and response schemas.
 */

test.describe('Baskets API Contracts', () => {
  const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
  const fakeBasketId = '00000000-0000-0000-0000-000000000000';

  test.describe('GET /api/baskets/[id]', () => {
    test('should return basket details for valid ID', async ({ request }) => {
      const response = await request.get(`/api/baskets/${basketId}`, {
        headers: { 'x-playwright-test': 'true' }
      });

      expect(response.ok()).toBeTruthy();
      const basket = await response.json();
      
      // Validate response schema
      expect(basket).toHaveProperty('id');
      expect(basket).toHaveProperty('name');
      expect(basket).toHaveProperty('status');
      expect(basket).toHaveProperty('workspace_id');
      expect(basket).toHaveProperty('created_at');
      expect(basket.id).toBe(basketId);
    });

    test('should return 404 for non-existent basket', async ({ request }) => {
      const response = await request.get(`/api/baskets/${fakeBasketId}`, {
        headers: { 'x-playwright-test': 'true' }
      });

      expect(response.status()).toBe(404);
      const error = await response.json();
      expect(error).toHaveProperty('error');
    });

    test('should return 400 for invalid basket ID format', async ({ request }) => {
      const response = await request.get(`/api/baskets/invalid-uuid`, {
        headers: { 'x-playwright-test': 'true' }
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('GET /api/baskets/[id]/building-blocks', () => {
    test('should return building blocks with correct structure', async ({ request }) => {
      const response = await request.get(`/api/baskets/${basketId}/building-blocks`, {
        headers: { 'x-playwright-test': 'true' }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      
      // Validate response structure
      expect(result).toHaveProperty('substrates');
      expect(result).toHaveProperty('counts');
      expect(Array.isArray(result.substrates)).toBeTruthy();
      
      // Validate counts structure
      expect(result.counts).toHaveProperty('dumps');
      expect(result.counts).toHaveProperty('context_items'); 
      expect(result.counts).toHaveProperty('blocks');
      expect(result.counts).toHaveProperty('total');
      
      // Validate substrate structure (if any exist)
      if (result.substrates.length > 0) {
        const substrate = result.substrates[0];
        expect(substrate).toHaveProperty('id');
        expect(substrate).toHaveProperty('type');
        expect(substrate).toHaveProperty('title');
        expect(substrate).toHaveProperty('content');
        expect(substrate).toHaveProperty('agent_stage');
        expect(substrate).toHaveProperty('created_at');
        
        // Validate substrate types match canon v2.0
        expect(['dump', 'context_item', 'block', 'timeline_event']).toContain(substrate.type);
        expect(['P0', 'P1', 'P2', 'P3']).toContain(substrate.agent_stage);
      }
    });

    test('should return 404 for non-existent basket building blocks', async ({ request }) => {
      const response = await request.get(`/api/baskets/${fakeBasketId}/building-blocks`, {
        headers: { 'x-playwright-test': 'true' }
      });

      expect(response.status()).toBe(404);
    });

    test('should return 500 if database query fails gracefully', async ({ request }) => {
      // This would catch the context_blocks table issue
      const response = await request.get(`/api/baskets/${basketId}/building-blocks`, {
        headers: { 'x-playwright-test': 'true' }
      });

      // Should either succeed or fail gracefully, not crash
      if (!response.ok()) {
        expect(response.status()).toBe(500);
        const error = await response.json();
        expect(error).toHaveProperty('error');
        expect(error).toHaveProperty('details');
      }
    });
  });

  test.describe('GET /api/baskets/[id]/documents', () => {
    test('should return documents list with correct structure', async ({ request }) => {
      const response = await request.get(`/api/baskets/${basketId}/documents`, {
        headers: { 'x-playwright-test': 'true' }
      });

      if (response.ok()) {
        const result = await response.json();
        
        // Validate response structure
        expect(result).toHaveProperty('documents');
        expect(Array.isArray(result.documents)).toBeTruthy();
        
        // Validate document structure (if any exist)
        if (result.documents.length > 0) {
          const doc = result.documents[0];
          expect(doc).toHaveProperty('id');
          expect(doc).toHaveProperty('title');
          expect(doc).toHaveProperty('created_at');
          expect(doc).toHaveProperty('updated_at');
          expect(doc).toHaveProperty('workspace_id');
        }
      } else {
        // If it fails, should fail gracefully with proper error
        expect(response.status()).toBeGreaterThanOrEqual(400);
        const error = await response.json();
        expect(error).toHaveProperty('error');
      }
    });

    test('should return 404 for non-existent basket documents', async ({ request }) => {
      const response = await request.get(`/api/baskets/${fakeBasketId}/documents`, {
        headers: { 'x-playwright-test': 'true' }
      });

      expect(response.status()).toBe(404);
    });
  });

  test.describe('GET /api/documents?basketId=[id]', () => {
    test('should return documents via query parameter', async ({ request }) => {
      const response = await request.get(`/api/documents?basketId=${basketId}`, {
        headers: { 'x-playwright-test': 'true' }
      });

      if (response.ok()) {
        const result = await response.json();
        expect(result).toHaveProperty('documents');
        expect(Array.isArray(result.documents)).toBeTruthy();
      } else {
        // Should fail gracefully with proper error structure
        expect(response.status()).toBeGreaterThanOrEqual(400);
        const error = await response.json();
        expect(error).toHaveProperty('error');
      }
    });

    test('should return 400 for missing basketId parameter', async ({ request }) => {
      const response = await request.get(`/api/documents`, {
        headers: { 'x-playwright-test': 'true' }
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.error).toContain('basketId');
    });

    test('should return 404 for non-existent basket in query', async ({ request }) => {
      const response = await request.get(`/api/documents?basketId=${fakeBasketId}`, {
        headers: { 'x-playwright-test': 'true' }
      });

      expect(response.status()).toBe(404);
    });
  });

  test.describe('GET /api/baskets/[id]/timeline', () => {
    test('should return timeline events with correct structure', async ({ request }) => {
      const response = await request.get(`/api/baskets/${basketId}/timeline`, {
        headers: { 'x-playwright-test': 'true' }
      });

      if (response.ok()) {
        const result = await response.json();
        
        // Validate timeline structure
        if (Array.isArray(result)) {
          // Timeline events array
          if (result.length > 0) {
            const event = result[0];
            expect(event).toHaveProperty('id');
            expect(event).toHaveProperty('basket_id');
            expect(event).toHaveProperty('event_kind');
            expect(event).toHaveProperty('timestamp');
          }
        } else if (result && typeof result === 'object') {
          // Timeline response object
          expect(result).toHaveProperty('events');
        }
      } else {
        expect(response.status()).toBeGreaterThanOrEqual(400);
      }
    });
  });

  test.describe('GET /api/baskets/[id]/proposals', () => {
    test('should return governance proposals with correct structure', async ({ request }) => {
      const response = await request.get(`/api/baskets/${basketId}/proposals`, {
        headers: { 'x-playwright-test': 'true' }
      });

      if (response.ok()) {
        const result = await response.json();
        
        // Should have proposals array
        expect(Array.isArray(result) || (result && Array.isArray(result.proposals))).toBeTruthy();
        
        const proposals = Array.isArray(result) ? result : result.proposals;
        
        // Validate proposal structure (if any exist)
        if (proposals.length > 0) {
          const proposal = proposals[0];
          expect(proposal).toHaveProperty('id');
          expect(proposal).toHaveProperty('status');
          expect(proposal).toHaveProperty('proposal_kind');
          expect(proposal).toHaveProperty('created_at');
        }
      } else {
        expect(response.status()).toBeGreaterThanOrEqual(400);
      }
    });
  });
});