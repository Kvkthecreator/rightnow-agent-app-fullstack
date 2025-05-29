// web/components/ui/ProfileUploadButton.tsx
"use client";
import React from "react";
import { UploadArea } from "@/components/ui/UploadArea";

interface ProfileUploadButtonProps {
  onUpload: (url: string) => void;
  label?: string;
}

export function ProfileUploadButton({
  onUpload,
  label = "Upload Logo",
}: ProfileUploadButtonProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <UploadArea
        prefix="profile_core"
        bucket="profile-core" // required: do not change, matches Supabase config
        maxFiles={1}
        onUpload={onUpload}
        maxSizeMB={5}
        accept="image/*"
        preview
        removable
        showProgress
        enableDrop
      />
    </div>
  );
}
