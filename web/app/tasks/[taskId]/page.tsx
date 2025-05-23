"use client";

import { useRouter } from "next/navigation";
import { useTaskTypes } from "@/hooks/useTaskTypes";
import { TaskForm } from "@/components/TaskForm";
import { EmptyState } from "@/components/ui/EmptyState";

import DashboardLayout from "@/app/dashboard/layout";
import { Card } from "@/components/ui/Card";

export default function Page({ params }: { params: any }) {
  const router = useRouter();
  const { taskTypes, isLoading } = useTaskTypes();
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="px-6 md:px-10 py-6">
          <EmptyState title="Loading task…" icon={<div className="loader" />} />
        </div>
      </DashboardLayout>
    );
  }
  const task = taskTypes?.find((t) => t.id === params.taskId);
  if (!task) {
    return (
      <DashboardLayout>
        <div className="px-6 md:px-10 py-6">
          <EmptyState title="Task not found" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-6 md:px-10 py-6">
        <h1 className="text-xl font-semibold mb-4">{task.title}</h1>
        <Card>
          <TaskForm
            taskTypeId={task.id}
            inputFields={task.input_fields as any}
            onResult={(res) => router.push(`/reports/${res.report_id}`)}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}