"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { Card } from "@/components/ui/Card";
import TaskBriefForm from "@/components/TaskBriefForm";

export default function CreateTaskBriefPage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">New Task Brief</h1>
      <TaskBriefForm
        onCreate={(brief) => {
          // Redirect to task execution
          router.push(`/tasks/${brief.id}`);
        }}
      />
    </div>
  );
}