"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface TaskFormProps {
  onSubmit?: (input: string) => void;
  disabled?: boolean;
  /** Task type identifier (optional) */
  taskTypeId?: string;
  /** Dynamic input field definitions (optional) */
  inputFields?: any;
  /** Callback when a new session is created (optional) */
  onSessionCreated?: (sid: string) => void;
  /** Callback when task run returns a result (optional) */
  onResult?: (res: any) => void;
}

export function TaskForm({ onSubmit, disabled }: TaskFormProps) {
  const [input, setInput] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    onSubmit(input);
    setInput("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a clarification or message..."
        disabled={disabled}
        className="flex-1"
      />
      <Button type="submit" disabled={disabled}>
        Send
      </Button>
    </form>
  );
}