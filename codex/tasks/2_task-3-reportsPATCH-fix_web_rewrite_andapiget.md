## codex/tasks/2_task-3-reportsPATCH-fix_web_rewrite_andapiget.md

# Rewrite /api/* to backend, switch to apiGet helper

## Changes
```diff
* web/next.config.ts
* web/app/reports/[reportId]/page.tsx

*** 🔧 Patches ***
@@ next.config.ts @@
   experimental: { reactStrictMode: true },
+  async rewrites() {
+    return [
+      {
+        source: "/api/:path*",
+        destination: `${process.env.NEXT_PUBLIC_API_BASE}/:path*`,
+      },
+    ];
+  },
 };

@@ page.tsx @@
-  const res = await fetch(
-    `${process.env.NEXT_PUBLIC_API_BASE}/reports/${params.reportId}`,
-    { credentials: "include" }
-  );
-  if (!res.ok) return <p>Not found</p>;
-  const report = await res.json();
+  const { apiGet } = await import("@/lib/api");
+  const report = await apiGet<import("@/lib/types").Report>(
+    `/reports/${params.reportId}`
+  );
