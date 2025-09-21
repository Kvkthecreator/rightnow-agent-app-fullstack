import { NextRequest } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { checkBasketAccess } from "@/lib/baskets/access";

interface RouteParams {
  id: string;
  blockId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id: basketId, blockId } = await params;
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check basket access
    await checkBasketAccess(supabase, basketId);
    
    // Fetch block details
    const { data: block, error } = await supabase
      .from('blocks')
      .select(`
        id,
        basket_id,
        title,
        content,
        semantic_type,
        state,
        confidence_score,
        created_at,
        updated_at,
        metadata
      `)
      .eq('id', blockId)
      .eq('basket_id', basketId)
      .single();
    
    if (error || !block) {
      return Response.json({ error: 'Block not found' }, { status: 404 });
    }
    
    // Format title if missing
    if (!block.title) {
      block.title = block.content ? block.content.substring(0, 50) + '...' : 'Untitled Block';
    }
    
    return Response.json(block);
  } catch (error: any) {
    console.error('Failed to fetch block:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch block' },
      { status: error.status || 500 }
    );
  }
}