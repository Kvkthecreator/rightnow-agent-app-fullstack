// web/app/user-library/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { createClient } from "@/lib/supabaseClient";
import UploadToUserLibrary from "@/components/library/UploadToLibrary";
import UserLibraryCard from "@/components/library/UserLibraryCard";
import { Card } from "@/components/ui/Card";

interface UserFile {
  id: string;
  file_url: string;
  file_name: string;
  label: string;
  note?: string;
  size_bytes: number;
  created_at: string;
}

export default function UserLibraryPage() {
  const user = useUser();
  const [files, setFiles] = useState<UserFile[]>([]);
  const supabase = createClient();

  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from("user_files")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching files:", error.message);
      return;
    }

    setFiles(data || []);
  };

  useEffect(() => {
    if (user?.id) {
      fetchFiles();
    }
  }, [user?.id]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-semibold">Your File Library</h1>
      <Card className="p-4">
        <UploadToUserLibrary onUpload={fetchFiles} />
      </Card>
      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {files.map((f) => (
            <UserLibraryCard key={f.id} file={f} onDelete={fetchFiles} />
          ))}
        </div>
      )}
    </div>
  );
}
