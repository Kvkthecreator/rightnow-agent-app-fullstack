import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/supabase/clients';
import { ensureWorkspaceServer } from '@/lib/workspaces/ensureWorkspaceServer';
import { routeChange } from '@/lib/governance/decisionGateway';
import type { ChangeDescriptor } from '@/lib/governance/changeDescriptor';
import { validateChangeDescriptor } from '@/lib/governance/changeDescriptor';
import { getWorkspaceGovernanceStatus } from '@/lib/governance/flagsServer';
// Legacy import for backward compatibility
import { createUniversalChangeService, type ChangeRequest, type ChangeResult } from '@/lib/services/UniversalChangeService';

// ============================================================================
// UNIVERSAL CHANGE API ENDPOINT
// ============================================================================

/**
 * Universal Change API - Single endpoint for ALL substrate modifications
 * 
 * This endpoint replaces all individual change APIs:
 * - /api/baskets/[id] (PATCH)
 * - /api/documents (POST/PATCH)
 * - /api/intelligence/approve/[basketId]
 * - /api/intelligence/reject/[basketId]  
 * - /api/substrate/add-context
 * - And more...
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // ========================================================================
    // AUTHENTICATION & AUTHORIZATION
    // ========================================================================
    
    const { user, workspace } = await ensureWorkspaceServer(supabase);
    
    if (!user || !workspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ========================================================================
    // REQUEST PARSING & GOVERNANCE ROUTING
    // ========================================================================

    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON'
      }, { status: 400 });
    }

    // Check if this is a new governance ChangeDescriptor or legacy format
    const isGovernanceFormat = body.entry_point && body.ops && Array.isArray(body.ops);
    
    if (isGovernanceFormat) {
      // ====================================================================
      // NEW: Governance ChangeDescriptor Format
      // ====================================================================
      
      const changeDescriptor: ChangeDescriptor = {
        entry_point: body.entry_point,
        actor_id: user.id,
        workspace_id: workspace.id,
        basket_id: body.basket_id,
        basis_snapshot_id: body.basis_snapshot_id,
        blast_radius: body.blast_radius,
        ops: body.ops,
        provenance: body.provenance
      };
      
      // Validate change descriptor
      const validation = validateChangeDescriptor(changeDescriptor);
      if (!validation.valid) {
        return NextResponse.json({ 
          error: "Invalid change descriptor",
          validation_errors: validation.errors 
        }, { status: 400 });
      }

      // Route through Decision Gateway
      const result = await routeChange(supabase, changeDescriptor);

      // Return governance-aware response
      if (result.committed) {
        return NextResponse.json({
          success: true,
          route: 'direct',
          committed: true,
          operations_executed: result.execution_summary?.operations_executed || 0,
          execution_time_ms: result.execution_summary?.execution_time_ms || 0,
          timeline_events: result.execution_summary?.timeline_events_emitted || 0,
          decision_reason: result.decision.reason,
          blast_radius: result.decision.effective_blast_radius
        });
      } else {
        return NextResponse.json({
          success: true,
          route: 'proposal',
          proposal_id: result.proposal_id,
          requires_approval: true,
          validator_confidence: result.validation_report?.confidence || null,
          impact_summary: result.validation_report?.impact_summary || 'Pending review',
          decision_reason: result.decision.reason,
          blast_radius: result.decision.effective_blast_radius
        });
      }
      
    } else {
      // ====================================================================
      // LEGACY: Universal Change Service Format (Deprecated)
      // ====================================================================
      
      console.warn('Using legacy change format - consider migrating to ChangeDescriptor');
      
      // Extract legacy change request
      const changeRequest: ChangeRequest = {
        id: body.id || crypto.randomUUID(),
        type: body.type,
        basketId: body.basketId,
        workspaceId: workspace.id,
        actorId: user.id,
        data: body.data,
        metadata: {
          ...body.metadata,
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          timestamp: new Date().toISOString(),
          legacy_format: true
        },
        timestamp: new Date().toISOString(),
        origin: body.origin || 'user'
      };

      // Basic validation
      if (!changeRequest.type || !changeRequest.basketId || !changeRequest.data) {
        return NextResponse.json({
          error: 'Missing required fields: type, basketId, data'
        }, { status: 400 });
      }

      // Process through legacy service
      const changeService = createUniversalChangeService(supabase, request);
      const result: ChangeResult = await changeService.processChange(changeRequest);

      // Return legacy format response
      if (result.success) {
        return NextResponse.json({
          success: true,
          changeId: result.changeId,
          status: result.status,
          data: result.appliedData,
          warnings: result.warnings,
          metadata: {
            type: changeRequest.type,
            basketId: changeRequest.basketId,
            timestamp: changeRequest.timestamp,
            processingTime: Date.now() - new Date(changeRequest.timestamp).getTime(),
            governance_note: 'Processed via legacy path - consider migrating to ChangeDescriptor'
          }
        });
      } else {
        const status = result.status === 'conflicted' ? 409 : 500;
        return NextResponse.json({
          success: false,
          changeId: result.changeId,
          status: result.status,
          errors: result.errors,
          conflicts: result.conflicts,
          rollbackInfo: result.rollbackInfo
        }, { status });
      }
    }

  } catch (error) {
    console.error('Changes API error:', error);
    
    return NextResponse.json({
      error: "Failed to process change",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// ============================================================================
// ADDITIONAL ENDPOINTS FOR CHANGE MANAGEMENT
// ============================================================================

/**
 * GET /api/changes - Governance status and capabilities
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { user, workspace } = await ensureWorkspaceServer(supabase);
    
    if (!user || !workspace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return changes API capabilities and workspace governance status
    const governanceStatus = await getWorkspaceGovernanceStatus(supabase, workspace.id);

    return NextResponse.json({
      api_version: "v2.1",
      capabilities: {
        change_routing: true,
        governance_policies: true,
        atomic_operations: true,
        risk_assessment: true,
        timeline_events: true,
        legacy_compatibility: true
      },
      governance_status: governanceStatus,
      supported_entry_points: [
        'onboarding_dump',
        'manual_edit', 
        'document_edit',
        'reflection_suggestion',
        'graph_action',
        'timeline_restore'
      ],
      supported_operations: [
        'CreateDump',
        'CreateBlock',
        'ReviseBlock', 
        'CreateContextItem',
        'AttachContextItem',
        'MergeContextItems',
        'PromoteScope',
        'Detach',
        'Rename',
        'ContextAlias',
        'DocumentEdit'
      ],
      formats: {
        governance: {
          description: "New ChangeDescriptor format with entry_point and ops array",
          example: {
            entry_point: "manual_edit",
            basket_id: "uuid",
            ops: [{ type: "CreateBlock", data: { content: "...", semantic_type: "goal" } }]
          }
        },
        legacy: {
          description: "Existing Universal Change Service format (deprecated)",
          example: {
            type: "block_create",
            basketId: "uuid", 
            data: { content: "...", semantic_type: "goal" }
          }
        }
      }
    });

  } catch (error) {
    console.error('Changes API status error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// ============================================================================
// LEGACY API COMPATIBILITY (TEMPORARY)
// ============================================================================

/**
 * During migration, this endpoint can also handle requests from legacy APIs
 * by transforming them to the universal format
 */
