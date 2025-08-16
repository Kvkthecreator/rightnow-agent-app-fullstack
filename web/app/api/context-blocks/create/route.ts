import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { createUserClient } from "@/lib/supabase/user";

export async function POST(req: NextRequest) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { token } = await getAuthenticatedUser(req);
  const supabase = createUserClient(token);
  const { data, error } = await supabase
    .from("blocks")
    .insert(payload)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
