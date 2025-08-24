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
    .select("pattern, tension, question, computed_at")
    .eq("basket_id", basketId)
    .order("computed_at", { ascending: false })
    .limit(1)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? { pattern: null, tension: null, question: null, computed_at: null });
}