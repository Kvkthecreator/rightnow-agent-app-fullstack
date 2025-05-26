// app/api/reports/[reportId]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const reportId = params.reportId;
  // Log invocation with reportId
  console.log('▶▶ [reports/:id] handler hit, reportId=', reportId);

  // 2) fetch the full row from Supabase
  const { data, error } = await supabase
    .from("reports")
    .select("id, task_id, inputs, output_json, status")
    .eq("id", reportId)
    .single();

  if (error || !data) {
    // Log not found error
    console.log('▶▶ [reports/:id] report not found, reportId=', reportId, 'error=', error);
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // 3) return the JSON to your client
  // Log successful return
  console.log('▶▶ [reports/:id] success, reportId=', reportId, 'data=', data);
  return NextResponse.json(data);
}
