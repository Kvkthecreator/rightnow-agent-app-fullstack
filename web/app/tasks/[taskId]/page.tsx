"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTaskTypes } from "@/hooks/useTaskTypes";
import { TaskForm } from "@/components/TaskForm";

export default function SingleTask({ params }: { params: { taskId: string } }) {
  const router = useRouter();
  const { taskTypes, isLoading } = useTaskTypes();
  if (isLoading) return <p>Loading…</p>;
  const task = taskTypes?.find((t) => t.id === params.taskId);
  if (!task) return <p>Not found</p>;

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