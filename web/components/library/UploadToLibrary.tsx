// web/components/library/UploadToLibrary.tsx
"use client";

import React, { useRef, useState } from "react";
import { uploadFile } from "@/lib/uploadFile";
import { useUser } from "@supabase/auth-helpers-react";
import { createClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TextareaField } from "@/components/ui/TextareaField";

interface Props {
  onUploadComplete?: () => void;
  onUpload?: () => void; // <-- added this
}

export default function UploadToUserLibrary({
  onUploadComplete,
  onUpload, // ✅ Add this line
}: Props & { onUpload?: () => void }) {

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
    // 📤 Upload to Supabase bucket and get public URL
    const url = await uploadFile(file, path, "user-library");

    const { error } = await supabase.from("user_files").insert({
      user_id: user.id,
      file_url: url,
      file_name: file.name,
      label: label.trim(),
      note: note.trim() || null,
      size_bytes: file.size,
    });

    if (error) {
      throw error;
    }

    // 🧹 Reset input states
    setFile(null);
    setLabel("");
    setNote("");
    if (fileRef.current) fileRef.current.value = "";

    // ✅ Trigger callbacks after upload
    if (onUploadComplete) onUploadComplete();
    if (onUpload) onUpload(); // <-- this is what page.tsx was expecting
  } catch (err: any) {
    alert(err.message || "Upload failed");
  } finally {
    setUploading(false);
  }
};

  return (
    <div className="space-y-4 border rounded-md p-4 bg-background shadow-sm">
      <Input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf,.mp4"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
          }
        }}
      />
      <Input
        placeholder="Label (required)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <section>
      <label className="block text-sm font-medium text-gray-700">Label</label>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="e.g., Logo"
        required
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
      />
      </section>

      <section>
      <label className="block text-sm font-medium text-gray-700">Context Note (optional)</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Explain how this file should be used"
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
      />
      </section>
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
