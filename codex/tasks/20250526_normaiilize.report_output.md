## codex/tasks/20250526_normaiilize.report_output.md

# Title: Normalize report.output_json to avoid runtime render crashes

## Goal
Ensure the reports page never shows "Unable to load report" unless the fetch actually failed. This handles empty `output_json` or missing nested fields gracefully.

## Instructions

1. Open: `web/app/reports/[reportId]/page.tsx`

2. After the line:
```ts
report = await apiGet(`/api/reports/${params.reportId}`);

3. Add:
// Normalize for safety
if (!report.output_json || typeof report.output_json !== "object") {
  report.output_json = { output_type: "unknown", data: {} };
}
if (!report.output_json.output_type) {
  report.output_json.output_type = "unknown";
}
if (!report.output_json.data || typeof report.output_json.data !== "object") {
  report.output_json.data = {};
}

Add a console:
console.log("[Report Loaded]:", report);