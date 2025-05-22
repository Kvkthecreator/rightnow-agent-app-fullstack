import React from "react";
import { RendererSwitch } from "@/components/renderers/RendererSwitch";

interface Props {
  params: { reportId: string };
}

export default async function ReportPage({ params }: Props) {
  // Fetch report data using shared apiGet helper
  const { apiGet } = await import("@/lib/api");
  let report: import("@/lib/types").Report;
  try {
    report = await apiGet(`/reports/${params.reportId}`);
  } catch (e) {
    return <p className="text-red-600">Unable to load report.</p>;
  }
  return (
    <>
      <h1 className="text-xl mb-4">Report · {report.task_id}</h1>
      <RendererSwitch
        outputType={report.output_json.output_type}
        data={report.output_json.data}
      />
    </>
  );
}