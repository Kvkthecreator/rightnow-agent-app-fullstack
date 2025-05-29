//web/components/library/UploadToLibrary.tsx

"use client";

import React, { useRef, useState } from "react";
import { uploadFile } from "@/lib/uploadFile";
import { useUser } from "@supabase/auth-helpers-react";
import { createClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Props {
  onUploadComplete?: () => void;
  onUpload?: () => void;
}

export default function UploadToUserLibrary({
  onUploadComplete,
  onUpload,
}: Props) {
  const user = useUser();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file || !label.trim()) {
      alert("File and label are required.");
      return;
    }

    if (!user) {
      alert("You must be logged in.");
      return;
    }

    setUploading(true);

    const filename = `${Date.now()}-${file.name}`;
    const path = `user_${user.id}/${filename}`;

    try {
      // Upload to Supabase Storage and get public URL
      const url = await uploadFile(file, path, "user-library");

      const { error } = await supabase.from("user_files").insert({
        user_id: user.id,
        file_url: url,
        file_name: file.name,
        label: label.trim(),
        note: note.trim() || null,
        size_bytes: file.size,
      });

      if (error) throw error;

      // Reset input state
      setFile(null);
      setLabel("");
      setNote("");
      if (fileRef.current) fileRef.current.value = "";

      if (onUploadComplete) onUploadComplete();
      if (onUpload) onUpload();
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 border rounded-2xl p-6 bg-card shadow-sm">
      <Input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf,.mp4"
        onChange={(e) => {
          if (e.target.files?.[0]) setFile(e.target.files[0]);
        }}
      />
      <div className="space-y-1">
        <label className="block text-sm font-medium text-muted-foreground">Label <span className="text-destructive">*</span></label>
        <Input
          placeholder="e.g. Logo, Brand Guide"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-muted-foreground">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Explain how this file should be interpreted or used"
          className="w-full px-3 py-2 border border-muted rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        />
      </div>

      {file && file.type.startsWith("image/") && (
        <div className="relative w-full max-h-64 overflow-hidden rounded-md border border-muted mb-2">
          <img
            src={URL.createObjectURL(file)}
            alt="Preview"
            className="object-contain w-full h-full"
          />
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={uploading}
        className="w-full"
      >
        {uploading ? "Uploading…" : "Upload to Library"}
      </Button>
    </div>
  );
}
