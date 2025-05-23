"use client";
import useSWR from "swr";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { Report } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import DashboardLayout from "@/app/dashboard/layout";
import { Card } from "@/components/ui/Card";

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
      <DashboardLayout>
        <div className="px-6 md:px-10 py-6">
          <EmptyState
            title="Loading reports…"
            icon={<div className="loader" />}
          />
        </div>
      </DashboardLayout>
    );
  }
  if (error) {
    return (
      <DashboardLayout>
        <div className="px-6 md:px-10 py-6">
          <EmptyState title="Failed to load reports." />
        </div>
      </DashboardLayout>
    );
  }
  if (!reports?.length) {
    return (
      <DashboardLayout>
        <div className="px-6 md:px-10 py-6">
          <EmptyState title="No reports yet — run a task!" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-6 md:px-10 py-6">
        <h1 className="text-xl font-semibold mb-4">Reports</h1>
        <div className="space-y-4">
          {reports.map((r) => (
            <Card key={r.id} className="cursor-pointer hover:bg-muted">
              <Link href={`/reports/${r.id}`} className="block">
                <h3 className="text-lg font-semibold">Report · {r.task_id}</h3>
                <p className="text-sm text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</p>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}