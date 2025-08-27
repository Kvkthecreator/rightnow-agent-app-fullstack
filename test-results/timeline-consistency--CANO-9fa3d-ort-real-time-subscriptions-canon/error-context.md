# Test info

- Name: [CANON] Timeline Consistency >> timeline events support real-time subscriptions
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/canon/timeline-consistency.spec.ts:251:7

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
    at /Users/macbook/rightnow-agent-app-fullstack/tests/canon/timeline-consistency.spec.ts:269:34
```

# Page snapshot

```yaml
- alert
- text: Something went wrong.
- img
- text: 1 error
- button "Hide Errors":
  - img
```

# Test source

```ts
  169 |       // Detach substrate
  170 |       const detachResponse = await request.delete(`/api/documents/${documentId}/references`, {
  171 |         data: {
  172 |           substrate_type: 'block',
  173 |           substrate_id: blockId
  174 |         }
  175 |       });
  176 |       
  177 |       if (detachResponse.ok()) {
  178 |         const finalTimelineResponse = await request.get(`/api/baskets/${basketId}/timeline`);
  179 |         const finalTimeline = await finalTimelineResponse.json();
  180 |         
  181 |         const detachEvent = finalTimeline.events.find((e: any) => 
  182 |           e.kind === 'document.block.detached' && 
  183 |           e.entity_id === documentId &&
  184 |           e.metadata.substrate_id === blockId
  185 |         );
  186 |         
  187 |         expect(detachEvent).toBeDefined();
  188 |       }
  189 |     }
  190 |   });
  191 |
  192 |   test('basket lifecycle events are properly tracked', async ({ request }) => {
  193 |     // Create new basket to test lifecycle
  194 |     const createResponse = await request.post('/api/baskets/new', {
  195 |       data: {
  196 |         name: 'Timeline Test Basket',
  197 |         idempotency_key: `timeline-test-${Date.now()}`
  198 |       }
  199 |     });
  200 |     
  201 |     if (createResponse.ok()) {
  202 |       const basket = await createResponse.json();
  203 |       
  204 |       // Check for basket creation event
  205 |       const timelineResponse = await request.get(`/api/baskets/${basket.id}/timeline`);
  206 |       const timeline = await timelineResponse.json();
  207 |       
  208 |       const createEvent = timeline.events.find((e: any) => 
  209 |         e.kind === 'basket.created' && e.entity_id === basket.id
  210 |       );
  211 |       
  212 |       expect(createEvent).toBeDefined();
  213 |       expect(createEvent.metadata.name).toBe('Timeline Test Basket');
  214 |       
  215 |       // Test basket status change
  216 |       const statusResponse = await request.patch(`/api/baskets/${basket.id}`, {
  217 |         data: { status: 'ARCHIVED' }
  218 |       });
  219 |       
  220 |       if (statusResponse.ok()) {
  221 |         const updatedTimelineResponse = await request.get(`/api/baskets/${basket.id}/timeline`);
  222 |         const updatedTimeline = await updatedTimelineResponse.json();
  223 |         
  224 |         const statusEvent = updatedTimeline.events.find((e: any) => 
  225 |           e.kind === 'basket.status_changed' && e.entity_id === basket.id
  226 |         );
  227 |         
  228 |         expect(statusEvent).toBeDefined();
  229 |         expect(statusEvent.metadata.from_status).toBe('INIT');
  230 |         expect(statusEvent.metadata.to_status).toBe('ARCHIVED');
  231 |       }
  232 |     }
  233 |   });
  234 |
  235 |   test('timeline events are properly indexed and queryable', async ({ request }) => {
  236 |     // Test timeline with filters/pagination
  237 |     const timelineResponse = await request.get(`/api/baskets/${basketId}/timeline?limit=5`);
  238 |     const timeline = await timelineResponse.json();
  239 |     
  240 |     expect(timeline.events.length).toBeLessThanOrEqual(5);
  241 |     
  242 |     // Test event kind filtering
  243 |     const dumpEventsResponse = await request.get(`/api/baskets/${basketId}/timeline?kind=dump.created`);
  244 |     const dumpEvents = await dumpEventsResponse.json();
  245 |     
  246 |     for (const event of dumpEvents.events) {
  247 |       expect(event.kind).toBe('dump.created');
  248 |     }
  249 |   });
  250 |
  251 |   test('timeline events support real-time subscriptions', async ({ page }) => {
  252 |     await page.goto(`/baskets/${basketId}/timeline`);
  253 |     
  254 |     // Timeline should support real-time updates via WebSocket
  255 |     const wsConnected = await page.evaluate(() => {
  256 |       return new Promise(resolve => {
  257 |         if (window.WebSocket) {
  258 |           resolve(true);
  259 |         } else {
  260 |           resolve(false);
  261 |         }
  262 |       });
  263 |     });
  264 |     
  265 |     expect(wsConnected).toBe(true);
  266 |     
  267 |     // Check for real-time update capabilities
  268 |     const hasRealtimeIndicator = await page.locator('[data-testid="realtime-status"], .realtime-indicator').count();
> 269 |     expect(hasRealtimeIndicator).toBeGreaterThan(0);
      |                                  ^ Error: expect(received).toBeGreaterThan(expected)
  270 |   });
  271 | });
```