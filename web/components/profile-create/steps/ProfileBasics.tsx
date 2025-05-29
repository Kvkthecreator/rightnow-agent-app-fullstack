// web/components/profile-create/steps/ProfileBasics.tsx
"use client";
import React from "react";
import { FormData } from "../types";
import { ProfileUploadButton } from "@/components/ui/ProfileUploadButton";

interface Props {
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function ProfileBasics({ formData, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-muted-foreground">
          Display Name
        </label>
        <input
          type="text"
          name="display_name"
          value={formData.display_name}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground">
          Brand or Company
        </label>
        <input
          type="text"
          name="brand_or_company"
          value={formData.brand_or_company}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground">
          SNS Handle
        </label>
        <input
          type="text"
          name="sns_handle"
          value={formData.sns_handle}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground">
          Primary SNS Channel
        </label>
        <input
          type="text"
          name="primary_sns_channel"
          value={formData.primary_sns_channel}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground">
          Platforms
        </label>
        <input
          type="text"
          name="platforms"
          value={formData.platforms}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground">
          Follower Count
        </label>
        <input
          type="text"
          name="follower_count"
          value={formData.follower_count}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>

      <ProfileUploadButton
        onUpload={(url) => onChange({
          target: { name: "logo_url", value: url }
        } as any)}
      />
    </div>
  );
}
