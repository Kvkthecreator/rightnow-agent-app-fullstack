## codex/tasks/20250527_chatupdate.md

🧠 Goal
Enable the user to reply to clarification messages from manager_agent, triggering another round of reasoning until dispatch is possible.

***  🔁 PATCH 1 — Update manager_agent response handling in backend ***
File: api/src/app/agent_entrypoints.py
Purpose: Store pending_field in Supabase when clarification is returned.

# Inside run_agent() after manager returns a clarification
if msg_type == "clarification":
    field = parsed.get("field")
    question = parsed.get("message")

    # Persist current state
    try:
        supabase.table("agent_sessions").update({
            "inputs": collected_inputs,
            "pending_field": field
        }).eq("id", task_id).execute()
    except Exception:
        print(f"[warn] Could not persist pending_field for task_id={task_id}")

    payload = build_payload(
        task_id=task_id,
        user_id=user_id,
        agent_type="manager",
        message={"type": "text", "content": question},
        reason="clarification",
        trace=result.to_debug_dict() if hasattr(result, "to_debug_dict") else [],
    )
    await send_webhook(flatten_payload(payload))
    return {"ok": True}

*** 💬 PATCH 2 — Frontend: Update ChatPane to support replies ***
File: web/components/ChatPane.tsx

Add state and form handling logic for replying to clarification:

"use client";
import { useEffect, useRef, useState } from "react";
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

export function ChatPane({ taskId }: ChatPaneProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [reply, setReply] = useState("");
  const [pendingField, setPendingField] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("agent_messages")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data);
      });

    const sub = supabase
      .channel("agent_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "agent_messages", filter: `task_id=eq.${taskId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as AgentMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [taskId]);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [messages]);

  useEffect(() => {
    const clarificationMsg = messages.find((msg) =>
      msg.message_type === "text" &&
      typeof msg.message_content === "string" &&
      msg.message_content.toLowerCase().includes("what is")
    );
    if (clarificationMsg) setPendingField("goal"); // TEMP HARDCODE until field tracking is in messages
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = reply.trim();
    if (!content || !pendingField) return;

    const userMsg: AgentMessage = {
      id: `user-${Date.now()}`,
      task_id: taskId,
      user_id: "user",
      agent_type: "user",
      message_type: "text",
      message_content: content,
      created_at: new Date().toISOString(),
    };

    setMessages((m) => [...m, userMsg]);
    setReply("");
    setPendingField(null);

    await fetch("/api/manager-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId, field: pendingField, value: content }),
    });
  };

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
      <div ref={bottomRef} />
      {pendingField && (
        <form className="flex gap-2 mt-4" onSubmit={handleSubmit}>
          <input
            className="w-full border px-2 py-1 rounded"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your answer…"
          />
          <button className="bg-black text-white px-3 py-1 rounded" type="submit">
            Send
          </button>
        </form>
      )}
    </div>
  );
}

*** 🧪 PATCH 3 — Add new Next.js route for manager replies ***
File: web/app/api/manager-chat/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { task_id, field, value } = body;
  const supabase = createClient();

  const { data, error } = await supabase
    .from("agent_sessions")
    .select("inputs, user_id, task_type_id")
    .eq("id", task_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const updated = { ...data.inputs, [field]: value };

  await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      task_id,
      user_id: data.user_id,
      task_type_id: data.task_type_id,
      prompt: value,
      collected_inputs: updated,
    }),
  });

  return NextResponse.json({ ok: true });
}
