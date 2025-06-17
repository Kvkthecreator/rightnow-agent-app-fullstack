import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export async function POST(req: NextRequest) {
  let payload: { userId: string; text: string; basketName?: string | null };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { userId, text, basketName } = payload;
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: basket, error: basketError } = await supabase
    .from("baskets")
    .insert({ user_id: userId, name: basketName })
    .select("id")
    .single();
  if (basketError) {
    return NextResponse.json({ error: basketError.message }, { status: 500 });
  }

  const { error: inputError } = await supabase
    .from("basket_inputs")
    .insert({ basket_id: basket!.id, text_dump: text });

  if (inputError) {
    return NextResponse.json({ error: inputError.message }, { status: 500 });
  }

  return NextResponse.json({ id: basket!.id });
}
