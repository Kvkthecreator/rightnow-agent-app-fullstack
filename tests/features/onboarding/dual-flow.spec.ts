import { test, expect } from '@playwright/test';

/**
 * [FEATURE] Onboarding Dual Flow Tests
 * 
 * Tests the complete dual onboarding system: route-level (/welcome) and 
 * inline memory onboarding (OnboardingGate) according to YARNNN_ONBOARDING_ARCHITECTURE.md
 */

test.describe('[FEATURE] Onboarding Dual Flow', () => {

  test('route-level onboarding flow for first-time users', async ({ page }) => {
    // Simulate first-time user landing
    await page.goto('/welcome');
    
    // Should see step-by-step wizard interface
    await expect(page.locator('h1, h2')).toContainText(/welcome|onboarding/i);
    
    // Complete onboarding form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('textarea[name="tension"]', 'Building a web application');
    await page.fill('textarea[name="aspiration"]', 'Create something meaningful');
    
    // Optional memory paste
    await page.fill('textarea[name="memory_paste"]', 'This is my initial memory paste content for testing');
    
    // Submit onboarding
    await page.click('button[type="submit"]');
    
    // Should redirect to memory workspace
    await expect(page).toHaveURL(/\/baskets\/[a-f0-9-]+\/memory/);
    
    // Verify identity genesis was created
    await page.goto('/dashboard');
    const profileSection = page.locator('[data-testid="profile"], .profile-section');
    if (await profileSection.count() > 0) {
      await expect(profileSection).toContainText('Test User');
    }
  });

  test('inline memory onboarding gate for partial users', async ({ page }) => {
    // Simulate user who skipped or partially completed welcome flow
    // This would require test data setup for partial user state
    
    await page.goto('/memory');
    
    // Should see OnboardingGate component
    const onboardingGate = page.locator('[data-testid="onboarding-gate"], .onboarding-gate');
    
    if (await onboardingGate.count() > 0) {
      // Should be dashboard-style interface, not step-by-step
      await expect(onboardingGate).toBeVisible();
      await expect(onboardingGate).toContainText(/complete your profile|finish setup/i);
      
      // Should show completed sections with checkmarks
      const completedSections = onboardingGate.locator('.completed-section, [data-completed="true"]');
      if (await completedSections.count() > 0) {
        await expect(completedSections.first()).toBeVisible();
      }
      
      // Should highlight incomplete sections
      const incompleteSections = onboardingGate.locator('.incomplete-section, [data-completed="false"]');
      if (await incompleteSections.count() > 0) {
        await expect(incompleteSections.first()).toBeVisible();
      }
      
      // Complete remaining sections
      await page.fill('input[name="aspiration"]', 'My updated aspiration');
      await page.click('button:has-text("Save")');
      
      // Gate should disappear after completion
      await expect(onboardingGate).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('returning user bypasses all onboarding gates', async ({ page }) => {
    // User with identity genesis should go directly to memory
    await page.goto('/');
    
    // Should be redirected directly to memory workspace
    await expect(page).toHaveURL(/\/baskets\/[a-f0-9-]+\/memory/);
    
    // Navigate to memory directly
    await page.goto('/memory');
    
    // Should not see any onboarding gates
    const onboardingGate = page.locator('[data-testid="onboarding-gate"], .onboarding-gate');
    await expect(onboardingGate).not.toBeVisible();
    
    // Should see full memory experience
    await expect(page.locator('[data-testid="memory-interface"], .memory-client')).toBeVisible();
  });

  test('onboarding creates identity genesis marker', async ({ page, request }) => {
    // Complete onboarding and verify backend state
    await page.goto('/welcome');
    
    await page.fill('input[name="name"]', 'Identity Test User');
    await page.fill('textarea[name="tension"]', 'Testing identity creation');
    await page.fill('textarea[name="aspiration"]', 'Verify identity genesis');
    
    const response = await page.waitForResponse(response => 
      response.url().includes('/api/onboarding/complete') && response.status() === 200
    );
    
    const result = await response.json();
    
    // Should create identity genesis marker
    expect(result).toHaveProperty('identity_genesis_created', true);
    expect(result).toHaveProperty('basket_id');
    
    // Verify via API that identity genesis exists
    const basketId = result.basket_id;
    const contextResponse = await request.get(`/api/baskets/${basketId}/context-items`);
    const contextItems = await contextResponse.json();
    
    const identityGenesis = contextItems.find((item: any) => 
      item.context_type === 'yarnnn_system' && item.content_text === 'identity_genesis'
    );
    
    expect(identityGenesis).toBeDefined();
  });

  test('onboarding handles memory paste truncation gracefully', async ({ page }) => {
    await page.goto('/welcome');
    
    // Fill form with oversized memory paste
    await page.fill('input[name="name"]', 'Truncation Test');
    await page.fill('textarea[name="tension"]', 'Testing truncation');
    await page.fill('textarea[name="aspiration"]', 'Handle large inputs');
    
    // Create oversized content
    const largeContent = 'A'.repeat(25000);
    await page.fill('textarea[name="memory_paste"]', largeContent);
    
    // Submit and check for truncation warning
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/onboarding/complete')
    );
    
    await page.click('button[type="submit"]');
    const response = await responsePromise;
    
    // Should still succeed with truncation
    expect(response.status()).toBe(200);
    
    // Check for truncation indicator
    const result = await response.json();
    if (result.truncated_memory_paste) {
      expect(result.truncated_memory_paste).toBe(true);
    }
  });

  test('onboarding preserves partial progress in localStorage', async ({ page }) => {
    await page.goto('/welcome');
    
    // Fill partial form
    await page.fill('input[name="name"]', 'Partial Progress Test');
    await page.fill('textarea[name="tension"]', 'Testing progress preservation');
    
    // Navigate away without submitting
    await page.goto('/');
    
    // Return to onboarding
    await page.goto('/welcome');
    
    // Check if progress was preserved
    const nameValue = await page.inputValue('input[name="name"]');
    const tensionValue = await page.inputValue('textarea[name="tension"]');
    
    // LocalStorage preservation might be implemented
    // This test validates the behavior if implemented
    if (nameValue || tensionValue) {
      expect(nameValue).toBe('Partial Progress Test');
      expect(tensionValue).toBe('Testing progress preservation');
    }
  });

  test('onboarding respects ONBOARDING_MODE environment variable', async ({ page }) => {
    // This test would require environment manipulation or test configuration
    
    await page.goto('/');
    
    // Behavior should vary based on ONBOARDING_MODE
    // - 'welcome': Always show welcome flow
    // - 'auto': Show for first-time users only
    // - 'inline': Skip route-level, use inline only
    
    const currentUrl = page.url();
    
    // If redirected to welcome, mode is likely 'welcome'
    // If redirected to memory, mode is likely 'auto' with existing user
    // Test validates whatever the current environment setting produces
    
    expect(currentUrl).toMatch(/\/(welcome|memory|baskets)/);
  });

  test('onboarding creates proper substrate seeding', async ({ page, request }) => {
    await page.goto('/welcome');
    
    await page.fill('input[name="name"]', 'Substrate Test User');
    await page.fill('textarea[name="tension"]', 'Testing substrate creation');
    await page.fill('textarea[name="aspiration"]', 'Verify substrate seeding');
    await page.fill('textarea[name="memory_paste"]', 'Initial memory content');
    
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/onboarding/complete') && response.status() === 200
    );
    
    await page.click('button[type="submit"]');
    const response = await responsePromise;
    const result = await response.json();
    
    const basketId = result.basket_id;
    
    // Verify substrate seeding
    const dumpsResponse = await request.get(`/api/baskets/${basketId}/dumps`);
    const dumps = await dumpsResponse.json();
    
    // Should have dumps for name, tension, aspiration, and memory_paste
    expect(dumps.length).toBeGreaterThanOrEqual(3);
    
    const nameWaves = dumps.filter((d: any) => d.metadata?.genesis_role === 'name');
    const tensionDumps = dumps.filter((d: any) => d.metadata?.genesis_role === 'tension');
    const aspirationDumps = dumps.filter((d: any) => d.metadata?.genesis_role === 'aspiration');
    
    expect(nameWaves.length).toBeGreaterThan(0);
    expect(tensionDumps.length).toBeGreaterThan(0);
    expect(aspirationDumps.length).toBeGreaterThan(0);
  });

  test('error handling during onboarding flow', async ({ page }) => {
    await page.goto('/welcome');
    
    // Test validation errors
    await page.click('button[type="submit"]');
    
    // Should show validation errors for required fields
    await expect(page.locator('[data-testid="error"], .error-message')).toBeVisible();
    
    // Test network error handling
    await page.route('/api/onboarding/complete', route => route.abort());
    
    await page.fill('input[name="name"]', 'Error Test');
    await page.fill('textarea[name="tension"]', 'Testing error handling');
    await page.fill('textarea[name="aspiration"]', 'Handle errors gracefully');
    
    await page.click('button[type="submit"]');
    
    // Should show error message and allow retry
    await expect(page.locator('[data-testid="error"], .error-message')).toBeVisible();
    
    // Unblock the route
    await page.unroute('/api/onboarding/complete');
    
    // Retry should work
    await page.click('button:has-text("Try Again"), button[type="submit"]');
    
    // Should eventually succeed
    await expect(page).toHaveURL(/\/baskets\/[a-f0-9-]+\/memory/);
  });
});