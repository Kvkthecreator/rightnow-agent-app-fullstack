import { test, expect } from '@playwright/test';

/**
 * [CANON] Pipeline Boundaries Tests
 * 
 * Validates the five pipeline boundaries (P0-P4) and their strict write restrictions
 * according to YARNNN canon v1.3.1.
 */

test.describe('[CANON] Pipeline Boundaries', () => {
  const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';

  test('P0: Capture pipeline only writes dumps, never interprets', async ({ page, request }) => {
    // Test the sacred write path
    const dumpData = {
      basket_id: basketId,
      text_dump: 'Test capture for pipeline validation',
      dump_request_id: crypto.randomUUID()
    };

    const response = await request.post('/api/dumps/new', { data: dumpData });
    
    // Debug: Log response if not ok
    if (!response.ok()) {
      const errorBody = await response.text();
      console.log(`API Error: ${response.status()} - ${errorBody}`);
    }
    
    expect(response.ok()).toBeTruthy();
    
    const result = await response.json();
    
    // P0 should only create dump, no side effects
    expect(result).toHaveProperty('dump_id');
    expect(result).not.toHaveProperty('block_id');
    expect(result).not.toHaveProperty('document_id');
    expect(result).not.toHaveProperty('relationships');
    
    // Verify immutability - dumps cannot be updated
    const updateResponse = await request.patch(`/api/dumps/${result.dump_id}`, {
      data: { text_dump: 'Modified content' }
    });
    expect([404, 405]).toContain(updateResponse.status()); // Endpoint doesn't exist or method not allowed
  });

  test('P1: Substrate pipeline creates structured units, no relationships', async ({ request }) => {
    // First create a dump (P0 Capture)
    const dumpData = {
      basket_id: basketId,
      text_dump: 'Structured content for block extraction: This is a test concept with actionable items.',
      dump_request_id: crypto.randomUUID()
    };

    const dumpResponse = await request.post('/api/dumps/new', { data: dumpData });
    expect(dumpResponse.ok()).toBeTruthy();
    const dump = await dumpResponse.json();
    
    // Trigger P1 Substrate processing (should create blocks from the dump)
    // In a real implementation, this would be triggered by agent queue
    // For testing, we'll wait and check if blocks were created
    
    // Wait for agent processing (simplified for test)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify blocks were created by P1 pipeline
    const blocksResponse = await request.get(`/api/baskets/${basketId}/blocks`);
    expect(blocksResponse.ok()).toBeTruthy();
    const blocksResult = await blocksResponse.json();
    
    // P1 should create substrate units without relationships
    expect(blocksResult.items).toBeDefined();
    // Blocks should not have graph connections or reflections (P2/P3 responsibilities)
    for (const item of blocksResult.items || []) {
      expect(item).not.toHaveProperty('connections');
      expect(item).not.toHaveProperty('relationships'); 
      expect(item).not.toHaveProperty('reflections');
    }
  });

  test('P2: Graph pipeline connects substrates, never modifies content', async ({ request }) => {
    const blockId = '33333333-3333-3333-3333-333333333333';
    const documentId = '11111111-1111-1111-1111-111111111111';
    
    // Connect substrate to document (graph operation)
    const response = await request.post(`/api/documents/${documentId}/references`, {
      data: {
        substrate_type: 'block',
        substrate_id: blockId,
        role: 'primary'
      }
    });
    
    // Debug: Log response if not ok
    if (!response.ok()) {
      const errorBody = await response.text();
      console.log(`P2 API Error: ${response.status()} - ${errorBody}`);
    }
    
    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    
    // P2 should only create connection, not modify substrate
    expect(result.reference).toHaveProperty('substrate_id', blockId);
    expect(result.reference).toHaveProperty('document_id', documentId);
    
    // Verify substrate content wasn't modified
    const blockResponse = await request.get(`/api/blocks/${blockId}`);
    const block = await blockResponse.json();
    expect(block.updated_at).toBe(block.created_at); // No updates
  });

  test('P3: Reflection pipeline is read-only computation', async ({ page, request }) => {
    // Navigate to memory view where reflections are computed
    await page.goto(`/baskets/${basketId}/memory`);
    
    // Reflections should be present but read-only
    await expect(page.locator('[data-testid="reflection-patterns"]')).toBeVisible();
    
    // Attempt to directly create a reflection should fail
    const reflectionData = {
      basket_id: basketId,
      type: 'pattern',
      content: 'Test reflection'
    };
    
    const response = await request.post('/api/reflections', { data: reflectionData });
    expect([404, 405]).toContain(response.status()); // Endpoint shouldn't exist or allow POST
  });

  test('P4: Presentation pipeline consumes substrate, never creates it', async ({ page, request }) => {
    const documentId = '11111111-1111-1111-1111-111111111111';
    
    // Documents can reference substrates but not create them
    await page.goto(`/baskets/${basketId}/documents/${documentId}`);
    
    // Verify presentation layer only composes existing substrates
    const compositionResponse = await request.get(`/api/documents/${documentId}/composition`);
    const composition = await compositionResponse.json();
    
    expect(composition).toHaveProperty('document');
    expect(composition).toHaveProperty('references');
    expect(composition.references.length).toBeGreaterThan(0);
    
    // Each reference should point to existing substrate
    for (const ref of composition.references) {
      expect(ref.substrate).toBeDefined();
      expect(ref.substrate.created_at).toBeDefined();
    }
  });

  test('Timeline events are emitted by all pipelines appropriately', async ({ request }) => {
    // Create a dump and verify timeline event
    const dumpResponse = await request.post('/api/dumps/new', {
      data: {
        basket_id: basketId,
        text_dump: 'Timeline test dump',
        dump_request_id: crypto.randomUUID()
      }
    });
    
    const dump = await dumpResponse.json();
    
    // Check timeline for dump creation event
    const timelineResponse = await request.get(`/api/baskets/${basketId}/timeline`);
    const timeline = await timelineResponse.json();
    
    // Timeline might be array or object with events property
    const events = Array.isArray(timeline) ? timeline : timeline.events || [];
    
    const dumpEvent = events.find((e: any) => 
      (e.event_type === 'dump.created' || e.kind === 'dump.created') && 
      (e.entity_id === dump.dump_id || e.payload?.dump_id === dump.dump_id)
    );
    
    expect(dumpEvent).toBeDefined();
    // Metadata should indicate source pipeline
    if (dumpEvent.metadata) {
      expect(dumpEvent.metadata.pipeline).toBe('P0_CAPTURE');
    }
  });

  test('Pipeline write boundaries are strictly enforced', async ({ request }) => {
    // Test cross-pipeline violations
    
    // P0 cannot create blocks
    const captureWithBlock = await request.post('/api/dumps/new', {
      data: {
        basket_id: basketId,
        text_dump: 'Test',
        create_block: true // This should be ignored
      }
    });
    const captureResult = await captureWithBlock.json();
    expect(captureResult).not.toHaveProperty('block_id');
    
    // P1 cannot create relationships
    const blockWithRelation = await request.post('/api/blocks', {
      data: {
        basket_id: basketId,
        title: 'Test',
        connect_to: 'some-id' // This should be ignored
      }
    });
    const blockResult = await blockWithRelation.json();
    expect(blockResult).not.toHaveProperty('connections');
    
    // P2 cannot modify substrate content
    const modifyViaGraph = await request.post('/api/graph/connect', {
      data: {
        source_id: 'id1',
        target_id: 'id2',
        modify_source: { title: 'New Title' } // This should be ignored
      }
    });
    
    if (modifyViaGraph.ok()) {
      const graphResult = await modifyViaGraph.json();
      expect(graphResult).not.toHaveProperty('modified_source');
    }
  });
});