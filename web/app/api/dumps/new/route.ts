import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";

// POST new raw dump - Proxy to external backend with CORS handling
export async function POST(request: NextRequest) {
  try {
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

    // Ensure user has a workspace
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      return NextResponse.json(
        { error: "Failed to get workspace" },
        { status: 500 }
      );
    }

    const body = await request.json();
    // Support both old and new field names for compatibility
    const { 
      basket_id, 
      body_md, 
      text_dump,
      file_refs = [], 
      file_urls = [] 
    } = body;

    // Use new field names if provided, fall back to old names
    const content = text_dump || body_md;
    const files = file_urls.length > 0 ? file_urls : file_refs;

    if (!basket_id || !content) {
      return NextResponse.json(
        { error: "basket_id and content (text_dump or body_md) are required" },
        { status: 400 }
      );
    }

    // Verify basket exists and user has access
    const { data: basket, error: basketError } = await supabase
      .from("baskets")
      .select("id")
      .eq("id", basket_id)
      .eq("workspace_id", workspace.id)
      .single();

    if (basketError || !basket) {
      return NextResponse.json(
        { error: "Basket not found or access denied" },
        { status: 404 }
      );
    }

    // Try external backend first, fallback to local storage
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://rightnow-api.onrender.com';
    const endpoint = `${backendUrl}/api/dump`;
    
    console.log('🔄 Dump Proxy: Attempting backend call:', endpoint);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NextJS-Proxy/1.0',
        },
        body: JSON.stringify({
          basket_id,
          text_dump: content,  // Use mapped field name
          file_urls: files     // Use mapped field name
        }),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Dump Proxy: Backend success:', result);
        
        // Add CORS headers
        const corsResponse = NextResponse.json(result);
        corsResponse.headers.set('Access-Control-Allow-Origin', '*');
        corsResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        corsResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        return corsResponse;
      } else {
        console.warn('⚠️ Dump Proxy: Backend failed:', response.status, response.statusText);
      }
    } catch (fetchError) {
      console.warn('⚠️ Dump Proxy: Backend unreachable:', fetchError instanceof Error ? fetchError.message : 'Unknown error');
    }

    // Fallback: Store locally in Supabase
    console.log('🔄 Dump Proxy: Using fallback - storing locally');
    
    const { data: rawDump, error: insertError } = await supabase
      .from("raw_dumps")
      .insert({
        basket_id,
        workspace_id: workspace.id,  // Use real workspace ID from authenticated user
        body_md: content,  // Use mapped content
        file_refs: files,  // Use mapped files
        processing_status: 'pending',
        created_at: new Date().toISOString(),
        metadata: {
          source: "local_fallback",
          user_id: user.id
        }
      })
      .select()
      .single();

    if (insertError || !rawDump) {
      console.error('❌ Dump fallback storage failed:', insertError);
      return NextResponse.json(
        { error: "Failed to create dump" },
        { status: 500 }
      );
    }

    console.log('✅ Dump stored locally:', rawDump.id);

    // Trigger substrate processing for locally stored dump
    try {
      const processResponse = await fetch(`${request.nextUrl.origin}/api/substrate/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawDumpId: rawDump.id,
          basketId: basket_id
        }),
      });

      if (processResponse.ok) {
        console.log('✅ Triggered substrate processing for:', rawDump.id);
      } else {
        console.warn('⚠️ Failed to trigger substrate processing');
      }
    } catch (processError) {
      console.warn('⚠️ Substrate processing trigger failed:', processError);
    }

    const response = NextResponse.json({ 
      raw_dump_id: rawDump.id,
      status: 'created',
      processing: 'triggered'
    });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;

  } catch (error) {
    console.error('❌ Dump Proxy error:', error);
    const errorResponse = NextResponse.json(
      { 
        error: 'Failed to create dump',
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