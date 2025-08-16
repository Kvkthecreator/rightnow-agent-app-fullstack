import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { createUserClient } from "@/lib/supabase/user";

export async function PUT(req: NextRequest) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { id, ...updates } = payload || {};
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { token } = await getAuthenticatedUser(req);
  const supabase = createUserClient(token);
  const { error } = await supabase
    .from("blocks")
    .update(updates)
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
