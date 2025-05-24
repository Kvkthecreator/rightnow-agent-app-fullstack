import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServerClient";

export async function GET(
  request: Request,
  { params }: { params: { reportId: string } }
) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("reports")
    .select("id, task_id, inputs, output_json, status")
    .eq("id", params.reportId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}