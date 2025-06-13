"use client";

import React from "react";
import { CoreBlockFormData } from "./types";

interface StepDetailsProps {
  formData: CoreBlockFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function StepDetails({ formData, onChange }: StepDetailsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-muted-foreground">Tags (comma-separated)</label>
        <input
          type="text"
          name="meta_tags"
          value={formData.meta_tags}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground">Context Scope</label>
        <input
          type="text"
          name="meta_context_scope"
          value={formData.meta_context_scope}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground">Emotional Tone (comma-separated)</label>
        <input
          type="text"
          name="meta_emotional_tone"
          value={formData.meta_emotional_tone}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground">Locale</label>
        <input
          type="text"
          name="meta_locale"
          value={formData.meta_locale}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>
    </div>
  );
}