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
          onResult={(res) => {
            // Guard against missing report_id to avoid navigating to undefined
            if (!res || !res.report_id) {
              // TODO: replace alert with toast.error if using a toast library
              alert("Agent run failed—please try again.");
              return;
            }
            router.push(`/reports/${res.report_id}`);
          }}
        />
        </Card>
      </div>
    </DashboardLayout>
  );
}