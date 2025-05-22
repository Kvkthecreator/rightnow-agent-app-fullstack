"use client";

import Link from "next/link";
import type { Report } from "@/lib/types";

/**
 * Card component for displaying a single report.
 */
export function ReportCard({ report }: { report: Report }) {
  const timestamp = new Date(report.created_at).toLocaleString();
  return (
    <Link
      href={`/reports/${report.id}`}
      className="block border rounded p-4 hover:bg-muted"
    >
      <h3 className="font-semibold">{report.task_id}</h3>
      <p className="text-xs text-muted-foreground">{timestamp}</p>
    </Link>
  );
}