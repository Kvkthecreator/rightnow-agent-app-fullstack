"use client";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

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

  function handleChange(name: string, value: any) {
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/agent-run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_type_id: taskTypeId, ...form }),
    });
    onResult(await res.json());
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