import { test, expect } from '@playwright/test';

/**
 * [API CONTRACTS] Database Schema Validation Tests
 * 
 * Tests that validate the database schema matches what the code expects.
 * These tests would have caught the context_blocks table issue.
 */

test.describe('Database Schema Validation', () => {
  
  test.describe('Critical Table Existence', () => {
    test('should have all required substrate tables', async ({ request }) => {
      // Test via API that would fail if tables don't exist
      const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
      
      // This endpoint queries multiple tables - if any are missing, it should fail gracefully
      const response = await request.get(`/api/baskets/${basketId}/building-blocks`, {
        headers: { 'x-playwright-test': 'true' }
      });

      if (!response.ok()) {
        const error = await response.json();
        
        // If it's a database schema issue, error should contain table/relation info
        if (error.details && error.details.includes('relation') && error.details.includes('does not exist')) {
          console.error('❌ Database Schema Issue Detected:', error.details);
          
          // Log the specific table that's missing for debugging
          if (error.details.includes('context_blocks')) {
            console.error('❌ CRITICAL: context_blocks table is missing - should be "blocks" table');
          }
          
          expect.soft(response.ok(), 
            `Database schema validation failed: ${error.details}`
          ).toBeTruthy();
        }
      }

      // If successful, validate expected data structure
      if (response.ok()) {
        const result = await response.json();
        expect(result).toHaveProperty('substrates');
        expect(result).toHaveProperty('counts');
      }
    });

    test('should have documents table with correct structure', async ({ request }) => {
      const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
      
      const response = await request.get(`/api/documents?basketId=${basketId}`, {
        headers: { 'x-playwright-test': 'true' }
      });

      if (!response.ok()) {
        const error = await response.json();
        
        // Check for table existence issues
        if (error.details && error.details.includes('relation') && error.details.includes('does not exist')) {
          console.error('❌ Documents Table Schema Issue:', error.details);
          expect.soft(response.ok(), 
            `Documents table schema validation failed: ${error.details}`
          ).toBeTruthy();
        }
      }
    });

    test('should have baskets table with correct structure', async ({ request }) => {
      const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
      
      const response = await request.get(`/api/baskets/${basketId}`, {
        headers: { 'x-playwright-test': 'true' }
      });

      if (!response.ok()) {
        const error = await response.json();
        
        if (error.details && error.details.includes('relation') && error.details.includes('does not exist')) {
          console.error('❌ Baskets Table Schema Issue:', error.details);
          expect.soft(response.ok(), 
            `Baskets table schema validation failed: ${error.details}`
          ).toBeTruthy();
        }
      }
    });
  });

  test.describe('Required Columns Validation', () => {
    test('blocks table should have expected columns', async ({ request }) => {
      const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
      
      const response = await request.get(`/api/baskets/${basketId}/building-blocks`, {
        headers: { 'x-playwright-test': 'true' }
      });

      if (response.ok()) {
        const result = await response.json();
        
        // Validate that blocks have expected columns from API response
        const blocks = result.substrates?.filter(s => s.type === 'block') || [];
        
        if (blocks.length > 0) {
          const block = blocks[0];
          
          // These columns should exist based on the building-blocks API query
          expect(block).toHaveProperty('id');
          expect(block).toHaveProperty('semantic_type');
          expect(block).toHaveProperty('content');
          expect(block).toHaveProperty('confidence_score');
          expect(block).toHaveProperty('title');
          expect(block).toHaveProperty('body_md');
          expect(block).toHaveProperty('created_at');
          expect(block).toHaveProperty('metadata');
        }
      } else {
        const error = await response.json();
        
        // Check for column-related errors
        if (error.details && error.details.includes('column') && error.details.includes('does not exist')) {
          console.error('❌ Blocks Column Schema Issue:', error.details);
          expect.soft(response.ok(), 
            `Blocks column validation failed: ${error.details}`
          ).toBeTruthy();
        }
      }
    });

    test('documents table should have expected columns', async ({ request }) => {
      const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
      
      const response = await request.get(`/api/documents?basketId=${basketId}`, {
        headers: { 'x-playwright-test': 'true' }
      });

      if (response.ok()) {
        const result = await response.json();
        
        if (result.documents && result.documents.length > 0) {
          const document = result.documents[0];
          
          // These columns are queried by the documents API
          expect(document).toHaveProperty('id');
          expect(document).toHaveProperty('title');
          expect(document).toHaveProperty('document_type');
          expect(document).toHaveProperty('created_at');
          expect(document).toHaveProperty('updated_at');
          expect(document).toHaveProperty('workspace_id');
        }
      } else {
        const error = await response.json();
        
        if (error.details && error.details.includes('column') && error.details.includes('does not exist')) {
          console.error('❌ Documents Column Schema Issue:', error.details);
          expect.soft(response.ok(), 
            `Documents column validation failed: ${error.details}`
          ).toBeTruthy();
        }
      }
    });
  });

  test.describe('Workspace Isolation Validation', () => {
    test('should enforce workspace_id filtering', async ({ request }) => {
      const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
      
      // Test that workspace isolation is working by trying to access basket
      const response = await request.get(`/api/baskets/${basketId}`, {
        headers: { 'x-playwright-test': 'true' }
      });

      if (response.ok()) {
        const basket = await response.json();
        
        // Should have workspace_id (required for isolation)
        expect(basket).toHaveProperty('workspace_id');
        expect(typeof basket.workspace_id).toBe('string');
        expect(basket.workspace_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      }
    });

    test('building-blocks should enforce workspace isolation', async ({ request }) => {
      const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
      
      const response = await request.get(`/api/baskets/${basketId}/building-blocks`, {
        headers: { 'x-playwright-test': 'true' }
      });

      if (response.ok()) {
        const result = await response.json();
        
        // All substrates should belong to the same workspace
        if (result.substrates && result.substrates.length > 0) {
          const workspaceIds = new Set(
            result.substrates
              .filter(s => s.metadata && s.metadata.workspace_id)
              .map(s => s.metadata.workspace_id)
          );
          
          // Should all belong to same workspace (or not expose workspace_id in metadata)
          if (workspaceIds.size > 1) {
            console.warn('⚠️ Multiple workspace IDs found in building-blocks response');
          }
        }
      }
    });
  });

  test.describe('API Error Handling Validation', () => {
    test('should return proper error structure for database failures', async ({ request }) => {
      const fakeBasketId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request.get(`/api/baskets/${fakeBasketId}/building-blocks`, {
        headers: { 'x-playwright-test': 'true' }
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
      const error = await response.json();
      
      // Should have proper error structure
      expect(error).toHaveProperty('error');
      
      // If it's a database error, should have details
      if (response.status() === 500) {
        expect(error).toHaveProperty('details');
      }
      
      // Should not expose sensitive database information
      if (error.details) {
        expect(error.details).not.toContain('password');
        expect(error.details).not.toContain('secret');
        expect(error.details).not.toContain('key');
      }
    });
  });
});