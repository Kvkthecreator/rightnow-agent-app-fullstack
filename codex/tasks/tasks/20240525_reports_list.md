## codex/tasks/tasks/20240525_reports_list.md

# Title
Implement reports index view and supporting /api/reports list endpoint

# Background / Problem
Currently the `/reports` route tries to fetch `/api/reports` but that route
doesn’t exist, so the page shows “Failed to load reports.”  
Desired UX: the page should list the user’s recent reports (id, task, date,
status). Clicking a row navigates to `/reports/[reportId]`, which is already
working.

# Desired Outcome
### 1 · Backend
* **File:** `web/app/api/reports/route.ts`
  * `export const runtime = "nodejs";` (needs service-role key)
  * Read `user_id` from the Supabase auth cookie (throw 401 if missing).
  * `select id, task_id, status, created_at`  
    `order created_at desc`  
    `limit 20`
  * Return JSON array.

### 2 · Front-end
* **File:** `web/app/reports/page.tsx` (rewrite)
  ```tsx
  import Link from "next/link";
  import { apiGet } from "@/lib/api";
  import DashboardLayout from "@/app/dashboard/layout";

  export const dynamic = "force-dynamic"; // no cache

  type Row = { id: string; task_id: string; status: string; created_at: string };

  export default async function ReportsIndex() {
    let rows: Row[] = [];
    try {
      rows = await apiGet<Row[]>("/api/reports");
    } catch (e) {
      return (
        <DashboardLayout>
          <p className="p-10 text-gray-500">Failed to load reports.</p>
        </DashboardLayout>
      );
    }

    if (!rows.length) {
      return (
        <DashboardLayout>
          <p className="p-10 text-gray-500">Nothing here yet — run a task!</p>
        </DashboardLayout>
      );
    }

    return (
      <DashboardLayout>
        <div className="p-6 md:p-10 space-y-4">
          {rows.map(r => (
            <Link
              key={r.id}
              href={`/reports/${r.id}`}
              className="block rounded-xl border p-4 hover:bg-gray-50 transition"
            >
              <div className="flex justify-between">
                <span className="font-medium">{r.task_id}</span>
                <span className="text-sm text-gray-500">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600 capitalize">
                {r.status}
              </p>
            </Link>
          ))}
        </div>
      </DashboardLayout>
    );
  }
