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
  if (!confirm("Are you sure you want to delete this file?")) return;

  // Extract the internal path from the public URL
  const path = file.file_url.split(`/object/public/user-library/`)[1];
  const bucket = "user-library";

  const supabase = createClient();

  // 1. Delete from Supabase storage bucket
  const { error: storageError } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (storageError) {
    alert("Failed to delete file from storage.");
    console.error(storageError);
    return;
  }

  // 2. Delete from Supabase DB table
  const { error: dbError } = await supabase
    .from("user_files")
    .delete()
    .eq("id", file.id);

  if (dbError) {
    alert("Failed to delete DB record.");
    console.error(dbError);
    return;
  }

  // 3. Callback to refresh
  onDelete?.();
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
