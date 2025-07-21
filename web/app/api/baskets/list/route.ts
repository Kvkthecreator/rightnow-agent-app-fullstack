// ❌ DEPRECATED
// This route is no longer used for SSR. Use server helpers in lib/server/baskets.ts instead.
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Database } from "@/lib/dbTypes";

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ detail: "Missing authentication token" }, { status: 401 });
  }

  const { data, error: fetchError } = await supabase
    .from("baskets")
    .select("*")
    .order("created_at", { ascending: false });

  if (fetchError) {
    console.error("❌ Supabase error while fetching baskets:", fetchError);
    return NextResponse.json({ detail: "Failed to fetch baskets" }, { status: 500 });
  }

  return NextResponse.json(data);
}
