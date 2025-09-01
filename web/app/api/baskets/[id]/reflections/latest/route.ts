/**
 * Route: GET /api/baskets/:id/reflections/latest
 * @contract input  : none
 * @contract output : ReflectionDTO
 * RLS: workspace-scoped reads on reflection_cache
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerComponentClient({ cookies });
  const { id: basketId } = await params;
  const { data, error } = await supabase
    .from("reflection_cache")
    .select("reflection_text, computation_timestamp, meta")
    .eq("basket_id", basketId)
    .order("computation_timestamp", { ascending: false })
    .limit(1)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Transform to legacy format for backward compatibility
  const legacyFormat = data ? {
    pattern: data.meta?.pattern || null,
    tension: data.meta?.tension || null, 
    question: data.meta?.question || null,
    computed_at: data.computation_timestamp
  } : { pattern: null, tension: null, question: null, computed_at: null };
  
  return NextResponse.json(legacyFormat);
}