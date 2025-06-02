"use client";

import React from "react";
import { FormData } from "./types";

interface StepDetailsProps {
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function StepDetails({ formData, onChange }: StepDetailsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-muted-foreground">SNS Handle</label>
        <input
          type="text"
          name="sns_handle"
          value={formData.sns_handle}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground">Primary SNS Channel</label>
        <input
          type="text"
          name="primary_sns_channel"
          value={formData.primary_sns_channel}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground">Platforms (comma-separated)</label>
        <input
          type="text"
          name="platforms"
          value={formData.platforms}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground">Follower Count</label>
        <input
          type="text"
          name="follower_count"
          value={formData.follower_count}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground">Locale</label>
        <input
          type="text"
          name="locale"
          value={formData.locale}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground">Tone Preferences (comma-separated)</label>
        <input
          type="text"
          name="tone_preferences"
          value={formData.tone_preferences}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>
    </div>
  );
}