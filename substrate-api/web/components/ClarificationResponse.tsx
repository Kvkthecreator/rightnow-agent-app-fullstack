"use client";

import React, { useState } from "react";

export interface ClarificationResponseProps {
  /** Field identifier requiring clarification */
  field: string;
  /** Prompt message to display as placeholder */
  prompt: string;
  /** Callback when user submits a value */
  onSubmit: (field: string, value: string) => void;
}

export function ClarificationResponse({ field, prompt, onSubmit }: ClarificationResponseProps) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(field, value.trim());
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-sm text-gray-500">
        You answered: <strong>{value}</strong>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={prompt}
        className="flex-1 border rounded px-2 py-1"
      />
      <button
        type="submit"
        className="px-3 py-1 bg-blue-600 text-white rounded"
      >
        Submit
      </button>
    </form>
  );
}