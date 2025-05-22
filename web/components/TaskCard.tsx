import React from "react";

interface Props {
  task: import("@/hooks/useTaskTypes").TaskType;
}

export function TaskCard({ task }: Props) {
  return (
    <a href={`/tasks/${task.id}`} className="block border rounded p-4 hover:bg-muted">
      <h3 className="font-semibold">{task.title}</h3>
      <p className="text-sm text-muted-foreground">{task.description}</p>
    </a>
  );
}