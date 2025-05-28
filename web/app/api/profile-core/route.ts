import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServerClient";

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { data: profile, error } = await supabase
    .from("profile_core_data")
    .select("*")
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}