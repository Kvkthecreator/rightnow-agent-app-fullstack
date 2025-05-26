## codex/tasks/20250526_fix_reportid_route.md

# Title
Fix invalid GET export for app/api/reports/[reportId]/route.ts

# Instructions
Replace the contents of `web/app/api/reports/[reportId]/route.ts` with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const { reportId } = params;
  console.log("▶▶ [reports/:id] handler hit", reportId);

  const { data, error } = await supabase
    .from("reports")
    .select("id, task_id, inputs, output_json, status")
    .eq("id", reportId)
    .single();

  if (error || !data) {
    console.error("▶▶ report not found:", error);
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export const runtime = "nodejs";
