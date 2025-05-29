"use client";

import React, { useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { UploadArea } from "@/components/ui/UploadArea";
import Shell from "@/components/layouts/Shell";

export default function TaskBriefCreatePage() {
  const user = useUser();
  const router = useRouter();

  const [intent, setIntent] = useState("");
  const [subInstructions, setSubInstructions] = useState("");
  const [media, setMedia] = useState<string[]>([]);

  // Redirect or guard if not authenticated
  if (!user) return null;
  const handleSubmit = async () => {
    if (!intent.trim()) {
      alert("Intent is required.");
      return;
    }

    const brief = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      user_id: user.id,
      intent,
      sub_instructions: subInstructions || "",
      media,
      created_at: new Date().toISOString(),
    };

    console.log("[DEBUG] Brief to submit:", brief);
    alert("Brief created (check console for payload)");
    router.push("/task-briefs");
  };

  return (
    <Shell>
      <div className="w-full max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-semibold">New Task Brief</h1>

      <div className="space-y-4">
        <section>
          <label className="block text-sm font-medium text-gray-700">Intent</label>
          <textarea
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="Describe your task goal"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </section>

        <section>
          <label className="block text-sm font-medium text-gray-700">Sub instructions</label>
          <textarea
            value={subInstructions}
            onChange={(e) => setSubInstructions(e.target.value)}
            placeholder="Optional additional instructions"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </section>

        <section>
          <label className="block text-sm font-medium text-gray-700">Media (max 5)</label>
          <UploadArea
            prefix="task_briefs"
            bucket="task-media"
            maxFiles={5}
            maxSizeMB={5}
            onUpload={(url) => setMedia((prev) => [...prev, url])}
            accept="*/*"
            preview
            removable
            showProgress
            enableDrop
            showPreviewGrid
            internalDragState
          />
          {media.length > 0 && (
            <div className="mt-2 space-y-1 text-sm">
              <p>Uploaded Files:</p>
              <ul className="list-disc list-inside">
                {media.map((url, i) => (
                  <li key={i}>
                    <a href={url} target="_blank" rel="noreferrer" className="underline text-primary">
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

        <div>
          <Button className="mt-6" onClick={handleSubmit}>
            Create Task Brief
          </Button>
        </div>
      </div>
    </Shell>
  );
}
