// web/components/user-library/UserLibraryCard.tsx
"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { TextareaField } from "@/components/ui/TextareaField";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabaseClient";
import { Trash2, Pencil, Check, X } from "lucide-react";
import type { FileEntry } from "./types";

interface Props {
  file: FileEntry;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function UserLibraryCard({ file, onDelete, onEdit }: Props) {
  const [editing, setEditing] = React.useState(false);
  const [label, setLabel] = React.useState(file.label);
  const [note, setNote] = React.useState(file.note || "");
  const [loading, setLoading] = React.useState(false);
  const supabase = createClient();

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("user_files")
      .update({ label, note: note || null })
      .eq("id", file.id);

    setLoading(false);
    if (error) return alert("Update failed");
    setEditing(false);
    if (onEdit) onEdit();
  };

  const handleCancel = () => {
    setLabel(file.label);
    setNote(file.note || "");
    setEditing(false);
  };

  const handleDelete = async () => {
    const confirmed = confirm("Delete this file?");
    if (!confirmed) return;

    setLoading(true);
    const path = file.file_url.split("/storage/v1/object/public/user-library/")[1];

    // Delete from bucket
    const { error: storageErr } = await supabase.storage
      .from("user-library")
      .remove([path]);

    // Delete from DB
    const { error: dbErr } = await supabase
      .from("user_files")
      .delete()
      .eq("id", file.id);

    setLoading(false);

    if (storageErr || dbErr) {
      alert("Error deleting file.");
    } else {
      if (onDelete) onDelete();
    }
  };

  return (
    <div className="rounded-lg border p-4 bg-card text-card-foreground shadow-sm space-y-3">
      <div className="flex justify-between items-start">
        <div className="text-sm text-muted-foreground">{file.file_name}</div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={handleSave}
                aria-label="Save"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              aria-label="Edit"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            aria-label="Delete"
            disabled={loading}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="aspect-video overflow-hidden rounded bg-muted border">
        <img
          src={file.file_url}
          alt={file.label}
          className="object-cover w-full h-full"
        />
      </div>

      {editing ? (
        <>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        <TextareaField
          control={
            {
              // Stub out just enough of react-hook-form's control object
              register: () => ({ name: "note" }),
              getFieldState: () => ({
                isDirty: false,
                invalid: false,
                isTouched: false,
                isValidating: false,
                error: undefined,
              }),
            } as any // Cast to bypass full RHF requirement
          }
          name="note"
          label="Note"
          placeholder="Optional context"
          disabled={false}
        />
        </>
      ) : (
        <>
          <div className="text-base font-medium">{file.label}</div>
          {file.note && <p className="text-sm text-muted-foreground">{file.note}</p>}
          <div className="text-xs text-muted-foreground">
            {(file.size_bytes / 1024).toFixed(1)} KB
          </div>
        </>
      )}
    </div>
  );
}
