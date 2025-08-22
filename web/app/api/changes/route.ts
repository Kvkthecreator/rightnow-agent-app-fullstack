import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/supabase/clients';
import { ensureWorkspaceServer } from '@/lib/workspaces/ensureWorkspaceServer';
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
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    // Ensure workspace access
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Workspace access required',
          code: 'WORKSPACE_ACCESS_REQUIRED'
        },
        { status: 403 }
      );
    }

    // ========================================================================
    // REQUEST PARSING & VALIDATION
    // ========================================================================

    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        },
        { status: 400 }
      );
    }

    // Extract change request from body
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
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      origin: body.origin || 'user'
    };

    // Basic request validation
    if (!changeRequest.type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Change type is required',
          code: 'MISSING_CHANGE_TYPE',
          validTypes: [
            'basket_update',
            'document_create', 
            'document_update',
            'document_delete',
            'intelligence_approve',
            'intelligence_reject',
            'context_add',
            'block_create',
            'block_update',
            'block_delete'
          ]
        },
        { status: 400 }
      );
    }

    if (!changeRequest.basketId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Basket ID is required',
          code: 'MISSING_BASKET_ID'
        },
        { status: 400 }
      );
    }

    if (!changeRequest.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Change data is required',
          code: 'MISSING_CHANGE_DATA'
        },
        { status: 400 }
      );
    }

    // ========================================================================
    // CHANGE PROCESSING
    // ========================================================================

    console.log(`📝 Processing ${changeRequest.type} change for basket ${changeRequest.basketId} by user ${user.email}`);
    
    const changeService = createUniversalChangeService(supabase, request);
    const result: ChangeResult = await changeService.processChange(changeRequest);

    // ========================================================================
    // RESPONSE FORMATTING
    // ========================================================================

    if (result.success) {
      console.log(`✅ Successfully processed ${changeRequest.type} change: ${result.changeId}`);
      
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
          processingTime: Date.now() - new Date(changeRequest.timestamp).getTime()
        }
      }, { status: 200 });
    } else {
      console.log(`❌ Failed to process ${changeRequest.type} change: ${result.changeId}`, {
        errors: result.errors,
        conflicts: result.conflicts
      });

      // Determine response status based on failure type
      let status = 500; // Default to server error
      
      if (result.status === 'conflicted') {
        status = 409; // Conflict
      } else if (result.errors?.some(e => e.includes('not found') || e.includes('access denied'))) {
        status = 404; // Not found
      } else if (result.errors?.some(e => e.includes('required') || e.includes('invalid'))) {
        status = 400; // Bad request
      }

      return NextResponse.json({
        success: false,
        changeId: result.changeId,
        status: result.status,
        errors: result.errors,
        conflicts: result.conflicts,
        rollbackInfo: result.rollbackInfo,
        metadata: {
          type: changeRequest.type,
          basketId: changeRequest.basketId,
          timestamp: changeRequest.timestamp
        }
      }, { status });
    }

  } catch (error) {
    console.error('💥 Universal Change API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during change processing',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// ADDITIONAL ENDPOINTS FOR CHANGE MANAGEMENT
// ============================================================================

/**
 * GET /api/changes - Retrieve change timeline and pending changes
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const basketId = searchParams.get('basketId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!basketId) {
      return NextResponse.json(
        { error: 'basketId parameter is required' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('events')
      .select('*')
      .eq('basket_id', basketId)
      .like('kind', 'change_%')
      .order('ts', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('payload->status', status);
    }

    if (type) {
      query = query.eq('payload->type', type);
    }

    const { data: events, error: queryError } = await query;

    if (queryError) {
      console.error('Failed to fetch change timeline:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch change timeline' },
        { status: 500 }
      );
    }

    // Transform events to change format
    const changes = events.map(event => ({
      id: event.payload?.changeId || event.id,
      type: event.payload?.type,
      status: event.payload?.status,
      data: event.payload?.data,
      actorId: event.payload?.actorId,
      timestamp: event.ts,
      metadata: event.payload?.metadata
    }));

    return NextResponse.json({
      changes,
      pagination: {
        limit,
        offset,
        total: changes.length,
        hasMore: changes.length === limit
      }
    });

  } catch (error) {
    console.error('Change timeline API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
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