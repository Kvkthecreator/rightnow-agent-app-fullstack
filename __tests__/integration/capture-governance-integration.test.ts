/**
 * Integration Tests: Capture → Governance → Substrate Pipeline
 * 
 * End-to-end verification of governance-compliant capture workflow.
 * Tests both policy routing paths and substrate state changes.
 */

import { test, expect } from '@playwright/test';

test.describe('Capture Governance Integration', () => {

  test('should create dump via direct route when governance allows', async ({ page, request }) => {
    // Navigate to basket page to initialize context
    await page.goto(`/baskets/${process.env.TEST_BASKET_ID}`);
    
    // Trigger capture modal via hotkey
    await page.keyboard.press('Meta+Shift+KeyV');
    
    // Fill in capture content
    const captureText = `Integration test dump - ${Date.now()}`;
    await page.fill('[data-testid="dump-textarea"]', captureText);
    
    // Submit capture
    await page.click('[data-testid="dump-submit"]');
    
    // Should show success message for direct commit
    await expect(page.locator('.toast')).toContainText('Dump saved');
    
    // Verify dump exists in substrate via API
    const dumpsResponse = await request.get(`/api/baskets/${process.env.TEST_BASKET_ID}/dumps`);
    expect(dumpsResponse.ok()).toBeTruthy();
    
    const dumps = await dumpsResponse.json();
    const createdDump = dumps.find((d: any) => d.text_dump?.includes(captureText));
    expect(createdDump).toBeDefined();
  });

  test('should create proposal when governance requires review', async ({ page, request }) => {
    // This test assumes workspace configured with ep_onboarding_dump: 'proposal'
    
    await page.goto(`/baskets/${process.env.TEST_BASKET_ID}`);
    await page.keyboard.press('Meta+Shift+KeyV');
    
    const captureText = `Governance review test - ${Date.now()}`;
    await page.fill('[data-testid="dump-textarea"]', captureText);
    await page.click('[data-testid="dump-submit"]');
    
    // Should show proposal creation message
    await expect(page.locator('.toast')).toContainText(/proposed for review|pending review/);
    
    // Verify proposal exists in governance
    const proposalsResponse = await request.get(`/api/baskets/${process.env.TEST_BASKET_ID}/proposals`);
    expect(proposalsResponse.ok()).toBeTruthy();
    
    const proposals = await proposalsResponse.json();
    const captureProposal = proposals.find((p: any) => 
      p.proposal_kind === 'Capture' && 
      p.ops?.some((op: any) => op.data?.text_dump?.includes(captureText))
    );
    expect(captureProposal).toBeDefined();
    expect(captureProposal.status).toBe('PROPOSED');
  });

  test('should enforce workspace membership for capture', async ({ request }) => {
    // Test capture API with unauthorized user (if test supports multi-user)
    const unauthorizedResponse = await request.post('/api/dumps/new', {
      data: {
        basket_id: 'unauthorized-basket-id',
        dump_request_id: crypto.randomUUID(),
        text_dump: 'Unauthorized capture attempt'
      }
    });

    expect([403, 404]).toContain(unauthorizedResponse.status());
  });

  test('should maintain timeline event creation for both routes', async ({ request }) => {
    const dumpRequestId = crypto.randomUUID();
    const captureText = `Timeline test - ${Date.now()}`;
    
    // Create dump through governance workflow
    const captureResponse = await request.post('/api/dumps/new', {
      data: {
        basket_id: process.env.TEST_BASKET_ID,
        dump_request_id: dumpRequestId,
        text_dump: captureText
      }
    });

    expect(captureResponse.ok()).toBeTruthy();
    const result = await captureResponse.json();
    
    // Wait for timeline processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify timeline events were created
    const timelineResponse = await request.get(`/api/baskets/${process.env.TEST_BASKET_ID}/timeline`);
    expect(timelineResponse.ok()).toBeTruthy();
    
    const timeline = await timelineResponse.json();
    
    if (result.route === 'direct') {
      // Should have substrate.committed event
      const commitEvent = timeline.find((event: any) => 
        event.event_type === 'substrate.committed.direct' &&
        event.event_data?.entry_point === 'onboarding_dump'
      );
      expect(commitEvent).toBeDefined();
    } else {
      // Should have proposal.submitted event
      const proposalEvent = timeline.find((event: any) => 
        event.event_type === 'proposal.submitted' &&
        event.event_data?.proposal_kind === 'Capture'
      );
      expect(proposalEvent).toBeDefined();
    }
  });

  test('should validate ChangeDescriptor format in Decision Gateway', async ({ request }) => {
    // Test malformed ChangeDescriptor
    const response = await request.post('/api/changes', {
      data: {
        entry_point: 'onboarding_dump',
        // Missing required fields: actor_id, workspace_id, ops
        basket_id: process.env.TEST_BASKET_ID
      }
    });

    expect(response.status()).toBe(400);
    const result = await response.json();
    expect(result.error).toContain('Invalid change descriptor');
    expect(result.validation_errors).toBeDefined();
  });

  test('should enforce CreateDump operation validation', async ({ request }) => {
    // Test CreateDump with missing required data
    const response = await request.post('/api/changes', {
      data: {
        entry_point: 'onboarding_dump',
        basket_id: process.env.TEST_BASKET_ID,
        ops: [{
          type: 'CreateDump',
          data: {
            // Missing dump_request_id and content
          }
        }]
      }
    });

    expect(response.status()).toBe(400);
    const result = await response.json();
    expect(result.validation_errors).toContain('dump_request_id required for CreateDump');
  });

  test('should preserve provenance in governance-routed captures', async ({ request }) => {
    const dumpRequestId = crypto.randomUUID();
    
    const response = await request.post('/api/dumps/new', {
      data: {
        basket_id: process.env.TEST_BASKET_ID,
        dump_request_id: dumpRequestId,
        text_dump: 'Provenance tracking test',
        meta: {
          client_ts: new Date().toISOString(),
          source: 'integration_test'
        }
      }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    
    if (result.route === 'proposal') {
      // Verify proposal includes provenance
      const proposalsResponse = await request.get(`/api/baskets/${process.env.TEST_BASKET_ID}/proposals`);
      const proposals = await proposalsResponse.json();
      
      const captureProposal = proposals.find((p: any) => 
        p.ops?.some((op: any) => op.data?.dump_request_id === dumpRequestId)
      );
      
      expect(captureProposal.provenance).toBeDefined();
      expect(captureProposal.provenance).toContainEqual(
        expect.objectContaining({ type: 'user' })
      );
    }
  });
});