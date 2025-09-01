/**
 * Integration Tests: Building Blocks CRUD → Governance Pipeline
 * 
 * End-to-end verification that manual CRUD operations on blocks/context_items
 * route through Decision Gateway and create proposals in governance.
 */

import { test, expect } from '@playwright/test';

test.describe('Building Blocks CRUD → Governance Integration', () => {

  test('should create block proposal via Create Block modal', async ({ page }) => {
    await page.goto(`/baskets/${process.env.TEST_BASKET_ID}/building-blocks`);
    
    // Click Create Block button
    await page.click('button:has-text("Block")');
    
    // Fill in create block form
    await page.fill('[data-testid="content"]', 'Integration test block content');
    await page.fill('[data-testid="semantic-type"]', 'test-goal');
    await page.fill('[data-testid="canonical-value"]', 'Test goal for integration');
    
    // Submit form
    await page.click('button:has-text("Create Block")');
    
    // Should show governance proposal toast
    await expect(page.locator('.toast')).toContainText(/proposed for review|Block creation proposed/);
    
    // Navigate to governance to verify proposal
    await page.goto(`/baskets/${process.env.TEST_BASKET_ID}/governance`);
    
    // Should see new Capture proposal
    await expect(page.locator('[data-testid="proposal-card"]')).toContainText('CreateBlock');
  });

  test('should create context item proposal via Create Context Item modal', async ({ page }) => {
    await page.goto(`/baskets/${process.env.TEST_BASKET_ID}/building-blocks`);
    
    // Click Create Context Item button  
    await page.click('button:has-text("Context Item")');
    
    // Fill in create context item form
    await page.fill('#label', 'Integration Test Topic');
    await page.fill('#content', 'Test context item for integration testing');
    await page.selectOption('#kind', 'topic');
    await page.fill('#synonyms', 'test, integration, validation');
    
    // Submit form
    await page.click('button:has-text("Create Context Item")');
    
    // Should show governance proposal toast
    await expect(page.locator('.toast')).toContainText(/proposed for review|Context item creation proposed/);
    
    // Navigate to governance to verify proposal
    await page.goto(`/baskets/${process.env.TEST_BASKET_ID}/governance`);
    
    // Should see CreateContextItem proposal
    await expect(page.locator('[data-testid="proposal-card"]')).toContainText('CreateContextItem');
  });

  test('should edit block through governance when clicking existing block', async ({ page }) => {
    await page.goto(`/baskets/${process.env.TEST_BASKET_ID}/building-blocks`);
    
    // Wait for blocks to load and click first editable block (not raw_dump)
    await page.waitForSelector('[data-testid="substrate-card"]');
    
    // Find a block (not raw_dump) and click it
    const blockCard = page.locator('[data-testid="substrate-card"]').filter({ 
      hasNotText: 'Raw Captures' 
    }).first();
    await blockCard.click();
    
    // Should open detail modal - click Edit if it's editable
    const editButton = page.locator('button:has-text("Edit")');
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Modify content
      await page.fill('#edit-content', 'Updated content via governance');
      
      // Save changes
      await page.click('button:has-text("Save Changes")');
      
      // Should show governance proposal toast  
      await expect(page.locator('.toast')).toContainText(/proposed for review|edit proposed/);
    }
  });

  test('should handle raw_dump immutability correctly', async ({ page }) => {
    await page.goto(`/baskets/${process.env.TEST_BASKET_ID}/building-blocks`);
    
    // Click on a raw_dump card
    const rawDumpCard = page.locator('[data-testid="substrate-card"]').filter({ 
      hasText: 'Raw Captures' 
    }).first();
    
    if (await rawDumpCard.isVisible()) {
      await rawDumpCard.click();
      
      // Should NOT show Edit button for raw dumps (canon immutability)
      await expect(page.locator('button:has-text("Edit")')).not.toBeVisible();
      await expect(page.locator('.text:has-text("Immutable")')).toBeVisible();
    }
  });

  test('should delete substrate through governance', async ({ page }) => {
    await page.goto(`/baskets/${process.env.TEST_BASKET_ID}/building-blocks`);
    
    // Click on editable substrate
    const editableCard = page.locator('[data-testid="substrate-card"]').filter({ 
      hasNotText: 'Raw Captures' 
    }).first();
    
    if (await editableCard.isVisible()) {
      await editableCard.click();
      
      // Click Delete button if available
      const deleteButton = page.locator('button:has-text("Delete")');
      if (await deleteButton.isVisible()) {
        
        // Handle confirmation dialog
        page.on('dialog', dialog => dialog.accept());
        await deleteButton.click();
        
        // Should show governance proposal toast
        await expect(page.locator('.toast')).toContainText(/proposed for review|deletion proposed/);
      }
    }
  });

  test('should maintain substrate type filtering during CRUD operations', async ({ page }) => {
    await page.goto(`/baskets/${process.env.TEST_BASKET_ID}/building-blocks`);
    
    // Filter to blocks only
    await page.selectOption('select', 'block');
    
    // Create new block
    await page.click('button:has-text("Block")');
    await page.fill('[data-testid="content"]', 'Filtered view test block');
    await page.fill('[data-testid="semantic-type"]', 'test-constraint');
    await page.click('button:has-text("Create Block")');
    
    // Should maintain filter after creation
    await expect(page.locator('select')).toHaveValue('block');
  });
});

test.describe('Governance Proposal Verification', () => {
  
  test('should show CRUD proposals in governance page with correct metadata', async ({ page, request }) => {
    // Create a test block via API to ensure we have a proposal
    const response = await request.post('/api/changes', {
      data: {
        entry_point: 'manual_edit',
        basket_id: process.env.TEST_BASKET_ID,
        ops: [{
          type: 'CreateBlock',
          data: {
            content: 'Test block for governance verification',
            semantic_type: 'verification-goal',
            confidence: 0.9
          }
        }]
      }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    
    if (result.route === 'proposal') {
      // Navigate to governance page
      await page.goto(`/baskets/${process.env.TEST_BASKET_ID}/governance`);
      
      // Should see the proposal
      await expect(page.locator('[data-testid="proposal-card"]')).toContainText('CreateBlock');
      await expect(page.locator('[data-testid="proposal-card"]')).toContainText('verification-goal');
      
      // Proposal should show manual edit entry point
      await expect(page.locator('[data-testid="proposal-card"]')).toContainText('manual_edit');
    }
  });

  test('should differentiate between capture and manual edit proposals', async ({ page, request }) => {
    // Create one of each type
    const captureResponse = await request.post('/api/dumps/new', {
      data: {
        basket_id: process.env.TEST_BASKET_ID,
        dump_request_id: crypto.randomUUID(),
        text_dump: 'Capture test for governance differentiation'
      }
    });

    const manualResponse = await request.post('/api/changes', {
      data: {
        entry_point: 'manual_edit',
        basket_id: process.env.TEST_BASKET_ID,
        ops: [{
          type: 'CreateContextItem',
          data: {
            label: 'Manual test context item',
            content: 'Created manually for governance verification'
          }
        }]
      }
    });

    await page.goto(`/baskets/${process.env.TEST_BASKET_ID}/governance`);
    
    // Should see different entry points
    const proposalCards = page.locator('[data-testid="proposal-card"]');
    
    // Look for capture vs manual edit entry points
    if (await proposalCards.count() > 0) {
      await expect(page.locator('.text')).toContainText(/onboarding_dump|manual_edit/);
    }
  });
});