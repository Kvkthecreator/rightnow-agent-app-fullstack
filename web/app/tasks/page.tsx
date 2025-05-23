"use client";
import { useTaskTypes } from "@/hooks/useTaskTypes";
// Removed TaskCard import; using Card and <a> for individual items
import { EmptyState } from "@/components/ui/EmptyState";

import DashboardLayout from "@/app/dashboard/layout";
import { Card } from "@/components/ui/Card";

export default function TasksPage() {
  const { taskTypes, isLoading } = useTaskTypes();
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="px-6 md:px-10 py-6">
          <EmptyState
            title="Loading tasks…"
            icon={<div className="loader" />}
          />
        </div>
      </DashboardLayout>
    );
  }
  if (!taskTypes?.length) {
    return (
      <DashboardLayout>
        <div className="px-6 md:px-10 py-6">
          <EmptyState title="No tasks available yet." />
        </div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout>
      <div className="px-6 md:px-10 py-6">
        <h1 className="text-xl font-semibold mb-4">Tasks</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {taskTypes.map((t) => (
            <Card key={t.id} className="hover:bg-muted cursor-pointer">
              <a href={`/tasks/${t.id}`}>  
                <h3 className="text-lg font-semibold mb-2">{t.title}</h3>
                <p className="text-sm text-muted-foreground">{t.description}</p>
              </a>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}