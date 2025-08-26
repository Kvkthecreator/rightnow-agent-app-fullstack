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
  
  // Test reflection computation via GET with refresh
  const computeResponse = await page.evaluate(async (basketId) => {
    const response = await fetch(`/api/baskets/${basketId}/reflections?refresh=1`);
    return {
      status: response.status,
      data: await response.json()
    };
  }, basketId);
  
  expect(computeResponse.status).toBe(200);
  expect(computeResponse.data).toHaveProperty('reflections');
  expect(computeResponse.data.reflections.length).toBeGreaterThan(0);
  
  const reflection = computeResponse.data.reflections[0];
  expect(reflection).toHaveProperty('id');
  expect(reflection).toHaveProperty('reflection_text');
  expect(reflection).toHaveProperty('substrate_window_start');
  expect(reflection).toHaveProperty('substrate_window_end');
  
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
  
  const firstReflection = updatedReflectionsResponse.data.reflections[0];
  expect(firstReflection).toHaveProperty('id');
  expect(firstReflection).toHaveProperty('basket_id', basketId);
  expect(firstReflection).toHaveProperty('reflection_text');
  expect(typeof firstReflection.reflection_text).toBe('string');
  expect(firstReflection.reflection_text.length).toBeGreaterThan(0);
});
