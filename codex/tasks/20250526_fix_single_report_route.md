## codex/tasks/20250526_fix_single_report_route.md

# Title
Fix Next.js 15 route handler for /api/reports/[reportId]

# Summary
Refactor the dynamic route handler for fetching a single report by ID using the updated `App Router` syntax required by Next.js 15+.

# Task Type
rewrite_file

# Target File
web/app/api/reports/[reportId]/route.ts

# Replacement Code
```ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  context: { params: Record<string, string | string[]> }
) {
  const reportIdRaw = context.params.reportId;
  const reportId = Array.isArray(reportIdRaw) ? reportIdRaw[0] : reportIdRaw;

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
