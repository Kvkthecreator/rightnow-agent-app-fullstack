import { NextRequest } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { checkBasketAccess } from "@/lib/baskets/access";

interface RouteParams {
  id: string;
  relationshipId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id: basketId, relationshipId } = await params;
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check basket access
    await checkBasketAccess(supabase, basketId);
    
    // Fetch relationship details
    const { data: relationship, error } = await supabase
      .from('substrate_relationships')
      .select(`
        id,
        basket_id,
        from_type,
        from_id,
        to_type,
        to_id,
        relationship_type,
        strength,
        description,
        created_at
      `)
      .eq('id', relationshipId)
      .eq('basket_id', basketId)
      .single();
    
    if (error || !relationship) {
      return Response.json({ error: 'Relationship not found' }, { status: 404 });
    }
    
    return Response.json(relationship);
  } catch (error: any) {
    console.error('Failed to fetch relationship:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch relationship' },
      { status: error.status || 500 }
    );
  }
}