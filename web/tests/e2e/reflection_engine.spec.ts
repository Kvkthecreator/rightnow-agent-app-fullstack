import { test, expect } from '@playwright/test';
const basketId = process.env.TEST_BASKET_ID;
test.skip(!basketId, 'requires TEST_BASKET_ID to run');

test('reflection engine computation and retrieval', async ({ page }) => {
  // Add some substrate content first
  await page.goto(`/baskets/${basketId}/memory`);
  
  const textarea = page.getByRole('textbox');
  await textarea.fill('This is substrate content for reflection computation');
  await page.getByRole('button', { name: /add|upload/i }).click();
  
  // Wait for the dump to be created
  await expect(page.locator('[data-test=dump-item]')).toHaveCount(1);
  
  // Navigate to a page that would trigger reflection computation
  // (In a real implementation, this might be a dedicated reflections page)
  await page.goto(`/baskets/${basketId}/memory`);
  
  // Test API endpoints directly via fetch
  const reflectionsResponse = await page.evaluate(async (basketId) => {
    const response = await fetch(`/api/baskets/${basketId}/reflections`);
    return {
      status: response.status,
      data: await response.json()
    };
  }, basketId);
  
  expect(reflectionsResponse.status).toBe(200);
  expect(reflectionsResponse.data).toHaveProperty('reflections');
  expect(reflectionsResponse.data).toHaveProperty('has_more');
  
  // Test reflection computation
  const computeResponse = await page.evaluate(async (basketId) => {
    const response = await fetch(`/api/baskets/${basketId}/reflections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        computation_trace_id: crypto.randomUUID()
      })
    });
    return {
      status: response.status,
      data: await response.json()
    };
  }, basketId);
  
  expect(computeResponse.status).toBe(201);
  expect(computeResponse.data).toHaveProperty('id');
  expect(computeResponse.data).toHaveProperty('reflection_text');
  expect(computeResponse.data).toHaveProperty('substrate_window_start');
  expect(computeResponse.data).toHaveProperty('substrate_window_end');
  
  // Verify the reflection appears in subsequent GET requests
  const updatedReflectionsResponse = await page.evaluate(async (basketId) => {
    const response = await fetch(`/api/baskets/${basketId}/reflections`);
    return {
      status: response.status,
      data: await response.json()
    };
  }, basketId);
  
  expect(updatedReflectionsResponse.status).toBe(200);
  expect(updatedReflectionsResponse.data.reflections.length).toBeGreaterThan(0);
  
  const reflection = updatedReflectionsResponse.data.reflections[0];
  expect(reflection).toHaveProperty('id');
  expect(reflection).toHaveProperty('basket_id', basketId);
  expect(reflection).toHaveProperty('reflection_text');
  expect(typeof reflection.reflection_text).toBe('string');
  expect(reflection.reflection_text.length).toBeGreaterThan(0);
});