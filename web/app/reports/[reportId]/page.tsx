import React from "react";
import { RendererSwitch } from "@/components/renderers/RendererSwitch";

interface Props {
  params: { reportId: string };
}

export default async function ReportPage({ params }: Props) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/reports/${params.reportId}`,
    { credentials: "include" }
  );
  if (!res.ok) return <p>Not found</p>;
  const report = await res.json();
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