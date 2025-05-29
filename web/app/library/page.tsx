"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { UserLibraryCard } from "@/components/library/UserLibraryCard";
import type { FileEntry } from "@/components/library/types";
import { Button } from "@/components/ui/Button";
import UploadToLibrary from "@/components/library/UploadToLibrary";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LibraryPage() {
  const supabase = createClient();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [quotaUsed, setQuotaUsed] = useState(0);
  const MAX_QUOTA = 100 * 1024 * 1024; // 100MB

  const fetchFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_files")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setFiles(data);
      const totalUsed = data.reduce((sum, f) => sum + (f.size_bytes || 0), 0);
      setQuotaUsed(totalUsed);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold tracking-tight">My Library</h1>
        <Button onClick={() => setShowModal(true)}>+ Upload</Button>
      </div>

      <div className="mb-4 text-sm text-muted-foreground">
        {(quotaUsed / 1024 / 1024).toFixed(1)}MB of 100MB used
        <div className="h-2 mt-1 bg-muted rounded overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${(quotaUsed / MAX_QUOTA) * 100}%` }}
          />
        </div>
      </div>

      {/* Upload Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload a File to Your Library</DialogTitle>
          </DialogHeader>
          <UploadToLibrary
            onUpload={fetchFiles}
            onUploadComplete={() => setShowModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* File Grid */}
      {loading ? (
        <p className="text-muted-foreground">Loading files…</p>
      ) : files.length === 0 ? (
        <p className="text-muted-foreground">No files uploaded yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {files.map((file) => (
            <UserLibraryCard
              key={file.id}
              file={file}
              onDelete={fetchFiles}
              onEdit={fetchFiles}
            />
          ))}
        </div>
      )}
    </>
  );
}
