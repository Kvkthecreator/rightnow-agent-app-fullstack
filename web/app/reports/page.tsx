import Link from "next/link";
import DashboardLayout from "@/app/dashboard/layout";
import { apiGet } from "@/lib/api";

// 🔐  grab Supabase JWT if you already have a session hook
// otherwise remove 'token' lines – the endpoint also works with credentials cookie
// import { useAuth } from "@/lib/useAuth";

export const dynamic = "force-dynamic";

type Row = { id: string; task_id: string; status: string; created_at: string };

export default async function ReportsIndex() {
  let rows: Row[] = [];
  try {
    rows = await apiGet<Row[]>("/api/reports");
  } catch {
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
        {rows.map((r) => (
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