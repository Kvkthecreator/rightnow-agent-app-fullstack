"use client";
import useSWR from "swr";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { Report } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";

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

  if (isLoading) {
    return (
      <EmptyState
        title="Loading reports…"
        icon={<div className="loader" />}
      />
    );
  }
  if (error) {
    return <EmptyState title="Failed to load reports." />;
  }
  if (!reports?.length) {
    return <EmptyState title="No reports yet — run a task!" />;
  }

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