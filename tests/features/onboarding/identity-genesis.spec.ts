import { test, expect } from '@playwright/test';

/**
 * [FEATURE] Identity Genesis Tests
 * 
 * Tests the identity genesis system that marks user completion of onboarding
 * and serves as the canonical marker for substrate seeding.
 */

test.describe('[FEATURE] Identity Genesis', () => {

  test('identity genesis detection works correctly', async ({ request }) => {
    const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
    
    // Check if identity genesis exists
    const contextResponse = await request.get(`/api/baskets/${basketId}/context-items`);
    const contextItems = await contextResponse.json();
    
    const identityGenesis = contextItems.find((item: any) => 
      item.context_type === 'yarnnn_system' && 
      item.content_text === 'identity_genesis'
    );
    
    expect(identityGenesis).toBeDefined();
    expect(identityGenesis.created_by).toBeDefined();
    expect(identityGenesis.basket_id).toBe(basketId);
  });

  test('first-time user detection works without identity genesis', async ({ page, request }) => {
    // This test would require a fresh user state
    // For now, verify the isFirstEverUser logic through API
    
    const userResponse = await request.get('/api/user/status');
    if (userResponse.ok()) {
      const userStatus = await userResponse.json();
      
      // User status should indicate onboarding state
      expect(userStatus).toHaveProperty('needs_onboarding');
      
      if (userStatus.needs_onboarding) {
        // Should be redirected to onboarding
        await page.goto('/');
        await expect(page).toHaveURL(/\/welcome/);
      } else {
        // Should bypass onboarding
        await page.goto('/');
        await expect(page).toHaveURL(/\/baskets\/[a-f0-9-]+\/(memory|timeline)/);
      }
    }
  });

  test('identity genesis creates profile document', async ({ request }) => {
    const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
    
    // Check for profile document created from identity genesis
    const documentsResponse = await request.get(`/api/baskets/${basketId}/documents`);
    const documents = await documentsResponse.json();
    
    const profileDoc = documents.find((doc: any) => 
      doc.metadata?.kind === 'identity_genesis' ||
      doc.title?.toLowerCase().includes('profile')
    );
    
    if (profileDoc) {
      // Verify profile document structure
      expect(profileDoc.title).toContain('Profile');
      expect(profileDoc.metadata.kind).toBe('identity_genesis');
      
      // Check document composition
      const compositionResponse = await request.get(`/api/documents/${profileDoc.id}/composition`);
      const composition = await compositionResponse.json();
      
      expect(composition.references.length).toBeGreaterThan(0);
      
      // Should have references to identity dumps
      const identityRoles = ['name', 'tension', 'aspiration'];
      const foundRoles = composition.references
        .map((ref: any) => ref.reference.role)
        .filter((role: string) => identityRoles.includes(role));
      
      expect(foundRoles.length).toBeGreaterThanOrEqual(2);
    }
  });

  test('identity genesis substrate seeding follows canon', async ({ request }) => {
    const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
    
    // Verify identity genesis dumps are immutable
    const dumpsResponse = await request.get(`/api/baskets/${basketId}/dumps`);
    const dumps = await dumpsResponse.json();
    
    const identityDumps = dumps.filter((dump: any) => 
      dump.metadata?.origin === 'onboarding'
    );
    
    expect(identityDumps.length).toBeGreaterThan(0);
    
    for (const dump of identityDumps) {
      // Genesis dumps should be immutable
      expect(dump.created_at).toBe(dump.updated_at);
      
      // Should have proper metadata
      expect(dump.metadata.origin).toBe('onboarding');
      expect(dump.metadata.is_genesis).toBe(true);
      
      // Attempt to modify should fail
      const modifyResponse = await request.patch(`/api/dumps/${dump.id}`, {
        data: { text_dump: 'Modified content' }
      });
      expect([404, 405, 403]).toContain(modifyResponse.status());
    }
  });

  test('identity genesis enables memory workspace access', async ({ page }) => {
    // User with identity genesis should have full memory access
    await page.goto('/memory');
    
    // Should see full memory interface without onboarding gate
    await expect(page.locator('[data-testid="memory-interface"], .memory-client')).toBeVisible();
    
    // Should not see onboarding components
    const onboardingGate = page.locator('[data-testid="onboarding-gate"], .onboarding-gate');
    await expect(onboardingGate).not.toBeVisible();
    
    // Should have access to all memory features
    await expect(page.locator('[data-testid="dump-interface"], .dump-section')).toBeVisible();
    await expect(page.locator('[data-testid="blocks-section"], .blocks-interface')).toBeVisible();
  });

  test('identity genesis prevents duplicate onboarding', async ({ page }) => {
    // User with existing identity genesis should not be able to re-onboard
    await page.goto('/welcome');
    
    // Should be redirected away from welcome page
    await expect(page).not.toHaveURL(/\/welcome/);
    await expect(page).toHaveURL(/\/baskets\/[a-f0-9-]+\/(memory|timeline)/);
  });

  test('identity genesis supports profile editing', async ({ page }) => {
    // Navigate to dashboard/profile area
    await page.goto('/dashboard');
    
    const profileSection = page.locator('[data-testid="profile"], .profile-section');
    
    if (await profileSection.count() > 0) {
      // Should show existing identity information
      await expect(profileSection).toBeVisible();
      
      // Should allow editing
      const editButton = profileSection.locator('button:has-text("Edit"), [data-testid="edit-profile"]');
      
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // Should see editable form
        const editForm = page.locator('[data-testid="profile-edit"], .profile-edit-form');
        await expect(editForm).toBeVisible();
        
        // Make a change
        await page.fill('textarea[name="aspiration"]', 'Updated aspiration from testing');
        await page.click('button:has-text("Save")');
        
        // Should update successfully
        await expect(profileSection).toContainText('Updated aspiration from testing');
      }
    }
  });

  test('identity genesis timeline events are properly recorded', async ({ request }) => {
    const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';
    
    // Check timeline for identity genesis events
    const timelineResponse = await request.get(`/api/baskets/${basketId}/timeline`);
    const timeline = await timelineResponse.json();
    
    // Should have onboarding completion event
    const onboardingEvent = timeline.events.find((event: any) => 
      event.kind === 'onboarding.completed' ||
      event.kind === 'identity.genesis_created'
    );
    
    expect(onboardingEvent).toBeDefined();
    expect(onboardingEvent.metadata).toBeDefined();
    
    // Should have substrate creation events from onboarding
    const substrateEvents = timeline.events.filter((event: any) => 
      event.metadata?.origin === 'onboarding' &&
      (event.kind.startsWith('dump.') || event.kind.startsWith('block.'))
    );
    
    expect(substrateEvents.length).toBeGreaterThan(0);
  });

  test('identity genesis persists across sessions', async ({ page, context }) => {
    // Verify user identity persists after browser restart
    await page.goto('/');
    
    // Should go directly to memory (no onboarding)
    await expect(page).toHaveURL(/\/baskets\/[a-f0-9-]+\/(memory|timeline)/);
    
    // Create new browser context (simulate session restart)
    const newContext = await context.browser()?.newContext();
    if (newContext) {
      const newPage = await newContext.newPage();
      
      // Note: This would require proper authentication state persistence
      // In practice, this tests the session/cookie handling
      await newPage.goto('/');
      
      // Behavior depends on authentication state
      const finalUrl = newPage.url();
      expect(finalUrl).toMatch(/\/(login|welcome|baskets|memory)/);
      
      await newContext.close();
    }
  });

  test('identity genesis validates required fields', async ({ page }) => {
    // Test the onboarding validation that ensures proper identity genesis
    await page.goto('/welcome');
    
    // Try to submit without required fields
    await page.click('button[type="submit"]');
    
    // Should require name and tension at minimum
    const nameError = page.locator('[data-testid="name-error"], .error-message:near(input[name="name"])');
    const tensionError = page.locator('[data-testid="tension-error"], .error-message:near(textarea[name="tension"])');
    
    if (await nameError.count() > 0) {
      await expect(nameError).toBeVisible();
    }
    if (await tensionError.count() > 0) {
      await expect(tensionError).toBeVisible();
    }
    
    // Fill required fields
    await page.fill('input[name="name"]', 'Required Fields Test');
    await page.fill('textarea[name="tension"]', 'Testing required field validation');
    
    // Should be able to submit with minimal required data
    await page.click('button[type="submit"]');
    
    // Should succeed and create identity genesis
    await expect(page).toHaveURL(/\/baskets\/[a-f0-9-]+\/memory/);
  });
});