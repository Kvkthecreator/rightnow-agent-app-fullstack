"use client";

import React from "react";
import { FormData } from "./types";
import { ProfileUploadButton } from "@/components/ui/ProfileUploadButton";

interface StepBasicsProps {
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function StepBasics({ formData, onChange }: StepBasicsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-muted-foreground">Display Name</label>
        <input
          type="text"
          name="display_name"
          value={formData.display_name}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground">Brand or Company</label>
        <input
          type="text"
          name="brand_or_company"
          value={formData.brand_or_company}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>
      <div>
        <ProfileUploadButton
          onUpload={(url) => onChange({ target: { name: "logo_url", value: url } } as any)}
        />
      </div>
    </div>
  );
}