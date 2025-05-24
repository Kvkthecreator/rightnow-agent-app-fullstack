// web/app/reports/[reportId]/page.tsx

import { RendererSwitch } from "@/components/renderers/RendererSwitch";
import { apiGet } from "@/lib/api";
import type { Report } from "@/lib/types";
import DashboardLayout from "@/app/dashboard/layout";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function Page({ params }: { params: any }) {
  let report: Report;
  try {
    report = await apiGet(`/api/reports/${params.reportId}`);
  } catch {
    return (
      <DashboardLayout>
        <div className="px-6 md:px-10 py-6">
          <EmptyState title="Unable to load report." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-6 md:px-10 py-6">
        <h1 className="text-xl font-semibold mb-4">Report · {report.task_id}</h1>
        <Card>
          <RendererSwitch
            outputType={report.output_json.output_type}
            data={report.output_json.data}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
