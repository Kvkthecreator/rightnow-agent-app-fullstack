import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { detail: "Missing authentication token" },
      { status: 401 },
    );
  }

  // Optionally: fetch workspace-linked baskets here using RLS
  // const { data: baskets } = await supabase
  //   .from("baskets")
  //   .select("*")
  //   .order("created_at", { ascending: false });

  return NextResponse.json({ success: true });
}
