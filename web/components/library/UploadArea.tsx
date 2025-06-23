//web/components/library/UploadArea.tsx

"use client";

import { useState, useRef } from "react";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabaseClient";
import { insertBlockFile } from "@/lib/insertBlockFile";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/library/progress";

export function UploadArea({ onUpload }: { onUpload: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { session } = useSessionContext();

  const handleFiles = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    const filePath = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("user-library")
      .upload(filePath, file, {
        upsert: false,
      });

    if (error) {
      alert("Upload failed.");
    } else {
      // Centralize file metadata insertion
      if (!session?.user) {
        console.warn("No user session - cannot insert metadata");
      } else {
        const url = `https://YOUR_PROJECT.supabase.co/storage/v1/object/public/user-library/${filePath}`;
        await insertBlockFile({
          user_id: session.user.id,
          file_url: url,
          label: file.name,
          file_size: file.size,
        });
      }
      onUpload(); // Trigger parent refresh
    }

    setUploading(false);
    setProgress(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-muted p-6 rounded-xl text-center cursor-pointer"
      onClick={() => inputRef.current?.click()}
    >
      {uploading ? (
        <div className="space-y-2">
          <p className="text-sm">Uploading…</p>
          <Progress value={progress} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Drag & drop or <span className="underline">click to upload</span>
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
    </div>
  );
}
