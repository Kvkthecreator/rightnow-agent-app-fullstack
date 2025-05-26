## codex/tasks/2_task-2-report-frontend-pages.md

# Task 2 — Gallery, Form page, Report viewer

## Changes
```diff
+ web/app/tasks/page.tsx
+ web/app/tasks/[taskId]/page.tsx
+ web/app/reports/[reportId]/page.tsx
+ web/components/TaskCard.tsx

*** ✨ TaskCard.tsx ***
interface Props { task: import("@/hooks/useTaskTypes").TaskType }
export function TaskCard({ task }: Props) {
  return (
    <a href={`/tasks/${task.id}`} className="block border rounded p-4 hover:bg-muted">
      <h3 className="font-semibold">{task.title}</h3>
      <p className="text-sm text-muted-foreground">{task.description}</p>
    </a>
  )
}

*** ✨ /app/tasks/page.tsx ***
import { useTaskTypes } from "@/hooks/useTaskTypes";
import { TaskCard } from "@/components/TaskCard";

export default function TasksPage() {
  const { taskTypes, isLoading } = useTaskTypes();
  if (isLoading) return <p>Loading…</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {taskTypes?.map(t => <TaskCard key={t.id} task={t} />)}
    </div>
  );
}

*** ✨ /app/tasks/[taskId]/page.tsx ***
import { useRouter } from "next/navigation";
import { useTaskTypes } from "@/hooks/useTaskTypes";
import { TaskForm } from "@/components/TaskForm";

export default function SingleTask({ params }: { params: { taskId: string } }) {
  const router = useRouter();
  const { taskTypes } = useTaskTypes();
  const task = taskTypes?.find(t => t.id === params.taskId);
  if (!task) return <p>Not found</p>;

  return (
    <>
      <h1 className="text-xl mb-4">{task.title}</h1>
      <TaskForm
        taskTypeId={task.id}
        inputFields={task.input_fields as any}
        onResult={res => router.push(`/reports/${res.report_id}`)}
      />
    </>
  );
}

*** ✨ /app/reports/[reportId]/page.tsx ***
import { RendererSwitch } from "@/components/renderers/RendererSwitch";

export default async function ReportPage({ params }: { params: { reportId: string } }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/reports/${params.reportId}`, { credentials: "include" });
  if (!res.ok) return <p>Not found</p>;
  const report = await res.json();
  return (
    <>
      <h1 className="text-xl mb-4">Report · {report.task_id}</h1>
      <RendererSwitch outputType={report.output_json.output_type} data={report.output_json.data} />
    </>
  );
}
