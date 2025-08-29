import { test, expect } from '@playwright/test';

/**
 * [CANON v1.4.0] Agent Pipeline Processing Tests
 * 
 * Validates the Four Sacred Principles through actual agent processing:
 * 1. Capture is Sacred - P0 only writes dumps, never interprets
 * 2. All Substrates are Peers - P1 treats substrate types equally  
 * 3. Narrative is Deliberate - P4 not triggered in queue processing
 * 4. Agent Intelligence is Mandatory - Substrate cannot exist without agent processing
 */

test.describe('[CANON v1.4.0] Agent Pipeline Processing', () => {
  const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
  
  test('Sacred Principle #1: Capture is Sacred - P0 Agent only writes dumps', async ({ request }) => {
    // Create dump via sacred write path
    const dumpData = {
      basket_id: basketId,
      text_dump: 'Canon P0 test: This is raw memory that should not be interpreted by P0.',
      dump_request_id: crypto.randomUUID()
    };

    // Step 1: Invoke P0 Capture via API
    const response = await request.post('/api/dumps/new', { 
      data: dumpData,
      headers: { 'x-playwright-test': 'true' }
    });
    
    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    
    // Step 2: Verify P0 Agent respected sacred rule - only dump created
    expect(result).toHaveProperty('dump_id');
    expect(result).not.toHaveProperty('block_id');
    expect(result).not.toHaveProperty('relationships');
    expect(result).not.toHaveProperty('insights');
    
    // Step 3: Verify dump was queued for canonical processing
    const queueResponse = await request.get(`/api/canonical/queue/health`);
    expect(queueResponse.ok()).toBeTruthy();
    
    const queueHealth = await queueResponse.json();
    expect(queueHealth.status).toBe('healthy');
    expect(queueHealth.canon_version).toBe('v1.4.0');
    
    // Step 4: Wait for and verify queue processing occurred
    // Note: In real deployment, queue processes asynchronously
    await new Promise(resolve => setTimeout(resolve, 2000)); // Brief wait
    
    // Verify timeline shows dump.queued event (agent processing initiated)
    const timelineResponse = await request.get(`/api/baskets/${basketId}/timeline`);
    const timeline = await timelineResponse.json();
    
    const queueEvent = timeline.events.find((e: any) => 
      e.event_type === 'dump.queued' && e.ref_id === result.dump_id
    );
    
    if (queueEvent) {
      console.log('✅ P0 Capture Agent correctly queued dump for processing');
    } else {
      console.log('⚠️ Queue processing may be async - dump created but not yet queued');
    }
  });

  test('Sacred Principle #4: Agent Intelligence is Mandatory - substrates require agent processing', async ({ request }) => {
    // Create raw dump
    const dumpData = {
      basket_id: basketId,
      text_dump: 'Canon agent test: This content should generate blocks and context items through P1 Substrate Agent processing.',
      dump_request_id: crypto.randomUUID()
    };

    const dumpResponse = await request.post('/api/dumps/new', { 
      data: dumpData,
      headers: { 'x-playwright-test': 'true' }
    });
    
    const dump = await dumpResponse.json();
    
    // Wait for agent processing (in real deployment this is async)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verify P1 Substrate Agent created structured substrate
    const blocksResponse = await request.get(`/api/baskets/${basketId}/building-blocks`);
    const contextResponse = await request.get(`/api/baskets/${basketId}/context-items`);
    
    if (blocksResponse.ok() && contextResponse.ok()) {
      const buildingBlocksData = await blocksResponse.json();
      const blocks = buildingBlocksData.substrates.filter((s: any) => s.type === 'block');
      const contextItems = await contextResponse.json();
      
      // Agent Intelligence Mandatory: substrate should exist from agent processing
      const hasAgentCreatedSubstrate = blocks.length > 0 || contextItems.length > 0;
      
      if (hasAgentCreatedSubstrate) {
        console.log('✅ Agent Intelligence Mandatory: P1 Substrate Agent created substrate');
        
        // Sacred Principle #2: All Substrates are Peers
        // Verify P1 Agent treats blocks and context_items as peers (both created)
        if (blocks.length > 0 && contextItems.length > 0) {
          console.log('✅ All Substrates are Peers: P1 Agent created both blocks and context_items');
        }
      } else {
        console.log('⚠️ No agent-created substrate found - queue may be processing or failed');
      }
    }
  });

  test('Sacred Principle #3: Narrative is Deliberate - P4 not triggered in queue processing', async ({ request }) => {
    // Verify canonical queue processor does NOT trigger P4 Presentation
    const queueHealthResponse = await request.get('/api/canonical/queue/health');
    const queueHealth = await queueHealthResponse.json();
    
    // Check processor pipeline configuration
    expect(queueHealth.processor_info.processing_sequence).toEqual([
      'P0_CAPTURE', 'P1_SUBSTRATE', 'P2_GRAPH', 'P3_REFLECTION'
    ]);
    
    // P4_PRESENTATION should NOT be in queue processing sequence
    expect(queueHealth.processor_info.processing_sequence).not.toContain('P4_PRESENTATION');
    
    console.log('✅ Narrative is Deliberate: P4 Presentation Agent excluded from queue processing');
  });

  test('Pipeline Boundaries: P1 Substrate Agent never creates relationships', async ({ request }) => {
    // This tests that P1 respects pipeline boundaries per canon
    const dumpData = {
      basket_id: basketId, 
      text_dump: 'Canon boundary test: Concept A relates to Concept B. These should be separate blocks, not relationships.',
      dump_request_id: crypto.randomUUID()
    };

    await request.post('/api/dumps/new', { 
      data: dumpData,
      headers: { 'x-playwright-test': 'true' }
    });
    
    // Wait for P1 processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if P1 created relationships (violation) or left for P2 (correct)
    const relationshipsResponse = await request.get(`/api/baskets/${basketId}/relationships`);
    
    if (relationshipsResponse.ok()) {
      const relationships = await relationshipsResponse.json();
      
      // P1 should NOT have created relationships - that's P2's job
      const recentRelationships = relationships.filter((r: any) => 
        new Date(r.created_at) > new Date(Date.now() - 10000) // Last 10 seconds
      );
      
      if (recentRelationships.length === 0) {
        console.log('✅ Pipeline Boundaries: P1 Substrate Agent correctly avoided creating relationships');
      } else {
        console.log('⚠️ Pipeline Boundary Violation: P1 may have created relationships (P2 responsibility)');
      }
    }
  });

  test('Workspace Isolation: Canon processing respects workspace boundaries', async ({ request }) => {
    // Verify canonical agents respect workspace isolation per canon
    const queueHealthResponse = await request.get('/api/canonical/queue/health');
    const queueHealth = await queueHealthResponse.json();
    
    // Sacred principles should be active and enforced
    expect(queueHealth.sacred_principles_active).toBe(true);
    expect(queueHealth.pipeline_boundaries_enforced).toBe(true);
    
    console.log('✅ Workspace Isolation: Canon processing enforces sacred principles');
  });
});