import { test, expect } from '@playwright/test';

/**
 * [API CONTRACTS] Dumps API Tests
 * 
 * Tests HTTP API contracts for dumps endpoints.
 * These are separate from canon compliance tests - focused purely on API correctness.
 */

test.describe('Dumps API Contracts', () => {
  const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';

  test('POST /api/dumps/new - successful dump creation', async ({ request }) => {
    const dumpData = {
      basket_id: basketId,
      text_dump: 'API contract test dump',
      dump_request_id: crypto.randomUUID()
    };

    const response = await request.post('/api/dumps/new', { 
      data: dumpData,
      headers: { 'x-playwright-test': 'true' }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();

    // API contract validation
    expect(result).toHaveProperty('dump_id');
    expect(result).toHaveProperty('basket_id', basketId);
    expect(result.dump_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  test('POST /api/dumps/new - validation errors', async ({ request }) => {
    // Missing required fields
    const response = await request.post('/api/dumps/new', { 
      data: {},
      headers: { 'x-playwright-test': 'true' }
    });

    expect(response.status()).toBe(422);
    const error = await response.json();
    expect(error).toHaveProperty('error');
  });

  test('GET /api/dumps/[id] - retrieve dump', async ({ request }) => {
    // Create dump first
    const createResponse = await request.post('/api/dumps/new', { 
      data: {
        basket_id: basketId,
        text_dump: 'API retrieval test',
        dump_request_id: crypto.randomUUID()
      },
      headers: { 'x-playwright-test': 'true' }
    });

    const created = await createResponse.json();
    
    // Retrieve dump
    const getResponse = await request.get(`/api/dumps/${created.dump_id}`, {
      headers: { 'x-playwright-test': 'true' }
    });

    expect(getResponse.ok()).toBeTruthy();
    const dump = await getResponse.json();
    
    expect(dump.id).toBe(created.dump_id);
    expect(dump.body_md).toBe('API retrieval test');
  });

  test('GET /api/dumps/[id] - not found', async ({ request }) => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    
    const response = await request.get(`/api/dumps/${fakeId}`, {
      headers: { 'x-playwright-test': 'true' }
    });

    expect(response.status()).toBe(404);
  });
});