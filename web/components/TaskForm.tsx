"use client";
import { useState } from "react";

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
          <input
            className="border rounded p-2"
            type="text"
            onChange={(e) => handleChange(f.name, e.target.value)}
            required
          />
        </div>
      ))}
      <button className="px-4 py-2 rounded bg-blue-600 text-white">Run Task</button>
    </form>
  );
}