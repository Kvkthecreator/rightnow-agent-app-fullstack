"use client";

import React from "react";
import { useTaskTypes } from "@/hooks/useTaskTypes";
import { TaskCard } from "@/components/TaskCard";

export default function TasksPage() {
  const { taskTypes, isLoading } = useTaskTypes();
  if (isLoading) return <p className="animate-pulse">Loading tasks…</p>;
  if (!taskTypes) return <p className="text-red-600">Failed to load tasks.</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {taskTypes.map((t) => (
        <TaskCard key={t.id} task={t} />
      ))}
    </div>
  );
}