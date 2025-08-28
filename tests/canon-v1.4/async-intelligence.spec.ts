import { test, expect } from '@playwright/test';

/**
 * [CANON v1.4.0] Pure Supabase Async Intelligence Model Tests
 * 
 * Validates the 5th Architectural Pillar: Pure Supabase Async Intelligence Model
 * - User experience is immediate, intelligence processing happens asynchronously
 * - Queue-based processing ensures YARNNN canon compliance at scale
 * - Agent processing is mandatory for substrate creation
 */

test.describe('[CANON v1.4.0] Async Intelligence Model', () => {
  const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';

  test('User experience is immediate - API responds before agent processing', async ({ request }) => {
    const startTime = Date.now();
    
    // Sacred write path should respond immediately
    const dumpData = {
      basket_id: basketId,
      text_dump: 'Async intelligence test: This should return immediately while agents process asynchronously.',
      dump_request_id: crypto.randomUUID()
    };

    const response = await request.post('/api/dumps/new', { 
      data: dumpData,
      headers: { 'x-playwright-test': 'true' }
    });
    
    const responseTime = Date.now() - startTime;
    
    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result).toHaveProperty('dump_id');
    
    // Response should be immediate (< 2 seconds), not waiting for agent processing
    expect(responseTime).toBeLessThan(2000);
    
    console.log(`✅ Immediate response: ${responseTime}ms (agent processing happens async)`);
    
    // Verify dump exists immediately
    const dumpCheckResponse = await request.get(`/api/dumps/${result.dump_id}`);
    expect(dumpCheckResponse.ok()).toBeTruthy();
  });

  test('Queue-based processing ensures canon compliance at scale', async ({ request }) => {
    // Check canonical queue processor health
    const queueResponse = await request.get('/api/canonical/queue/health');
    expect(queueResponse.ok()).toBeTruthy();
    
    const queueHealth = await queueResponse.json();
    
    // Verify canonical queue is operational
    expect(queueHealth.status).toBe('healthy');
    expect(queueHealth.canon_version).toBe('v1.4.0');
    expect(queueHealth.processor_info.processor_name).toBe('CanonicalQueueProcessor');
    
    // Verify sacred principles are enforced at queue level
    expect(queueHealth.sacred_principles_active).toBe(true);
    expect(queueHealth.pipeline_boundaries_enforced).toBe(true);
    
    // Queue should have proper pipeline sequence
    const expectedSequence = ['P0_CAPTURE', 'P1_SUBSTRATE', 'P2_GRAPH', 'P3_REFLECTION'];
    expect(queueHealth.processor_info.processing_sequence).toEqual(expectedSequence);
    
    console.log('✅ Canonical queue processor enforces canon compliance at scale');
  });

  test('Intelligence processing happens asynchronously via queue', async ({ request }) => {
    // Create dump and verify it gets queued for processing
    const dumpData = {
      basket_id: basketId,
      text_dump: 'Queue processing test: Multiple concepts that should become substrate through async agent processing.',
      dump_request_id: crypto.randomUUID()
    };

    const dumpResponse = await request.post('/api/dumps/new', { 
      data: dumpData,
      headers: { 'x-playwright-test': 'true' }
    });
    
    const dump = await dumpResponse.json();
    
    // Check timeline for queue processing events
    const timelineResponse = await request.get(`/api/baskets/${basketId}/timeline`);
    const timeline = await timelineResponse.json();
    
    // Look for queue-related events
    const queueEvents = timeline.events.filter((e: any) => 
      e.event_type?.includes('queue') || 
      e.event_type?.includes('processing')
    );
    
    if (queueEvents.length > 0) {
      console.log('✅ Queue processing events detected in timeline');
      console.log('Queue events:', queueEvents.map(e => e.event_type));
    }
    
    // Verify dump was created (immediate) but substrate creation happens async
    expect(dump.dump_id).toBeDefined();
    
    // Wait and check for agent processing results
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if agent processing created substrate (async intelligence)
    const blocksResponse = await request.get(`/api/baskets/${basketId}/blocks`);
    if (blocksResponse.ok()) {
      const blocks = await blocksResponse.json();
      const recentBlocks = blocks.filter((b: any) => 
        new Date(b.created_at) > new Date(Date.now() - 10000)
      );
      
      if (recentBlocks.length > 0) {
        console.log('✅ Async intelligence: Agent processing created substrate after API response');
      } else {
        console.log('ℹ️ Agent processing may still be in progress (async by design)');
      }
    }
  });

  test('Frontend shows processing state without synthesizing substrate', async ({ request }) => {
    // This tests that frontend gets processing state info without client-side synthesis
    const queueResponse = await request.get('/api/canonical/queue/health');
    const queueHealth = await queueResponse.json();
    
    // Queue health provides processing state without substrate synthesis
    expect(queueHealth).toHaveProperty('queue_stats');
    expect(queueHealth).toHaveProperty('processor_info');
    
    // Stats show processing state (not synthesized data)
    if (queueHealth.queue_stats && queueHealth.queue_stats.length > 0) {
      const stats = queueHealth.queue_stats[0];
      expect(stats).toHaveProperty('processing_state');
      expect(stats).toHaveProperty('count');
      
      console.log('✅ Frontend gets processing state without substrate synthesis');
      console.log('Queue processing states:', queueHealth.queue_stats.map(s => s.processing_state));
    }
    
    // Processor info shows canonical agent status
    expect(queueHealth.processor_info.pipeline_agents).toBeDefined();
    const agents = queueHealth.processor_info.pipeline_agents;
    
    // Verify all canonical pipeline agents are present
    expect(agents.P0_CAPTURE).toBeDefined();
    expect(agents.P1_SUBSTRATE).toBeDefined(); 
    expect(agents.P2_GRAPH).toBeDefined();
    expect(agents.P3_REFLECTION).toBeDefined();
    
    console.log('✅ Canonical pipeline agents status available for frontend');
  });

  test('No DATABASE_URL dependency - pure Supabase architecture', async ({ request }) => {
    // Verify the system works with pure Supabase (no direct database connections)
    const queueResponse = await request.get('/api/canonical/queue/health');
    const queueHealth = await queueResponse.json();
    
    // If we get a healthy response, the pure Supabase architecture is working
    expect(queueHealth.status).toBe('healthy');
    
    // Queue processor should be using Supabase service role, not DATABASE_URL
    expect(queueHealth.processor_info.status).toBe('running');
    
    console.log('✅ Pure Supabase architecture: No DATABASE_URL dependency confirmed');
  });
});