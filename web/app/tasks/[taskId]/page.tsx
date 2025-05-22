"use client";

import { useRouter } from "next/navigation";
import { useTaskTypes } from "@/hooks/useTaskTypes";
import { TaskForm } from "@/components/TaskForm";
import { EmptyState } from "@/components/ui/EmptyState";

export default function Page({ params }: { params: any }) {
  const router = useRouter();
  const { taskTypes, isLoading } = useTaskTypes();
  if (isLoading) {
    return <EmptyState title="Loading task…" icon={<div className="loader" />} />;
  }
  const task = taskTypes?.find((t) => t.id === params.taskId);
  if (!task) {
    return <EmptyState title="Task not found" />;
  }

  return (
    <>
      <h1 className="text-xl mb-4">{task.title}</h1>
      <TaskForm
        taskTypeId={task.id}
        inputFields={task.input_fields as any}
        onResult={(res) => router.push(`/reports/${res.report_id}`)}
      />
    </>
  );
}