"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

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
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt) return;

    setLoading(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          task_type_id: taskTypeId,
          collected_inputs: {},
        }),
      });
      const json = await res.json();
      const taskId = json.task_id;

      if (onSessionCreated && taskId) {
        onSessionCreated(taskId); // ✅ triggers ChatPane
      } else if (onResult) {
        onResult(json); // fallback
      }
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
