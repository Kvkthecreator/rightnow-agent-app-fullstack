"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface TaskFormProps {
  onSubmit: (input: string) => void;
  disabled?: boolean;
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