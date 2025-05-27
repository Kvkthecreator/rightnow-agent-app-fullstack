"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/useAuth";

interface TaskFormProps {
  taskTypeId: string;
  inputFields?: any;
  onSessionCreated?: (sid: string) => void;
  onResult?: (res: any) => void;
}

export function TaskForm({
  taskTypeId,
  inputFields,
  onSessionCreated,
  onResult,
}: TaskFormProps) {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt) return;

    setLoading(true);
    if (!user?.id) {
      console.warn("Missing user_id");
      setLoading(false);
      return;
    }
    try {
      const payload = {
        prompt,
        task_type_id: taskTypeId,
        user_id: user.id,
        collected_inputs: {},
      };
      console.log("[📤 sending to /api/agent]", payload);
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      console.log("[✅ response from backend]", result);
      if (!res.ok) {
        console.warn("[⚠️ API error]", result);
      }
      // TODO: Add response to message list, handle session or direct result
    } catch (err) {
      console.error("TaskForm error:", err);
      alert("Failed to start agent task.");
    } finally {
      setLoading(false);
      setInput("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a clarification or message..."
        disabled={loading}
        className="flex-1"
      />
      <Button type="submit" disabled={loading}>
        Send
      </Button>
    </form>
  );
}
