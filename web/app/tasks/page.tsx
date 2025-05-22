"use client";
import { useTaskTypes } from "@/hooks/useTaskTypes";
import { TaskCard } from "@/components/TaskCard";
import { EmptyState } from "@/components/ui/EmptyState";

export default function TasksPage() {
  const { taskTypes, isLoading } = useTaskTypes();
  if (isLoading) {
    return (
      <EmptyState
        title="Loading tasks…"
        icon={<div className="loader" />}
      />
    );
  }
  if (!taskTypes?.length) {
    return <EmptyState title="No tasks available yet." />;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {taskTypes.map((t) => (
        <TaskCard key={t.id} task={t} />
      ))}
    </div>
  );
}