export async function PUT(request: NextRequest) {
  // Handle legacy PUT requests by converting to universal format
  const body = await request.json();
  
  // Transform legacy request to universal format
  const legacyRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({
      type: 'legacy_update', // Will be determined based on URL pattern
      basketId: body.basketId,
      data: body,
      origin: 'legacy_api'
    })
  });

  // Forward to POST handler
  return POST(legacyRequest as NextRequest);
}

export async function PATCH(request: NextRequest) {
  // Handle legacy PATCH requests
  const body = await request.json();
  
  const legacyRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({
      type: 'legacy_patch',
      basketId: body.basketId,
      data: body,
      origin: 'legacy_api'
    })
  });

  return POST(legacyRequest as NextRequest);
}

export async function DELETE(request: NextRequest) {
  // Handle legacy DELETE requests
  const { searchParams } = new URL(request.url);
  const basketId = searchParams.get('basketId');
  const documentId = searchParams.get('documentId');
  const blockId = searchParams.get('blockId');

  let deleteType = 'unknown_delete';
  let deleteData = {};

  if (documentId) {
    deleteType = 'document_delete';
    deleteData = { documentId };
  } else if (blockId) {
    deleteType = 'block_delete';
    deleteData = { blockId };
  }

  const legacyRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({
      type: deleteType,
      basketId,
      data: deleteData,
      origin: 'legacy_api'
    })
  });

  return POST(legacyRequest as NextRequest);
}
