import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@/lib/supabase/clients";

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(req.url);
  const basketId = searchParams.get("basket_id");
  if (!basketId) return NextResponse.json({ error: "basket_id required" }, { status: 400 });
  const days = parseInt(searchParams.get("days") || "14", 10);
  const maxDumps = parseInt(searchParams.get("max") || "50", 10);
  const cache = (searchParams.get("cache") || "false") === "true";

  // For now, return a simple reflection without full computation
  const reflection = {
    pattern: "Recent memory shows focused activity",
    tension: "Balance between exploration and execution",
    question: "What specific outcomes are we targeting?",
    meta_derived_from: `basket_${basketId}_${Date.now()}`
  };

  if (cache) {
    // Create substrate reflection artifact
    const reflection_text = `Pattern: ${reflection.pattern}\n\nTension: ${reflection.tension}\n\nQuestion: ${reflection.question}`;
    await supabase.rpc('fn_reflection_create_from_substrate', {
      p_basket_id: basketId,
      p_reflection_text: reflection_text
    });
  }

  return NextResponse.json({
    projection: { window: { days, maxDumps }, edgeCount: 0 },
    reflection,
    cached: cache
  });
}