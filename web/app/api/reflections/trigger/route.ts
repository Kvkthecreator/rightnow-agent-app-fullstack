import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@/lib/supabase/clients";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json().catch(() => ({}));
  const basketId = body?.basket_id;
  if (!basketId) return NextResponse.json({ error: "basket_id required" }, { status: 400 });

  // Create a simple reflection
  const reflection = {
    pattern: "Recent memory shows focused activity",
    tension: "Balance between exploration and execution",
    question: "What specific outcomes are we targeting?",
    meta_derived_from: `basket_${basketId}_${Date.now()}`
  };

  // Create substrate reflection artifact
  const reflection_text = `Pattern: ${reflection.pattern}\n\nTension: ${reflection.tension}\n\nQuestion: ${reflection.question}`;
  const { data, error } = await supabase.rpc('fn_reflection_create_from_substrate', {
    p_basket_id: basketId,
    p_reflection_text: reflection_text
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, reflection, cached: !!data });
}