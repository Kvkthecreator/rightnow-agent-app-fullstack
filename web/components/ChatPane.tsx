"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { ClarificationResponse } from "@/components/ClarificationResponse";

interface ChatPaneProps {
  taskId: string;
  /** Collected inputs from user for clarification */
  collectedInputs?: Record<string, any>;
  /** Handler when user submits a clarification response */
  onClarificationSubmit?: (field: string, value: string) => void;
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

export function ChatPane({ taskId, collectedInputs, onClarificationSubmit }: ChatPaneProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    // Load existing messages
    supabase
      .from("agent_messages")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as AgentMessage[]);
      });

    // Subscribe to new messages
    const subscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agent_messages",
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          const newMessage = payload.new as AgentMessage;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [taskId]);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded max-h-[70vh] overflow-y-auto">
      {messages.map((msg) => {
        // System message: show progress
        if (msg.message_type === "system" && typeof msg.message_content !== "string") {
          const { provided_fields, missing_fields } = msg.message_content;
          const completeCount = provided_fields.length;
          const total = completeCount + missing_fields.length;
          return (
            <div key={msg.id} className="text-xs text-gray-500 italic">
              ✅ {completeCount} of {total} fields complete. Missing: {missing_fields.join(", ")}.
            </div>
          );
        }
        // Clarification prompt
        if (msg.message_type === "clarification" && typeof msg.message_content !== "string") {
          const { field, message } = msg.message_content;
          const answered = collectedInputs && field in collectedInputs;
          return (
            <div key={msg.id} className="space-y-2">
              <div className="p-2 bg-white rounded border">🤖 {message}</div>
              {onClarificationSubmit && !answered && (
                <ClarificationResponse
                  field={field}
                  prompt={message}
                  onSubmit={onClarificationSubmit}
                />
              )}
            </div>
          );
        }
        // Default message
        return (
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
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
