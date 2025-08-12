import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET basket deltas - Proxy to external backend with CORS handling
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: basketId } = await context.params;
    const supabase = createServerSupabaseClient();
    
    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Ensure user has a workspace and can access this basket
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      return NextResponse.json(
        { error: "Failed to get workspace" },
        { status: 500 }
      );
    }

    // Verify basket exists and user has access
    const { data: basket, error: basketError } = await supabase
      .from("baskets")
      .select("id")
      .eq("id", basketId)
      .eq("workspace_id", workspace.id)
      .single();

    if (basketError || !basket) {
      return NextResponse.json(
        { error: "Basket not found or access denied" },
        { status: 404 }
      );
    }

    // Try external backend first, fallback to local data
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://rightnow-api.onrender.com';
    const endpoint = `${backendUrl}/api/baskets/${basketId}/deltas`;
    
    console.log('🔄 Deltas Proxy: Attempting backend call:', endpoint);
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NextJS-Proxy/1.0',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        const deltas = await response.json();
        console.log('✅ Deltas Proxy: Backend success:', deltas?.length || 0, 'deltas');
        
        // Add CORS headers
        const corsResponse = NextResponse.json(deltas);
        corsResponse.headers.set('Access-Control-Allow-Origin', '*');
        corsResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        corsResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        return corsResponse;
      } else {
        console.warn('⚠️ Deltas Proxy: Backend failed:', response.status, response.statusText);
      }
    } catch (fetchError) {
      console.warn('⚠️ Deltas Proxy: Backend unreachable:', fetchError instanceof Error ? fetchError.message : 'Unknown error');
    }

    // Fallback: Return local mock data or empty array
    console.log('🔄 Deltas Proxy: Using fallback - returning empty deltas array');
    
    const fallbackDeltas = [
      {
        delta_id: `mock-${Date.now()}`,
        basket_id: basketId,
        summary: "System initializing - no deltas available yet",
        created_at: new Date().toISOString(),
        status: "info",
        changes: [],
        metadata: {
          source: "fallback",
          reason: "backend_unavailable"
        }
      }
    ];

    const response = NextResponse.json(fallbackDeltas);
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;

  } catch (error) {
    console.error('❌ Deltas Proxy error:', error);
    const errorResponse = NextResponse.json(
      { 
        error: 'Failed to fetch deltas',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    
    // Add CORS headers even for errors
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}