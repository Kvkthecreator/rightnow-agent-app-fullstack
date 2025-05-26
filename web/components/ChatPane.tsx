"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

interface ChatPaneProps {
  taskId: string;
}

interface AgentMessage {
  id: string;
  task_id: string;
  user_id: string;
  agent_type: string;
  message_type: string;
  message_content: any;
  created_at: string;
}

/**
 * ChatPane subscribes to agent_messages for a given taskId
 * and renders them in chronological order.
 */
export function ChatPane({ taskId }: ChatPaneProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);

  useEffect(() => {
    const supabase = createClient();
    // initial load
    supabase
      .from<AgentMessage>("agent_messages")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data);
      });
    // realtime subscription for new messages
    const subscription = supabase
      .from<AgentMessage>(`agent_messages:task_id=eq.${taskId}`)
      .on("INSERT", (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();
    return () => {
      supabase.removeSubscription(subscription);
    };
  }, [taskId]);

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded">
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
  );
}