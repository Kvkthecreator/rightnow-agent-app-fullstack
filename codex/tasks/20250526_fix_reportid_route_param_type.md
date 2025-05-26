## codex/tasks/20250526_fix_reportid_route_param_type.md

# Title
Fix incorrect param typing for /api/reports/[reportId]/route.ts to restore handler execution.

# Summary
Update the second argument to the `GET` handler to use the correct Next.js 15 `params` typing.

# Tasks

```diff
*** Update File: app/api/reports/[reportId]/route.ts
@@
-export async function GET(
-  request: NextRequest,
-  context: { params: { reportId: string } }
+) export async function GET(
+  request: NextRequest,
+  context: { params: Record<string, string | string[]> }
) {
-  const { reportId } = context.params;
+  const reportId = Array.isArray(context.params.reportId)
+    ? context.params.reportId[0]
+    : context.params.reportId;

  console.log("▶▶ [reports/:id] handler hit, reportId=", reportId);

  // rest of function stays the same...
