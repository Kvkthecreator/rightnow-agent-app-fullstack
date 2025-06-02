//web/app/briefs/create/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { UploadArea } from "@/components/ui/UploadArea";
import Shell from "@/components/layouts/Shell";
import { createClient } from "@/lib/supabaseClient";

export default function CreateBriefPage() {
  const user = useUser();
  const router = useRouter();
  const supabase = createClient();

  const [intent, setIntent] = useState("");
  const [subInstructions, setSubInstructions] = useState("");
  const [media, setMedia] = useState<string[]>([]);
  const [contextBlocks, setContextBlocks] = useState<any[]>([]);
  const [briefTypes, setBriefTypes] = useState<any[]>([]);
  const [contextBlockId, setContextBlockId] = useState("");
  const [briefTypeId, setBriefTypeId] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchOptions = async () => {
      const { data: blocks } = await supabase
        .from("context_blocks")
        .select("id, display_name")
        .eq("user_id", user.id);

      const { data: types } = await supabase
        .from("task_brief_types")
        .select("id, title");

      if (blocks) setContextBlocks(blocks);
      if (types) setBriefTypes(types);
    };

    fetchOptions();
  }, [user]);

  const handleSubmit = async () => {
    if (!intent.trim() || !contextBlockId || !briefTypeId) {
      alert("Please fill all required fields.");
      return;
    }

    const { data, error } = await supabase
      .from("task_briefs")
      .insert({
        user_id: user?.id,
        intent,
        sub_instructions: subInstructions || "",
        file_urls: media,
        context_block_id: contextBlockId,
        task_brief_type_id: briefTypeId,
      })
      .select()
      .single();

    if (error) {
      console.error("Brief creation failed:", error);
      alert("Error creating brief");
    } else {
      router.push(`/briefs/${data.id}/view`);
    }
  };

  if (!user) return null;

  return (
    <Shell>
      <div className="w-full max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">📝 New Task Brief</h1>

        <div className="space-y-4">
          <section>
            <label className="block text-sm font-medium text-gray-700">Select Context Block</label>
            <select
              className="w-full border rounded p-2"
              value={contextBlockId}
              onChange={(e) => setContextBlockId(e.target.value)}
            >
              <option value="">— Select a Block —</option>
              {contextBlocks.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.display_name}
                </option>
              ))}
            </select>
          </section>

          <section>
            <label className="block text-sm font-medium text-gray-700">Select Task Type</label>
            <select
              className="w-full border rounded p-2"
              value={briefTypeId}
              onChange={(e) => setBriefTypeId(e.target.value)}
            >
              <option value="">— Select Task Type —</option>
              {briefTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.title}
                </option>
              ))}
            </select>
          </section>

          <section>
            <label className="block text-sm font-medium text-gray-700">Intent</label>
            <textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="Describe your task goal"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </section>

          <section>
            <label className="block text-sm font-medium text-gray-700">Sub instructions</label>
            <textarea
              value={subInstructions}
              onChange={(e) => setSubInstructions(e.target.value)}
              placeholder="Optional additional instructions"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </section>

          <section>
            <label className="block text-sm font-medium text-gray-700">Media (max 5)</label>
            <UploadArea
              prefix="task_briefs"
              bucket="task-media"
              maxFiles={5}
              maxSizeMB={5}
              accept="*/*"
              preview
              removable
              showProgress
              enableDrop
              showPreviewGrid
              internalDragState
              onUpload={(url) => setMedia((prev) => [...prev, url])}
            />
          </section>
        </div>

        <Button className="mt-6" onClick={handleSubmit}>
          Create Task Brief
        </Button>
      </div>
    </Shell>
  );
}
