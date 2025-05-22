"use client";

import { useReports } from "@/hooks/useReports";
import { ReportCard } from "@/components/ReportCard";

export default function ReportsPage() {
  const { reports, isLoading, isError } = useReports();
  if (isLoading) return <p className="animate-pulse">Loading…</p>;
  if (isError) return <p className="text-red-600">Failed to load reports.</p>;
  if (!reports?.length) return <p>No reports yet.</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {reports.map((r) => (
        <ReportCard key={r.id} report={r} />
      ))}
    </div>
  );
}