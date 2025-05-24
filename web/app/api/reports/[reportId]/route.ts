// app/api/reports/[reportId]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  // 1) extract reportId from the incoming URL
  const url = new URL(request.url);
  const segments = url.pathname.split("/");         // ["", "api", "reports", "{reportId}"]
  const reportId = segments[segments.length - 1];

  // 2) fetch the full row from Supabase
  const { data, error } = await supabase
    .from("reports")
    .select("id, task_id, inputs, output_json, status")
    .eq("id", reportId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // 3) return the JSON to your client
  return NextResponse.json(data);
}
