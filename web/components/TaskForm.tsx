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
  onResult: (payload: any) => void;
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
    // determine endpoint: direct backend call to avoid rewrite
    const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
    const endpoint = base
      ? `${base}/agent-run`
      : "/api/agent-run";
    console.log(`→ calling ${endpoint} with Bearer token…`);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ task_type_id: taskTypeId, ...form }),
    });
    console.log("← status", res.status);
    const text = await res.text();
    console.log("← body", text);
    if (!res.ok) {
      console.error("Error creating agent run:", res.status, text);
      return onResult({ error: text });
    }
    try {
      const data = JSON.parse(text);
      onResult(data);
    } catch (err) {
      console.error("Failed to parse JSON response", err);
      onResult({ error: text });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {inputFields.map((f) => (
        <div key={f.name} className="flex flex-col gap-1">
          <label className="text-sm font-medium">{f.label}</label>
          <Input
            type="text"
            onChange={(e) => handleChange(f.name, e.target.value)}
            required
          />
        </div>
      ))}
      <Button type="submit">Run Task</Button>
    </form>
  );
}