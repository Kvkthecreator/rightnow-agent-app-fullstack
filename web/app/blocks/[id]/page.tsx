"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import BlockDetailLayout from "@/components/blocks/BlockDetailLayout";
import { fetchBlock, updateBlock, deleteBlock } from "@/lib/supabase/blocks";
import { createClient } from "@/lib/supabaseClient";
import { getActiveWorkspaceId } from "@/lib/workspace";

export default function BlockDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [blockId, setBlockId] = useState<string | null>(null);
  const [block, setBlock] = useState<any | null>(null);
  const [edit, setEdit] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: "",
    semantic_type: "",
    content: "",
    meta_tags: "",
  });

  // Unwrap the promise-based params in Next 15
  useEffect(() => {
    (async () => {
      const { id } = await params;
      setBlockId(id);
    })();
  }, [params]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const ws = await getActiveWorkspaceId(supabase, user?.id);
      setWorkspaceId(ws);
    })();
  }, [supabase]);

  useEffect(() => {
    if (!blockId || !workspaceId) return;
    const load = async () => {
      const { data } = await fetchBlock(blockId, workspaceId);
      if (data) {
        setBlock(data);
        setForm({
          label: data.label || "",
          semantic_type: data.semantic_type || "",
          content: data.content || "",
          meta_tags: (data.meta_tags || []).join(", "),
        });
      }
    };
    load();
  }, [blockId, workspaceId]);

  const handleSave = async () => {
    if (!block) return;
    await updateBlock(block.id, {
      label: form.label,
      semantic_type: form.semantic_type,
      content: form.content,
      meta_tags: form.meta_tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setBlock({ ...block, ...form, meta_tags: form.meta_tags.split(",").map((t) => t.trim()).filter(Boolean) });
    setEdit(false);
  };

  const handleCancel = () => {
    if (!block) return;
    setForm({
      label: block.label || "",
      semantic_type: block.semantic_type || "",
      content: block.content || "",
      meta_tags: (block.meta_tags || []).join(", "),
    });
    setEdit(false);
  };

  const handleDelete = async () => {
    if (!block) return;
    await deleteBlock(block.id);
    router.push("/blocks");
  };

  if (!block) return <div className="p-6">Loading…</div>;

  return (
    <BlockDetailLayout>
      <h1 className="text-2xl font-bold mb-4">Block Detail</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground">Title</label>
          <Input
            value={form.label}
            disabled={!edit}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground">Type</label>
          <Input
            value={form.semantic_type}
            disabled={!edit}
            onChange={(e) => setForm({ ...form, semantic_type: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground">Tags</label>
          <Input
            value={form.meta_tags}
            disabled={!edit}
            onChange={(e) => setForm({ ...form, meta_tags: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground">Body</label>
          <textarea
            className="mt-1 w-full border rounded p-2"
            rows={6}
            value={form.content}
            disabled={!edit}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
        </div>
      </div>
      <div className="pt-4 space-x-2">
        {edit ? (
          <>
            <Button size="sm" onClick={handleSave}>Save</Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
          </>
        ) : (
          <Button size="sm" onClick={() => setEdit(true)}>Edit</Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 hover:bg-red-50 hover:text-red-800 border-red-300"
          onClick={handleDelete}
        >
          Delete
        </Button>
      </div>
    </BlockDetailLayout>
  );
}
