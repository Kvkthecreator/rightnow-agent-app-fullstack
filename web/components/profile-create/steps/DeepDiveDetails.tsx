"use client";

import React from "react";
import { FormData } from "../types";

interface Props {
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function DeepDiveDetails({ formData, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-muted-foreground">
          Tone Preferences (comma-separated)
        </label>
        <input
          type="text"
          name="tone_preferences"
          value={formData.tone_preferences}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground">
          Locale
        </label>
        <input
          type="text"
          name="locale"
          value={formData.locale}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>

    </div>
  );
}
