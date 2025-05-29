// web/components/ui/ProfileUploadButton.tsx
"use client";

import { uploadFile } from "@/lib/upload";
import { Button } from "./Button";

export function ProfileUploadButton({
  onUpload,
  prefix = "profile_core",
}: {
  onUpload: (url: string) => void;
  prefix?: string;
}) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    try {
      const filename = `${Date.now()}-${file.name}`;
      const path = `${prefix}/${filename}`;
      const url = await uploadFile(file, path, "task-media");
      onUpload(url);
    } catch (err) {
      console.error("Upload error", err);
      alert("Upload failed");
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        id="profile-logo-input"
      />
      <label htmlFor="profile-logo-input">
        <Button variant="outline">Upload Logo</Button>
      </label>
    </div>
  );
}
