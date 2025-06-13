"use client";

import React from "react";
import { CoreBlockFormData } from "./types";

interface StepBasicsProps {
  formData: CoreBlockFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function StepBasics({ formData, onChange }: StepBasicsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-muted-foreground">Label</label>
        <input
          type="text"
          name="label"
          value={formData.label}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground">Content</label>
        <textarea
          name="content"
          value={formData.content}
          onChange={onChange}
          rows={6}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>
    </div>
  );
}