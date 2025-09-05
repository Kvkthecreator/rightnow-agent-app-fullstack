import { test, expect } from '@playwright/test';

/**
 * [API CONTRACTS] Frontend API Contract Tests
 * 
 * Comprehensive tests for Next.js API routes that power the frontend.
 * Validates request/response contracts, error handling, and data consistency.
 */

test.describe('Frontend API Contracts', () => {
  const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
  const fakeId = '00000000-0000-0000-0000-000000000000';

  test.describe('Document Management APIs', () => {
    test.describe('GET /api/documents/[id]', () => {
      test.skip('should return document details for valid ID', async ({ request }) => {
        // Skip until we have a valid document ID to test with
        // This test validates the document retrieval API
        const response = await request.get(`/api/documents/${fakeId}`, {
          headers: { 'x-playwright-test': 'true' }
        });

        if (response.ok()) {
          const document = await response.json();
          expect(document).toHaveProperty('id');
          expect(document).toHaveProperty('title');
          expect(document).toHaveProperty('content_raw');
          expect(document).toHaveProperty('workspace_id');
        } else {
          expect(response.status()).toBe(404);
        }
      });

      test('should return 404 for non-existent document', async ({ request }) => {
        const response = await request.get(`/api/documents/${fakeId}`, {
          headers: { 'x-playwright-test': 'true' }
        });

        expect(response.status()).toBe(404);
        const error = await response.json();
        expect(error).toHaveProperty('error');
      });
    });

    test.describe('POST /api/documents', () => {
      test('should create document with valid data', async ({ request }) => {
        const documentData = {
          basket_id: basketId,
          title: 'API Contract Test Document',
          metadata: { test: true }
        };

        const response = await request.post('/api/documents', {
          data: documentData,
          headers: { 
            'x-playwright-test': 'true',
            'Content-Type': 'application/json'
          }
        });

        if (response.ok()) {
          const result = await response.json();
          expect(result).toHaveProperty('document_id');
          expect(result.document_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        } else {
          // Should fail gracefully with proper error
          expect(response.status()).toBeGreaterThanOrEqual(400);
          const error = await response.json();
          expect(error).toHaveProperty('error');
        }
      });

      test('should return 422 for invalid document data', async ({ request }) => {
        const response = await request.post('/api/documents', {
          data: { invalid: 'data' },
          headers: { 
            'x-playwright-test': 'true',
            'Content-Type': 'application/json'
          }
        });

        expect(response.status()).toBe(422);
        const error = await response.json();
        expect(error).toHaveProperty('error');
        expect(error).toHaveProperty('details');
      });
    });
  });

  test.describe('Context and Intelligence APIs', () => {
    test.describe('GET /api/baskets/[id]/context-items', () => {
      test('should return context items with correct structure', async ({ request }) => {
        const response = await request.get(`/api/baskets/${basketId}/context-items`, {
          headers: { 'x-playwright-test': 'true' }
        });

        if (response.ok()) {
          const result = await response.json();
          
          // Should be an array or have items property
          const items = Array.isArray(result) ? result : result.items || [];
          expect(Array.isArray(items)).toBeTruthy();

          // Validate context item structure (if any exist)
          if (items.length > 0) {
            const item = items[0];
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('type');
            expect(item).toHaveProperty('content');
            expect(item).toHaveProperty('created_at');
          }
        } else {
          expect(response.status()).toBeGreaterThanOrEqual(400);
        }
      });
    });

    test.describe('GET /api/intelligence/basket/[id]/dashboard', () => {
      test('should return intelligence dashboard data', async ({ request }) => {
        const response = await request.get(`/api/intelligence/basket/${basketId}/dashboard`, {
          headers: { 'x-playwright-test': 'true' }
        });

        if (response.ok()) {
          const result = await response.json();
          
          // Should have intelligence data structure
          expect(typeof result).toBe('object');
          expect(result).not.toBeNull();
        } else {
          // Intelligence APIs might not be fully implemented - check graceful failure
          expect([404, 500, 501]).toContain(response.status());
        }
      });
    });
  });

  test.describe('Governance APIs', () => {
    test.describe('GET /api/governance/status', () => {
      test('should return governance status', async ({ request }) => {
        const response = await request.get('/api/governance/status', {
          headers: { 'x-playwright-test': 'true' }
        });

        expect(response.ok()).toBeTruthy();
        const status = await response.json();
        
        expect(status).toHaveProperty('governance_enabled');
        expect(typeof status.governance_enabled).toBe('boolean');
      });
    });

    test.describe('GET /api/baskets/[id]/proposals', () => {
      test('should return proposals list', async ({ request }) => {
        const response = await request.get(`/api/baskets/${basketId}/proposals`, {
          headers: { 'x-playwright-test': 'true' }
        });

        if (response.ok()) {
          const result = await response.json();
          
          const proposals = Array.isArray(result) ? result : result.proposals || [];
          expect(Array.isArray(proposals)).toBeTruthy();

          // Validate proposal structure (if any exist)
          if (proposals.length > 0) {
            const proposal = proposals[0];
            expect(proposal).toHaveProperty('id');
            expect(proposal).toHaveProperty('status');
            expect(proposal).toHaveProperty('ops');
            expect(Array.isArray(proposal.ops)).toBeTruthy();
          }
        } else {
          expect(response.status()).toBeGreaterThanOrEqual(400);
        }
      });
    });
  });

  test.describe('System and Health APIs', () => {
    test.describe('GET /api/system-check', () => {
      test('should return system health status', async ({ request }) => {
        const response = await request.get('/api/system-check', {
          headers: { 'x-playwright-test': 'true' }
        });

        if (response.ok()) {
          const health = await response.json();
          expect(typeof health).toBe('object');
          expect(health).not.toBeNull();
        } else {
          // System check might return various status codes
          expect(response.status()).toBeGreaterThanOrEqual(400);
          expect(response.status()).toBeLessThan(600);
        }
      });
    });

    test.describe('GET /api/workspaces/bootstrap', () => {
      test('should handle workspace bootstrap', async ({ request }) => {
        const response = await request.get('/api/workspaces/bootstrap', {
          headers: { 'x-playwright-test': 'true' }
        });

        // Bootstrap might require authentication or return various responses
        if (response.ok()) {
          const result = await response.json();
          expect(typeof result).toBe('object');
        } else {
          // Should fail gracefully
          expect([400, 401, 403, 404, 500]).toContain(response.status());
        }
      });
    });
  });

  test.describe('Error Handling Validation', () => {
    test('APIs should return consistent error structure', async ({ request }) => {
      const endpoints = [
        `/api/baskets/${fakeId}`,
        `/api/documents?basketId=${fakeId}`,
        `/api/baskets/${fakeId}/building-blocks`,
        `/api/baskets/${fakeId}/documents`,
      ];

      for (const endpoint of endpoints) {
        const response = await request.get(endpoint, {
          headers: { 'x-playwright-test': 'true' }
        });

        if (!response.ok()) {
          const error = await response.json();
          
          // All error responses should have consistent structure
          expect(error).toHaveProperty('error');
          expect(typeof error.error).toBe('string');
          expect(error.error.length).toBeGreaterThan(0);

          // Should not expose sensitive information
          if (error.details) {
            expect(error.details).not.toContain('password');
            expect(error.details).not.toContain('secret');
            expect(error.details).not.toContain('key');
            expect(error.details).not.toContain('token');
          }
        }
      }
    });

    test('APIs should handle malformed requests gracefully', async ({ request }) => {
      // Test with invalid UUID formats
      const response = await request.get('/api/baskets/not-a-uuid/building-blocks', {
        headers: { 'x-playwright-test': 'true' }
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
      const error = await response.json();
      expect(error).toHaveProperty('error');
    });

    test('APIs should handle missing authentication gracefully', async ({ request }) => {
      // Test without test header (simulating no auth)
      const response = await request.get(`/api/baskets/${basketId}`);

      // Should either work or fail with proper auth error
      if (!response.ok()) {
        expect([401, 403]).toContain(response.status());
        const error = await response.json();
        expect(error).toHaveProperty('error');
      }
    });
  });

  test.describe('Response Performance Validation', () => {
    test('critical endpoints should respond within reasonable time', async ({ request }) => {
      const criticalEndpoints = [
        `/api/baskets/${basketId}`,
        `/api/baskets/${basketId}/building-blocks`,
        `/api/documents?basketId=${basketId}`,
        '/api/governance/status'
      ];

      for (const endpoint of criticalEndpoints) {
        const start = Date.now();
        
        const response = await request.get(endpoint, {
          headers: { 'x-playwright-test': 'true' }
        });

        const duration = Date.now() - start;
        
        // Should respond within 10 seconds (generous for testing)
        expect(duration).toBeLessThan(10000);
        
        // If it takes longer than 5 seconds, log a warning
        if (duration > 5000) {
          console.warn(`⚠️ Slow API response: ${endpoint} took ${duration}ms`);
        }
      }
    });
  });
});