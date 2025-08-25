import { test, expect } from '@playwright/test';
const basketId = process.env.TEST_BASKET_ID;
test.skip(!basketId, 'requires TEST_BASKET_ID to run');

test('timeline enrichment with multiple event types', async ({ page }) => {
  // Add a memory dump to create a dump.created event
  await page.goto(`/baskets/${basketId}/memory`);
  
  const textarea = page.getByRole('textbox');
  await textarea.fill('Timeline test content');
  await page.getByRole('button', { name: /add|upload/i }).click();
  
  // Wait for the dump to be created
  await expect(page.locator('[data-test=dump-item]')).toHaveCount(1);
  
  // Trigger a reflection computation via GET with refresh
  const reflectionResponse = await page.evaluate(async (basketId) => {
    const response = await fetch(`/api/baskets/${basketId}/reflections?refresh=1`);
    return response.status;
  }, basketId);
  
  expect(reflectionResponse).toBe(200);
  
  // Fetch timeline events
  const timelineResponse = await page.evaluate(async (basketId) => {
    const response = await fetch(`/api/baskets/${basketId}/timeline`);
    return {
      status: response.status,
      data: await response.json()
    };
  }, basketId);
  
  expect(timelineResponse.status).toBe(200);
  expect(timelineResponse.data).toHaveProperty('events');
  expect(timelineResponse.data).toHaveProperty('has_more');
  expect(timelineResponse.data).toHaveProperty('last_cursor');
  
  // Should have at least dump.created and reflection.computed events
  const eventTypes = timelineResponse.data.events.map(e => e.event_type);
  expect(eventTypes).toContain('dump.created');
  expect(eventTypes).toContain('reflection.computed');
  
  // Test cursor-based pagination
  if (timelineResponse.data.last_cursor) {
    const paginatedResponse = await page.evaluate(async (basketId, cursor) => {
      const response = await fetch(`/api/baskets/${basketId}/timeline?cursor=${cursor}`);
      return {
        status: response.status,
        data: await response.json()
      };
    }, basketId, timelineResponse.data.last_cursor);
    
    expect(paginatedResponse.status).toBe(200);
    expect(paginatedResponse.data.events).toBeDefined();
  }
  
  // Test filtering by event type
  const filteredResponse = await page.evaluate(async (basketId) => {
    const response = await fetch(`/api/baskets/${basketId}/timeline?event_type=dump.created`);
    return {
      status: response.status,
      data: await response.json()
    };
  }, basketId);
  
  expect(filteredResponse.status).toBe(200);
  const filteredEventTypes = filteredResponse.data.events.map(e => e.event_type);
  filteredEventTypes.forEach(type => {
    expect(type).toBe('dump.created');
  });
});