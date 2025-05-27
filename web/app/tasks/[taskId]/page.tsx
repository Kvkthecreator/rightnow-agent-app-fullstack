"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useTaskTypes } from "@/hooks/useTaskTypes";
import { TaskForm } from "@/components/TaskForm";
import { EmptyState } from "@/components/ui/EmptyState";
import DashboardLayout from "@/app/dashboard/layout";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabaseClient";

interface AgentMessage {
  id: string;
  task_id: string;
  user_id: string;
  agent_type: string;
  message_type: string;
  message_content: any;
  created_at: string;
}

export default function Page({ params }: { params: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskTypeId = params.taskId;
  const [sessionId, setSessionId] = useState<string | null>(searchParams.get("session"));
  const { taskTypes, isLoading } = useTaskTypes();
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const supabase = createClient();
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="px-6 md:px-10 py-6">
          <EmptyState title="Loading task…" icon={<div className="loader" />} />
        </div>
      </DashboardLayout>
    );
  }
  const task = taskTypes?.find((t) => t.id === taskTypeId);
  if (!task) {
    return (
      <DashboardLayout>
        <div className="px-6 md:px-10 py-6">
          <EmptyState title="Task not found" />
        </div>
      </DashboardLayout>
    );
  }

  // Fetch existing messages when session starts
  useEffect(() => {
    if (!sessionId) return;
    supabase
      .from("agent_messages")
      .select<AgentMessage>("*")
      .eq("task_id", sessionId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data);
      });
  }, [sessionId]);

  // Handler for TaskForm results
  const handleResult = (res: any) => {
    if (!res.ok) {
      console.warn("Agent task failed:", res);
      return;
    }
    // Push agent message to local state
    const newMsg: AgentMessage = {
      id: `${res.task_id}-${Date.now()}`,
      task_id: res.task_id,
      user_id: res.user_id,
      agent_type: res.agent_type,
      message_type: res.output_type,
      message_content: res.message,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  return (
    <DashboardLayout>
      <div className="px-6 md:px-10 py-6">
        <h1 className="text-xl font-semibold mb-4">{task.title}</h1>
        <Card>
          {sessionId ? (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="p-2 border rounded">
                  <div className="text-xs text-muted-foreground">
                    [{msg.agent_type}] {new Date(msg.created_at).toLocaleTimeString()}
                  </div>
                  <div className="mt-1 text-sm">
                    {typeof msg.message_content === "string"
                      ? msg.message_content
                      : JSON.stringify(msg.message_content)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <TaskForm
              taskTypeId={taskTypeId}
              onSessionCreated={(sid) => setSessionId(sid)}
              onResult={handleResult}
            />
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}