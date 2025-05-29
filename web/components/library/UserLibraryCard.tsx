// web/components/user-library/UserLibraryCard.tsx
"use client";

import React from "react";
import { createClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";

interface UserFile {
  id: string;
  file_url: string;
  file_name: string;
  label: string;
  note?: string;
  size_bytes: number;
  created_at: string;
}

interface Props {
  file: UserFile;
  onDelete: () => void; // callback to refresh the list
}

export default function UserLibraryCard({ file, onDelete }: Props) {
  const supabase = createClient();

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete "${file.label}"?`);
    if (!confirmed) return;

    // Delete from bucket
    const storagePath = file.file_url.split("/storage/v1/object/public/user-library/")[1];
    const { error: storageError } = await supabase.storage
      .from("user-library")
      .remove([storagePath]);

    // If file deleted from bucket, delete DB entry
    if (!storageError) {
      const { error: dbError } = await supabase
        .from("user_files")
        .delete()
        .eq("id", file.id);

      if (dbError) {
        alert("DB delete error: " + dbError.message);
      } else {
        onDelete(); // refresh file list
      }
    } else {
      alert("Storage delete error: " + storageError.message);
    }
  };

  const formatSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  return (
    <div className="border rounded-md p-4 shadow-sm space-y-2">
      {file.file_url.match(/\.(jpeg|jpg|png|gif|webp)$/) ? (
        <img
          src={file.file_url}
          alt={file.label}
          className="w-full h-32 object-cover rounded"
        />
      ) : (
        <div className="bg-muted p-4 text-sm text-center rounded">Non-image file</div>
      )}
      <div className="space-y-1">
        <p className="font-semibold">{file.label}</p>
        {file.note && <p className="text-sm text-muted-foreground">{file.note}</p>}
        <p className="text-xs text-muted-foreground">{formatSize(file.size_bytes)}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        className="w-full"
      >
        Delete
      </Button>
    </div>
  );
}
