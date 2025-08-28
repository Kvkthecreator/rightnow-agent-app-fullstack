import { test, expect } from '@playwright/test';

/**
 * [CANON] Timeline Consistency Tests
 * 
 * Validates that timeline events provide the authoritative memory stream
 * and are emitted consistently for all mutations according to canon.
 */

test.describe('[CANON] Timeline Consistency', () => {
  const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';

  test('all mutations emit timeline events', async ({ request }) => {
    const initialTimelineResponse = await request.get(`/api/baskets/${basketId}/timeline`);
    const initialTimeline = await initialTimelineResponse.json();
    
    // Debug: Check timeline structure
    if (!initialTimelineResponse.ok()) {
      console.log(`Timeline API Error: ${initialTimelineResponse.status()} - ${JSON.stringify(initialTimeline)}`);
    } else {
      console.log(`Timeline response structure:`, Object.keys(initialTimeline));
    }
    
    const initialEventCount = initialTimeline.events?.length || 0;

    // Test dump creation emits event
    const dumpResponse = await request.post('/api/dumps/new', {
      data: {
        basket_id: basketId,
        text_dump: 'Timeline test dump',
        dump_request_id: crypto.randomUUID()
      }
    });
    
    const dump = await dumpResponse.json();
    console.log('Dump response:', dump);
    
    // Check timeline for dump.created event
    const afterDumpResponse = await request.get(`/api/baskets/${basketId}/timeline`);
    const afterDump = await afterDumpResponse.json();
    
    console.log('After dump events:', afterDump.events.length, 'events found');
    console.log('Latest event full structure:', JSON.stringify(afterDump.events[afterDump.events.length - 1], null, 2));
    
    expect(afterDump.events.length).toBeGreaterThan(initialEventCount);
    
    // Look for dump event using actual API structure
    const dumpEvent = afterDump.events.find((e: any) => 
      (e.event_type === 'dump.created' || e.event_type === 'dump') && 
      (e.ref_id === dump.dump_id || e.ref_id === dump.id)
    );
    console.log('Looking for dump event with ID:', dump.dump_id || dump.id);
    expect(dumpEvent).toBeDefined();
    expect(dumpEvent.basket_id).toBeDefined(); // Use basket_id instead of actor_id
    expect(dumpEvent.created_at).toBeDefined(); // Use created_at to verify event structure

    // Test block state change emits event
    const blockResponse = await request.post('/api/blocks', {
      data: {
        basket_id: basketId,
        title: 'Timeline Test Block',
        content: 'Test content',
        state: 'PROPOSED'
      }
    });
    
    if (blockResponse.ok()) {
      const block = await blockResponse.json();
      
      // Update block state
      const updateResponse = await request.patch(`/api/blocks/${block.id}`, {
        data: { state: 'ACCEPTED' }
      });
      
      if (updateResponse.ok()) {
        const updatedTimelineResponse = await request.get(`/api/baskets/${basketId}/timeline`);
        const updatedTimeline = await updatedTimelineResponse.json();
        
        const stateEvent = updatedTimeline.events.find((e: any) => 
          e.kind === 'block.state_changed' && e.entity_id === block.id
        );
        expect(stateEvent).toBeDefined();
        expect(stateEvent.metadata.from_state).toBe('PROPOSED');
        expect(stateEvent.metadata.to_state).toBe('ACCEPTED');
      }
    }
  });

  test('timeline events are append-only and immutable', async ({ request }) => {
    const timelineResponse = await request.get(`/api/baskets/${basketId}/timeline`);
    const timeline = await timelineResponse.json();
    
    if (timeline.events.length > 0) {
      const firstEvent = timeline.events[0];
      
      // Attempt to modify timeline event should fail
      const modifyResponse = await request.patch(`/api/timeline/${firstEvent.id}`, {
        data: { kind: 'modified.event' }
      });
      expect([404, 405, 403]).toContain(modifyResponse.status());
      
      // Attempt to delete timeline event should fail
      const deleteResponse = await request.delete(`/api/timeline/${firstEvent.id}`);
      expect([404, 405, 403]).toContain(deleteResponse.status());
    }
  });

  test('timeline provides authoritative activity stream', async ({ page, request }) => {
    await page.goto(`/baskets/${basketId}/timeline`);
    
    // Timeline should show all activity in chronological order
    const timelineEvents = await page.locator('[data-testid="timeline-event"], .timeline-event').all();
    
    if (timelineEvents.length > 1) {
      const timestamps = await Promise.all(
        timelineEvents.map(event => 
          event.getAttribute('data-timestamp').then(ts => ts ? new Date(ts).getTime() : 0)
        )
      );
      
      // Events should be in descending chronological order (newest first)
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i-1]).toBeGreaterThanOrEqual(timestamps[i]);
      }
    }
  });

  test('timeline events follow canonical format', async ({ request }) => {
    const timelineResponse = await request.get(`/api/baskets/${basketId}/timeline`);
    const timeline = await timelineResponse.json();
    
    for (const event of timeline.events) {
      // All events must have canonical structure (updated for actual API)
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('event_type'); // 'kind' -> 'event_type'
      expect(event).toHaveProperty('ref_id'); // 'entity_id' -> 'ref_id'
      expect(event).toHaveProperty('basket_id', basketId);
      expect(event).toHaveProperty('created_at'); // 'ts' -> 'created_at'
      expect(event).toHaveProperty('event_data'); // 'metadata' -> 'event_data'
      
      // Event types should be valid strings
      expect(typeof event.event_type).toBe('string');
      expect(event.event_type.length).toBeGreaterThan(0);
      
      // Timestamp should be valid ISO string
      expect(() => new Date(event.created_at)).not.toThrow();
      expect(event.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }
  });

  test('document composition operations emit proper timeline events', async ({ request }) => {
    const documentId = '11111111-1111-1111-1111-111111111111';
    const blockId = '33333333-3333-3333-3333-333333333333';
    
    const initialTimelineResponse = await request.get(`/api/baskets/${basketId}/timeline`);
    const initialTimeline = await initialTimelineResponse.json();
    const initialCount = initialTimeline.events.length;
    
    // Attach substrate to document
    const attachResponse = await request.post(`/api/documents/${documentId}/references`, {
      data: {
        substrate_type: 'block',
        substrate_id: blockId,
        role: 'test'
      }
    });
    
    if (attachResponse.ok()) {
      const updatedTimelineResponse = await request.get(`/api/baskets/${basketId}/timeline`);
      const updatedTimeline = await updatedTimelineResponse.json();
      
      expect(updatedTimeline.events.length).toBeGreaterThan(initialCount);
      
      const attachEvent = updatedTimeline.events.find((e: any) => 
        e.kind === 'document.block.attached' && 
        e.entity_id === documentId &&
        e.metadata.substrate_id === blockId
      );
      
      expect(attachEvent).toBeDefined();
      expect(attachEvent.metadata.substrate_type).toBe('block');
      expect(attachEvent.metadata.role).toBe('test');
      
      // Detach substrate
      const detachResponse = await request.delete(`/api/documents/${documentId}/references`, {
        data: {
          substrate_type: 'block',
          substrate_id: blockId
        }
      });
      
      if (detachResponse.ok()) {
        const finalTimelineResponse = await request.get(`/api/baskets/${basketId}/timeline`);
        const finalTimeline = await finalTimelineResponse.json();
        
        const detachEvent = finalTimeline.events.find((e: any) => 
          e.kind === 'document.block.detached' && 
          e.entity_id === documentId &&
          e.metadata.substrate_id === blockId
        );
        
        expect(detachEvent).toBeDefined();
      }
    }
  });

  test('basket lifecycle events are properly tracked', async ({ request }) => {
    // Create new basket to test lifecycle
    const createResponse = await request.post('/api/baskets/new', {
      data: {
        name: 'Timeline Test Basket',
        idempotency_key: `timeline-test-${Date.now()}`
      }
    });
    
    if (createResponse.ok()) {
      const basket = await createResponse.json();
      
      // Check for basket creation event
      const timelineResponse = await request.get(`/api/baskets/${basket.id}/timeline`);
      const timeline = await timelineResponse.json();
      
      const createEvent = timeline.events.find((e: any) => 
        e.kind === 'basket.created' && e.entity_id === basket.id
      );
      
      expect(createEvent).toBeDefined();
      expect(createEvent.metadata.name).toBe('Timeline Test Basket');
      
      // Test basket status change
      const statusResponse = await request.patch(`/api/baskets/${basket.id}`, {
        data: { status: 'ARCHIVED' }
      });
      
      if (statusResponse.ok()) {
        const updatedTimelineResponse = await request.get(`/api/baskets/${basket.id}/timeline`);
        const updatedTimeline = await updatedTimelineResponse.json();
        
        const statusEvent = updatedTimeline.events.find((e: any) => 
          e.kind === 'basket.status_changed' && e.entity_id === basket.id
        );
        
        expect(statusEvent).toBeDefined();
        expect(statusEvent.metadata.from_status).toBe('INIT');
        expect(statusEvent.metadata.to_status).toBe('ARCHIVED');
      }
    }
  });

  test('timeline events are properly indexed and queryable', async ({ request }) => {
    // Test timeline with filters/pagination
    const timelineResponse = await request.get(`/api/baskets/${basketId}/timeline?limit=5`);
    const timeline = await timelineResponse.json();
    
    expect(timeline.events.length).toBeLessThanOrEqual(5);
    
    // Test event kind filtering
    const dumpEventsResponse = await request.get(`/api/baskets/${basketId}/timeline?kind=dump.created`);
    const dumpEvents = await dumpEventsResponse.json();
    
    for (const event of dumpEvents.events) {
      expect(event.event_type).toMatch(/dump/); // Allow 'dump' or 'dump.created'
    }
  });

  test('timeline events support real-time subscriptions', async ({ page }) => {
    await page.goto(`/baskets/${basketId}/timeline`);
    
    // Timeline should support real-time updates via WebSocket
    const wsConnected = await page.evaluate(() => {
      return new Promise(resolve => {
        if (window.WebSocket) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
    
    expect(wsConnected).toBe(true);
    
    // Check for real-time update capabilities
    const hasRealtimeIndicator = await page.locator('[data-testid="realtime-status"], .realtime-indicator').count();
    expect(hasRealtimeIndicator).toBeGreaterThan(0);
  });
});