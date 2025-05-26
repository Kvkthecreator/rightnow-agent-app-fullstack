"use client";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/useAuth";

interface InputField {
  name: string;
  label: string;
  type: string;
}
interface Props {
  taskTypeId: string;
  inputFields: InputField[];
  /**
   * Called with final report or error after specialist completion.
   */
  onResult?: (payload: any) => void;
  /**
   * Called when a new manager session is created. Receives the session/task_id.
   */
  onSessionCreated?: (sessionId: string) => void;
}

export function TaskForm({ taskTypeId, inputFields, onResult }: Props) {
  const [form, setForm] = useState<Record<string, any>>({});
  const { token } = useAuth();

  function handleChange(name: string, value: any) {
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      console.error("🚨 No Supabase session! User not logged in?");
      return;
    }
    // initiate manager session via backend
    const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/agent`;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_prompt: "",
          task_type_id: taskTypeId,
          collected_inputs: form,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error("Error initiating manager session:", res.status, errText);
        onResult && onResult({ error: errText });
        return;
      }
      const result = await res.json();
      // manager returns task_id for chat session
      if (result.task_id && onSessionCreated) {
        onSessionCreated(result.task_id);
      } else {
        onResult && onResult(result);
      }
    } catch (err) {
      console.error("Exception initiating manager session", err);
      onResult && onResult({ error: String(err) });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {inputFields.map((f) => (
        <div key={f.name} className="flex flex-col gap-1">
          <label className="text-sm font-medium">{f.label}</label>
          <Input
            // match profile-create input styling: transparent background, default border
            className="mt-1 block w-full border border-border rounded p-2 bg-background text-base text-foreground placeholder:text-muted-foreground"
            type="text"
            onChange={(e) => handleChange(f.name, e.target.value)}
          />
        </div>
      ))}
      <Button type="submit">Run Task</Button>
    </form>
  );
}