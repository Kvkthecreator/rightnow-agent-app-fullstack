import { NextRequest } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { checkBasketAccess } from "@/lib/baskets/access";

interface RouteParams {
  id: string;
  itemId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id: basketId, itemId } = await params;
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check basket access
    await checkBasketAccess(supabase, basketId);
    
    // Fetch context item details
    const { data: item, error } = await supabase
      .from('context_items')
      .select(`
        id,
        basket_id,
        title,
        type,
        content,
        description,
        state,
        created_at,
        updated_at,
        metadata
      `)
      .eq('id', itemId)
      .eq('basket_id', basketId)
      .single();
    
    if (error || !item) {
      return Response.json({ error: 'Context item not found' }, { status: 404 });
    }
    
    // Map fields for consistent API
    const response = {
      ...item,
      label: item.title,
      kind: item.type,
      synonyms: item.metadata?.synonyms || []
    };
    
    return Response.json(response);
  } catch (error: any) {
    console.error('Failed to fetch context item:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch context item' },
      { status: error.status || 500 }
    );
  }
}