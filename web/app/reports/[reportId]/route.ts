// web/app/api/reports/[reportId]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!   // must be the _service_ key
);

export async function GET(
  request: Request,
  { params }: { params: { reportId: string } }
) {
  const { reportId } = params;
  console.log("▶▶ [reports/:id] handler hit, reportId=", reportId);

  // fetch the stored report JSON blob
  const { data, error } = await supabase
    .from("reports")
    .select("output_json")
    .eq("id", reportId)
    .single();

  if (error) {
    console.log("▶▶ [reports/:id] error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    console.log("▶▶ [reports/:id] not found:", reportId);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  console.log("▶▶ [reports/:id] success, data=", data.output_json);
  return NextResponse.json(data.output_json, { status: 200 });
}
