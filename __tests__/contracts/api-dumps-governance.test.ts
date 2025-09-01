/**
 * API Contract Tests: Dumps Endpoint Governance Compliance
 * 
 * Verifies /api/dumps/new respects Decision Gateway routing.
 * Tests both direct commit and proposal creation responses.
 */

import { test, expect } from '@playwright/test';

test.describe('API: /api/dumps/new - Governance Routing', () => {
  
  test('should route simple text dump through Decision Gateway', async ({ request }) => {
    const response = await request.post('/api/dumps/new', {
      data: {
        basket_id: process.env.TEST_BASKET_ID,
        dump_request_id: crypto.randomUUID(),
        text_dump: 'Simple capture test for governance routing'
      }
    });

    // Should succeed regardless of routing decision
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);

    const result = await response.json();
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('route'); // 'direct' or 'proposal'
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('decision_reason');
  });

  test('should return proposal_id when routed to governance', async ({ request }) => {
    // This test assumes workspace has ep_onboarding_dump: 'proposal'
    const response = await request.post('/api/dumps/new', {
      data: {
        basket_id: process.env.TEST_BASKET_ID,
        dump_request_id: crypto.randomUUID(),
        text_dump: 'Content requiring governance review'
      }
    });

    const result = await response.json();
    
    if (result.route === 'proposal') {
      expect(response.status()).toBe(202); // Accepted for async processing
      expect(result).toHaveProperty('proposal_id');
      expect(result.proposal_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(result.message).toContain('proposed for governance review');
    } else {
      expect(response.status()).toBe(201); // Created directly
      expect(result.message).toContain('saved directly');
    }
  });

  test('should reject invalid capture requests', async ({ request }) => {
    const response = await request.post('/api/dumps/new', {
      data: {
        basket_id: process.env.TEST_BASKET_ID,
        dump_request_id: crypto.randomUUID()
        // Missing both text_dump and file_url
      }
    });

    expect(response.status()).toBe(422);
    const result = await response.json();
    expect(result.error).toContain('Invalid request');
  });

  test('should maintain backward compatibility with legacy request format', async ({ request }) => {
    const response = await request.post('/api/dumps/new', {
      data: {
        basket_id: process.env.TEST_BASKET_ID,
        dump_request_id: crypto.randomUUID(),
        text: 'Legacy format test', // Using 'text' instead of 'text_dump'
        meta: { client_ts: new Date().toISOString() }
      }
    });

    // Should normalize legacy format and route through governance
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(['direct', 'proposal']).toContain(result.route);
  });

  test('should enforce pipeline boundary (P0 Capture only)', async ({ request }) => {
    const response = await request.post('/api/dumps/new', {
      data: {
        basket_id: process.env.TEST_BASKET_ID,
        dump_request_id: crypto.randomUUID(),
        text_dump: 'Raw capture data for P0 boundary test'
      }
    });

    const result = await response.json();
    
    // P0 should only create dumps, no extraction or interpretation
    // Verify response doesn't contain intelligence layer results
    expect(result).not.toHaveProperty('blocks_extracted');
    expect(result).not.toHaveProperty('context_items_created');
    expect(result).not.toHaveProperty('reflection_generated');
  });

  test('should handle governance policy routing correctly', async ({ request }) => {
    // Test with file upload (potentially higher risk)
    const response = await request.post('/api/dumps/new', {
      data: {
        basket_id: process.env.TEST_BASKET_ID,
        dump_request_id: crypto.randomUUID(),
        file_url: 'https://example.com/test-document.pdf',
        meta: { 
          upload_type: 'pdf',
          file_size: 1024000 
        }
      }
    });

    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(300);

    const result = await response.json();
    expect(result.success).toBe(true);
    
    // Should include governance decision reasoning
    expect(result.decision_reason).toBeDefined();
    expect(typeof result.decision_reason).toBe('string');
  });
});

test.describe('Sacred Principles Compliance', () => {
  
  test('Sacred Principle #1: All substrate mutations flow through governed proposals', async ({ request }) => {
    const response = await request.post('/api/dumps/new', {
      data: {
        basket_id: process.env.TEST_BASKET_ID,
        dump_request_id: crypto.randomUUID(),
        text_dump: 'Testing Sacred Principle #1 compliance'
      }
    });

    const result = await response.json();
    
    // Must go through Decision Gateway (evident from decision_reason field)
    expect(result).toHaveProperty('decision_reason');
    expect(result.decision_reason).toBeTruthy();
    
    // Should never bypass governance routing
    expect(result.decision_reason).not.toBe('bypassed');
  });

  test('Sacred Principle #2: Proposals are intent, not truth', async ({ request }) => {
    const response = await request.post('/api/dumps/new', {
      data: {
        basket_id: process.env.TEST_BASKET_ID,
        dump_request_id: crypto.randomUUID(),
        text_dump: 'Testing proposal vs truth separation'
      }
    });

    const result = await response.json();
    
    if (result.route === 'proposal') {
      // Proposals should not claim completion until approved
      expect(result).not.toHaveProperty('dump_id');
      expect(result.proposal_id).toBeDefined();
      expect(result.message).toContain('proposed');
    } else if (result.route === 'direct') {
      // Direct commits represent completed truth
      expect(result.message).toContain('saved');
    }
  });

  test('Sacred Principle #3: Agent validation mandatory', async ({ request }) => {
    // This principle applies to proposal creation
    // Actual validation is handled by Decision Gateway
    const response = await request.post('/api/dumps/new', {
      data: {
        basket_id: process.env.TEST_BASKET_ID,
        dump_request_id: crypto.randomUUID(),
        text_dump: 'Content requiring agent validation'
      }
    });

    const result = await response.json();
    
    // If routed to proposal, should indicate validation status
    if (result.route === 'proposal') {
      expect(result.decision_reason).toBeDefined();
      // Decision reason should indicate if validator was used
      expect(typeof result.decision_reason).toBe('string');
    }
  });
});