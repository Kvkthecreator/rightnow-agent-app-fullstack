"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { supabase } from "@/lib/supabaseClient";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (data: {
    type: string;
    label: string;
    content: string;
    auto?: boolean;
    meta_tags?: string;
  }) => Promise<void>;
  includeAuto?: boolean;
}

export default function BlockCreateModal({
  open,
  onOpenChange,
  onCreate,
  includeAuto = true,
}: Props) {
  const [label, setLabel] = useState("");
  const [content, setContent] = useState("");
  const [blockTypes, setBlockTypes] = useState<string[]>([]);
  const [type, setType] = useState("");
  const [auto, setAuto] = useState(true);
  const [metaTags, setMetaTags] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    // ⚠️ FIXED: semantic_type instead of type
    supabase
      .from("blocks")
      .select("semantic_type")
      .limit(50)
      .then(({ data }) => {
        if (data) {
          const vals = Array.from(new Set(data.map((d) => d.semantic_type))).sort();
          setBlockTypes(vals);
          if (!type) setType(vals[0] || "custom");
        }
      });
  }, [open]);

  async function handleSave() {
    setSaving(true);
    await onCreate({ type, label, content, auto, meta_tags: metaTags });
    setLabel("");
    setContent("");
    setMetaTags("");
    setAuto(true);
    setType(blockTypes[0] || "custom");
    setSaving(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Block</DialogTitle>
          <DialogDescription>Provide details for the new block.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground">Type</label>
            <select
              className="mt-1 w-full border rounded p-2"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {blockTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground">Label</label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground">Content</label>
            <textarea
              className="mt-1 w-full border rounded p-2"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground">Tags</label>
            <Input value={metaTags} onChange={(e) => setMetaTags(e.target.value)} />
          </div>
          {includeAuto && (
            <div className="flex items-center space-x-2">
              <input
                id="auto-toggle"
                type="checkbox"
                className="h-4 w-4"
                checked={auto}
                onChange={(e) => setAuto(e.target.checked)}
              />
              <label htmlFor="auto-toggle" className="text-sm text-muted-foreground">
                Auto-update
              </label>
            </div>
          )}
        </div>
        <DialogFooter className="pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
