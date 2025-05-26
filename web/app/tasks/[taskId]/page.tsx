"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTaskTypes } from "@/hooks/useTaskTypes";
import { TaskForm } from "@/components/TaskForm";
import { ChatPane } from "@/components/ChatPane";
import { EmptyState } from "@/components/ui/EmptyState";

import DashboardLayout from "@/app/dashboard/layout";
import { Card } from "@/components/ui/Card";

export default function Page({ params }: { params: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
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
          {sessionId ? (
            // Chat view for ongoing manager session
            <ChatPane taskId={sessionId} />
          ) : (
            // Initial form to collect inputs
            <TaskForm
              taskTypeId={task.id}
              inputFields={task.input_fields as any}
              onSessionCreated={(sid) => {
                // Navigate to chat flow for this session
                router.push(`/tasks/${task.id}?session=${sid}`);
              }}
              onResult={(res) => {
                // Fallback direct run: navigate to report
                if (res && res.report_id) {
                  router.push(`/reports/${res.report_id}`);
                } else {
                  alert("Agent run failed—please try again.");
                }
              }}
            />
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}