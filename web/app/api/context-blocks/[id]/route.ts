import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } },
) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("blocks")
    .select("*")
    .eq("id", context.params.id)
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } },
) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("id", context.params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true }, { status: 200 });
}
