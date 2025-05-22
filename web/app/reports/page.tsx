"use client";

import useSWR from "swr";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { Report } from "@/lib/types";

// 🔐  grab Supabase JWT if you already have a session hook
// otherwise remove 'token' lines – the endpoint also works with credentials cookie
// import { useAuth } from "@/lib/useAuth";

export default function ReportsPage() {
  // const { token } = useAuth();
  const token = undefined;

  const { data: reports, error, isLoading } = useSWR(
    token !== undefined ? ["/reports", token] : null,
    ([p, t]) => apiGet<Report[]>(p, t)
  );

  if (isLoading) return <p>Loading reports…</p>;
  if (error)     return <p className="text-red-600">Failed to load reports.</p>;
  if (!reports?.length) return <p>No reports yet — run a task!</p>;

  return (
    <ul className="space-y-2">
      {reports.map((r) => (
        <li key={r.id} className="border p-3 rounded">
          <Link href={`/reports/${r.id}`}>
            {r.task_id} · {new Date(r.created_at).toLocaleString()}
          </Link>
        </li>
      ))}
    </ul>
  );
}