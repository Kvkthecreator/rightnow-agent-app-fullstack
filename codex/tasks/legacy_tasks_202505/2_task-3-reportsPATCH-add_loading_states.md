## codex/tasks/2_task-3-reportsPATCH-add_loading_states.md

# Add simple loading / error UI for TasksPage & ReportPage

## Changes
```diff
* web/app/tasks/page.tsx
* web/app/reports/[reportId]/page.tsx

*** 🔧 Patches ***
@@ TasksPage @@
-  if (isLoading) return <p>Loading…</p>;
+  if (isLoading) return <p className="animate-pulse">Loading tasks…</p>;
+  if (!taskTypes) return <p className="text-red-600">Failed to load tasks.</p>;

@@ ReportPage @@
-  const report = await apiGet…
+  let report: import("@/lib/types").Report;
+  try {
+    report = await apiGet(`/reports/${params.reportId}`);
+  } catch (e) {
+    return <p className="text-red-600">Unable to load report.</p>;
+  }

