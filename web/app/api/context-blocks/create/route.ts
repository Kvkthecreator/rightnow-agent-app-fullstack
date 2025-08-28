import { NextRequest, NextResponse } from "next/server";
import { createTestAwareClient, getTestAwareAuth } from "@/lib/auth/testHelpers";
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const supabase = createTestAwareClient({ cookies });
  const { userId } = await getTestAwareAuth(supabase);
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
