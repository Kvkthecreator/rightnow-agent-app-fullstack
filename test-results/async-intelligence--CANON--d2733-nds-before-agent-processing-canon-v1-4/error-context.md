# Test info

- Name: [CANON v1.4.0] Async Intelligence Model >> User experience is immediate - API responds before agent processing
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/canon-v1.4/async-intelligence.spec.ts:15:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
    at /Users/macbook/rightnow-agent-app-fullstack/tests/canon-v1.4/async-intelligence.spec.ts:43:36
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | /**
   4 |  * [CANON v1.4.0] Pure Supabase Async Intelligence Model Tests
   5 |  * 
   6 |  * Validates the 5th Architectural Pillar: Pure Supabase Async Intelligence Model
   7 |  * - User experience is immediate, intelligence processing happens asynchronously
   8 |  * - Queue-based processing ensures YARNNN canon compliance at scale
   9 |  * - Agent processing is mandatory for substrate creation
   10 |  */
   11 |
   12 | test.describe('[CANON v1.4.0] Async Intelligence Model', () => {
   13 |   const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
   14 |
   15 |   test('User experience is immediate - API responds before agent processing', async ({ request }) => {
   16 |     const startTime = Date.now();
   17 |     
   18 |     // Sacred write path should respond immediately
   19 |     const dumpData = {
   20 |       basket_id: basketId,
   21 |       text_dump: 'Async intelligence test: This should return immediately while agents process asynchronously.',
   22 |       dump_request_id: crypto.randomUUID()
   23 |     };
   24 |
   25 |     const response = await request.post('/api/dumps/new', { 
   26 |       data: dumpData,
   27 |       headers: { 'x-playwright-test': 'true' }
   28 |     });
   29 |     
   30 |     const responseTime = Date.now() - startTime;
   31 |     
   32 |     expect(response.ok()).toBeTruthy();
   33 |     const result = await response.json();
   34 |     expect(result).toHaveProperty('dump_id');
   35 |     
   36 |     // Response should be immediate (< 2 seconds), not waiting for agent processing
   37 |     expect(responseTime).toBeLessThan(2000);
   38 |     
   39 |     console.log(`✅ Immediate response: ${responseTime}ms (agent processing happens async)`);
   40 |     
   41 |     // Verify dump exists immediately
   42 |     const dumpCheckResponse = await request.get(`/api/dumps/${result.dump_id}`);
>  43 |     expect(dumpCheckResponse.ok()).toBeTruthy();
      |                                    ^ Error: expect(received).toBeTruthy()
   44 |   });
   45 |
   46 |   test('Queue-based processing ensures canon compliance at scale', async ({ request }) => {
   47 |     // Check canonical queue processor health
   48 |     const queueResponse = await request.get('/api/canonical/queue/health');
   49 |     expect(queueResponse.ok()).toBeTruthy();
   50 |     
   51 |     const queueHealth = await queueResponse.json();
   52 |     
   53 |     // Verify canonical queue is operational
   54 |     expect(queueHealth.status).toBe('healthy');
   55 |     expect(queueHealth.canon_version).toBe('v1.4.0');
   56 |     expect(queueHealth.processor_info.processor_name).toBe('CanonicalQueueProcessor');
   57 |     
   58 |     // Verify sacred principles are enforced at queue level
   59 |     expect(queueHealth.sacred_principles_active).toBe(true);
   60 |     expect(queueHealth.pipeline_boundaries_enforced).toBe(true);
   61 |     
   62 |     // Queue should have proper pipeline sequence
   63 |     const expectedSequence = ['P0_CAPTURE', 'P1_SUBSTRATE', 'P2_GRAPH', 'P3_REFLECTION'];
   64 |     expect(queueHealth.processor_info.processing_sequence).toEqual(expectedSequence);
   65 |     
   66 |     console.log('✅ Canonical queue processor enforces canon compliance at scale');
   67 |   });
   68 |
   69 |   test('Intelligence processing happens asynchronously via queue', async ({ request }) => {
   70 |     // Create dump and verify it gets queued for processing
   71 |     const dumpData = {
   72 |       basket_id: basketId,
   73 |       text_dump: 'Queue processing test: Multiple concepts that should become substrate through async agent processing.',
   74 |       dump_request_id: crypto.randomUUID()
   75 |     };
   76 |
   77 |     const dumpResponse = await request.post('/api/dumps/new', { 
   78 |       data: dumpData,
   79 |       headers: { 'x-playwright-test': 'true' }
   80 |     });
   81 |     
   82 |     const dump = await dumpResponse.json();
   83 |     
   84 |     // Check timeline for queue processing events
   85 |     const timelineResponse = await request.get(`/api/baskets/${basketId}/timeline`);
   86 |     const timeline = await timelineResponse.json();
   87 |     
   88 |     // Look for queue-related events
   89 |     const queueEvents = timeline.events.filter((e: any) => 
   90 |       e.event_type?.includes('queue') || 
   91 |       e.event_type?.includes('processing')
   92 |     );
   93 |     
   94 |     if (queueEvents.length > 0) {
   95 |       console.log('✅ Queue processing events detected in timeline');
   96 |       console.log('Queue events:', queueEvents.map(e => e.event_type));
   97 |     }
   98 |     
   99 |     // Verify dump was created (immediate) but substrate creation happens async
  100 |     expect(dump.dump_id).toBeDefined();
  101 |     
  102 |     // Wait and check for agent processing results
  103 |     await new Promise(resolve => setTimeout(resolve, 3000));
  104 |     
  105 |     // Check if agent processing created substrate (async intelligence)
  106 |     const blocksResponse = await request.get(`/api/baskets/${basketId}/blocks`);
  107 |     if (blocksResponse.ok()) {
  108 |       const blocks = await blocksResponse.json();
  109 |       const recentBlocks = blocks.filter((b: any) => 
  110 |         new Date(b.created_at) > new Date(Date.now() - 10000)
  111 |       );
  112 |       
  113 |       if (recentBlocks.length > 0) {
  114 |         console.log('✅ Async intelligence: Agent processing created substrate after API response');
  115 |       } else {
  116 |         console.log('ℹ️ Agent processing may still be in progress (async by design)');
  117 |       }
  118 |     }
  119 |   });
  120 |
  121 |   test('Frontend shows processing state without synthesizing substrate', async ({ request }) => {
  122 |     // This tests that frontend gets processing state info without client-side synthesis
  123 |     const queueResponse = await request.get('/api/canonical/queue/health');
  124 |     const queueHealth = await queueResponse.json();
  125 |     
  126 |     // Queue health provides processing state without substrate synthesis
  127 |     expect(queueHealth).toHaveProperty('queue_stats');
  128 |     expect(queueHealth).toHaveProperty('processor_info');
  129 |     
  130 |     // Stats show processing state (not synthesized data)
  131 |     if (queueHealth.queue_stats && queueHealth.queue_stats.length > 0) {
  132 |       const stats = queueHealth.queue_stats[0];
  133 |       expect(stats).toHaveProperty('processing_state');
  134 |       expect(stats).toHaveProperty('count');
  135 |       
  136 |       console.log('✅ Frontend gets processing state without substrate synthesis');
  137 |       console.log('Queue processing states:', queueHealth.queue_stats.map(s => s.processing_state));
  138 |     }
  139 |     
  140 |     // Processor info shows canonical agent status
  141 |     expect(queueHealth.processor_info.pipeline_agents).toBeDefined();
  142 |     const agents = queueHealth.processor_info.pipeline_agents;
  143 |     
```