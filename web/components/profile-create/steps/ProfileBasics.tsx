"use client";

import React from "react";
import { ProfileUploadButton } from "@/components/ui/ProfileUploadButton";
import { FormData } from "../types";

interface ProfileBasicsProps {
  formData: FormData;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
}

export default function ProfileBasics({ formData, onChange }: ProfileBasicsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Display Name</label>
        <input
          name="display_name"
          value={formData.display_name}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">SNS Handle</label>
        <input
          name="sns_handle"
          value={formData.sns_handle}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
          placeholder="@yourhandle"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Primary SNS Channel</label>
        <select
          name="primary_sns_channel"
          value={formData.primary_sns_channel}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        >
          <option value="">Select channel</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="youtube">YouTube</option>
          <option value="youtube_shorts">YouTube Shorts</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Other Platforms (comma-separated)</label>
        <input
          name="platforms"
          value={formData.platforms}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
          placeholder="Instagram, YouTube Shorts"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Follower Count</label>
        <input
          name="follower_count"
          type="number"
          value={formData.follower_count}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
          placeholder="0"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Logo Upload</label>
        <ProfileUploadButton onUpload={(url) => onChange({ target: { name: "logo_url", value: url } } as any)} />
        {formData.logo_url && (
          <img src={formData.logo_url} alt="Logo" className="h-16 mt-2" />
        )}
      </div>
    </div>
  );
}