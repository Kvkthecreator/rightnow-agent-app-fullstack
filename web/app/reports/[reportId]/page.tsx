import { RendererSwitch } from "@/components/renderers/RendererSwitch";
import { apiGet } from "@/lib/api";
import type { Report } from "@/lib/types";

export default async function Page({ params }: { params: any }) {
  let report: Report;
  try {
    report = await apiGet(`/reports/${params.reportId}`);
  } catch {
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
