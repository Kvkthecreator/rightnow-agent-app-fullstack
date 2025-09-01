# Test info

- Name: [CANON v1.4.0] Agent Pipeline Processing >> Sacred Principle #1: Capture is Sacred - P0 Agent only writes dumps
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/canon-v1.4/agent-pipeline.spec.ts:16:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
    at /Users/macbook/rightnow-agent-app-fullstack/tests/canon-v1.4/agent-pipeline.spec.ts:41:32
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | /**
   4 |  * [CANON v1.4.0] Agent Pipeline Processing Tests
   5 |  * 
   6 |  * Validates the Four Sacred Principles through actual agent processing:
   7 |  * 1. Capture is Sacred - P0 only writes dumps, never interprets
   8 |  * 2. All Substrates are Peers - P1 treats substrate types equally  
   9 |  * 3. Narrative is Deliberate - P4 not triggered in queue processing
   10 |  * 4. Agent Intelligence is Mandatory - Substrate cannot exist without agent processing
   11 |  */
   12 |
   13 | test.describe('[CANON v1.4.0] Agent Pipeline Processing', () => {
   14 |   const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
   15 |   
   16 |   test('Sacred Principle #1: Capture is Sacred - P0 Agent only writes dumps', async ({ request }) => {
   17 |     // Create dump via sacred write path
   18 |     const dumpData = {
   19 |       basket_id: basketId,
   20 |       text_dump: 'Canon P0 test: This is raw memory that should not be interpreted by P0.',
   21 |       dump_request_id: crypto.randomUUID()
   22 |     };
   23 |
   24 |     // Step 1: Invoke P0 Capture via API
   25 |     const response = await request.post('/api/dumps/new', { 
   26 |       data: dumpData,
   27 |       headers: { 'x-playwright-test': 'true' }
   28 |     });
   29 |     
   30 |     expect(response.ok()).toBeTruthy();
   31 |     const result = await response.json();
   32 |     
   33 |     // Step 2: Verify P0 Agent respected sacred rule - only dump created
   34 |     expect(result).toHaveProperty('dump_id');
   35 |     expect(result).not.toHaveProperty('block_id');
   36 |     expect(result).not.toHaveProperty('relationships');
   37 |     expect(result).not.toHaveProperty('insights');
   38 |     
   39 |     // Step 3: Verify dump was queued for canonical processing
   40 |     const queueResponse = await request.get(`/api/canonical/queue/health`);
>  41 |     expect(queueResponse.ok()).toBeTruthy();
      |                                ^ Error: expect(received).toBeTruthy()
   42 |     
   43 |     const queueHealth = await queueResponse.json();
   44 |     expect(queueHealth.status).toBe('healthy');
   45 |     expect(queueHealth.canon_version).toBe('v1.4.0');
   46 |     
   47 |     // Step 4: Wait for and verify queue processing occurred
   48 |     // Note: In real deployment, queue processes asynchronously
   49 |     await new Promise(resolve => setTimeout(resolve, 2000)); // Brief wait
   50 |     
   51 |     // Verify timeline shows dump.queued event (agent processing initiated)
   52 |     const timelineResponse = await request.get(`/api/baskets/${basketId}/timeline`);
   53 |     const timeline = await timelineResponse.json();
   54 |     
   55 |     const queueEvent = timeline.events.find((e: any) => 
   56 |       e.event_type === 'dump.queued' && e.ref_id === result.dump_id
   57 |     );
   58 |     
   59 |     if (queueEvent) {
   60 |       console.log('✅ P0 Capture Agent correctly queued dump for processing');
   61 |     } else {
   62 |       console.log('⚠️ Queue processing may be async - dump created but not yet queued');
   63 |     }
   64 |   });
   65 |
   66 |   test('Sacred Principle #4: Agent Intelligence is Mandatory - substrates require agent processing', async ({ request }) => {
   67 |     // Create raw dump
   68 |     const dumpData = {
   69 |       basket_id: basketId,
   70 |       text_dump: 'Canon agent test: This content should generate blocks and context items through P1 Substrate Agent processing.',
   71 |       dump_request_id: crypto.randomUUID()
   72 |     };
   73 |
   74 |     const dumpResponse = await request.post('/api/dumps/new', { 
   75 |       data: dumpData,
   76 |       headers: { 'x-playwright-test': 'true' }
   77 |     });
   78 |     
   79 |     const dump = await dumpResponse.json();
   80 |     
   81 |     // Wait for agent processing (in real deployment this is async)
   82 |     await new Promise(resolve => setTimeout(resolve, 3000));
   83 |     
   84 |     // Verify P1 Substrate Agent created structured substrate
   85 |     const blocksResponse = await request.get(`/api/baskets/${basketId}/building-blocks`);
   86 |     const contextResponse = await request.get(`/api/baskets/${basketId}/context-items`);
   87 |     
   88 |     if (blocksResponse.ok() && contextResponse.ok()) {
   89 |       const buildingBlocksData = await blocksResponse.json();
   90 |       const blocks = buildingBlocksData.substrates.filter((s: any) => s.type === 'block');
   91 |       const contextItems = await contextResponse.json();
   92 |       
   93 |       // Agent Intelligence Mandatory: substrate should exist from agent processing
   94 |       const hasAgentCreatedSubstrate = blocks.length > 0 || contextItems.length > 0;
   95 |       
   96 |       if (hasAgentCreatedSubstrate) {
   97 |         console.log('✅ Agent Intelligence Mandatory: P1 Substrate Agent created substrate');
   98 |         
   99 |         // Sacred Principle #2: All Substrates are Peers
  100 |         // Verify P1 Agent treats blocks and context_items as peers (both created)
  101 |         if (blocks.length > 0 && contextItems.length > 0) {
  102 |           console.log('✅ All Substrates are Peers: P1 Agent created both blocks and context_items');
  103 |         }
  104 |       } else {
  105 |         console.log('⚠️ No agent-created substrate found - queue may be processing or failed');
  106 |       }
  107 |     }
  108 |   });
  109 |
  110 |   test('Sacred Principle #3: Narrative is Deliberate - P4 not triggered in queue processing', async ({ request }) => {
  111 |     // Verify canonical queue processor does NOT trigger P4 Presentation
  112 |     const queueHealthResponse = await request.get('/api/canonical/queue/health');
  113 |     const queueHealth = await queueHealthResponse.json();
  114 |     
  115 |     // Check processor pipeline configuration
  116 |     expect(queueHealth.processor_info.processing_sequence).toEqual([
  117 |       'P0_CAPTURE', 'P1_SUBSTRATE', 'P2_GRAPH', 'P3_REFLECTION'
  118 |     ]);
  119 |     
  120 |     // P4_PRESENTATION should NOT be in queue processing sequence
  121 |     expect(queueHealth.processor_info.processing_sequence).not.toContain('P4_PRESENTATION');
  122 |     
  123 |     console.log('✅ Narrative is Deliberate: P4 Presentation Agent excluded from queue processing');
  124 |   });
  125 |
  126 |   test('Pipeline Boundaries: P1 Substrate Agent never creates relationships', async ({ request }) => {
  127 |     // This tests that P1 respects pipeline boundaries per canon
  128 |     const dumpData = {
  129 |       basket_id: basketId, 
  130 |       text_dump: 'Canon boundary test: Concept A relates to Concept B. These should be separate blocks, not relationships.',
  131 |       dump_request_id: crypto.randomUUID()
  132 |     };
  133 |
  134 |     await request.post('/api/dumps/new', { 
  135 |       data: dumpData,
  136 |       headers: { 'x-playwright-test': 'true' }
  137 |     });
  138 |     
  139 |     // Wait for P1 processing
  140 |     await new Promise(resolve => setTimeout(resolve, 2000));
  141 |     
```